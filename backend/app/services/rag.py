"""RAG engine ported from app.py's ProductAdvisor.

Differences from the Streamlit version:
- Process-wide singleton (FAISS index + LLM loaded once at startup) instead of
  one instance per Streamlit session.
- Conversation memory is stateless: the caller passes the recent history from
  the stored S3 session, replacing ConversationBufferWindowMemory(k=3).
- The product list is computed once (the FAISS index is static per deploy).
"""
import json
from functools import lru_cache

from langchain.embeddings.base import Embeddings
from langchain_community.vectorstores import FAISS
from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq

from ..config import ROOT_DIR, get_sagemaker_client, get_settings
from .prompts import QUERY_REWRITE_PROMPT, SYSTEM_PROMPT

MEMORY_TURNS = 3  # matches ConversationBufferWindowMemory(k=3)


class SageMakerEmbeddings(Embeddings):
    def __init__(self, endpoint_name=None):
        self.endpoint_name = endpoint_name or get_settings().SAGEMAKER_ENDPOINT
        try:
            self.client = get_sagemaker_client()
        except Exception as e:
            print(f"SageMaker client init failed: {e}")
            self.client = None
        self.dimension = 1024

    def __call__(self, text):
        return self.embed_documents(text) if isinstance(text, list) else self.embed_query(text)

    def embed_documents(self, texts):
        return self._invoke(texts)

    def embed_query(self, text):
        return self._invoke([text])[0]

    def _invoke(self, texts):
        if not self.client:
            print("No SageMaker client available")
            return [[0.0] * self.dimension for _ in texts]
        try:
            payload = {"inputs": texts}
            resp = self.client.invoke_endpoint(
                EndpointName=self.endpoint_name,
                ContentType="application/json",
                Body=json.dumps(payload),
            )
            result = json.loads(resp["Body"].read().decode())

            vecs = result
            if isinstance(vecs, dict) and "embeddings" in vecs:
                vecs = vecs["embeddings"]
            while isinstance(vecs, list) and len(vecs) == 1 and isinstance(vecs[0], list):
                vecs = vecs[0]

            if isinstance(vecs, list) and isinstance(vecs[0], list):
                self.dimension = len(vecs[0])
                return vecs

            print(f"Unexpected response shape: {type(result)} -> {str(result)[:100]}")
            return [[0.0] * self.dimension for _ in texts]
        except Exception as e:
            print(f"SageMaker invocation failed: {e}")
            return [[0.0] * self.dimension for _ in texts]


def history_to_messages(history: list) -> list:
    """Convert stored session history (role/content dicts) to the last
    MEMORY_TURNS user+assistant exchanges as LangChain messages."""
    messages = []
    for msg in history:
        content = msg.get("content") or ""
        if msg.get("role") == "user":
            messages.append(HumanMessage(content=content))
        elif msg.get("role") == "assistant":
            messages.append(AIMessage(content=content))
    return messages[-(MEMORY_TURNS * 2):]


class ProductAdvisor:
    def __init__(self):
        settings = get_settings()
        self.embeddings = SageMakerEmbeddings()
        self.llm = ChatGroq(
            groq_api_key=settings.GROQ_API_KEY,
            model_name=settings.MODEL_NAME,
            temperature=0,
            max_tokens=None,
            timeout=None,
            max_retries=2,
        )
        self.vectorstore = FAISS.load_local(
            str(ROOT_DIR / "faiss_index"),
            self.embeddings,
            allow_dangerous_deserialization=True,
        )
        self.retriever = self.vectorstore.as_retriever(
            search_type="mmr",
            search_kwargs={"k": 35, "fetch_k": 100, "lambda_mult": 0.95},
        )
        self.query_rewrite_prompt = QUERY_REWRITE_PROMPT
        self.prompt_template = ChatPromptTemplate.from_template(SYSTEM_PROMPT)
        self.product_names = self._list_all_products()

    def _list_all_products(self):
        try:
            docs = self.vectorstore.similarity_search("", k=1000)
            product_names = set()
            for doc in docs:
                if "product_name" in doc.metadata:
                    product_names.add(doc.metadata["product_name"])
            return sorted(product_names)
        except Exception as e:
            print(f"Error getting product names: {e}")
            return []

    def rewrite_query_for_retrieval(self, question, product_list):
        try:
            rewrite_prompt = ChatPromptTemplate.from_template(self.query_rewrite_prompt)
            rewrite_chain = rewrite_prompt | self.llm
            response = rewrite_chain.invoke(
                {"product_list": product_list, "query": question}
            )
            return response.content.strip()
        except Exception as e:
            print(f"Query rewriting failed: {e}, using original query")
            return question

    def detect_products(self, question):
        product_list = self.product_names
        classifier_prompt = f"""
        You are a classifier. Identify which products appear in the user query.
        Only return product names from this list: {product_list}.
        Map nicknames:
        - GIP, guaranteed income plan - Guaranteed Income Plan
        - iterm, term plan, rop, return of premium - iTerm Return of Premium
        - igV, iGV, iguarantee Vishwas - iGuarantee Vishwas, likewise all eligible product names from the list above etc.
        Return JSON: {{"products": []}}
        """
        resp = self.llm.invoke(
            [
                {"role": "system", "content": classifier_prompt},
                {"role": "user", "content": question},
            ]
        )
        try:
            data = json.loads(resp.content)
            return data.get("products", [])
        except Exception as e:
            print("Classification parse error:", e)
            return []

    def get_response(self, question: str, chat_history: list):
        """chat_history: recent role/content dicts from the stored session."""
        try:
            product_list = (
                ", ".join(self.product_names)
                if self.product_names
                else "No products available"
            )
            rewritten_query = self.rewrite_query_for_retrieval(question, product_list)
            retrieved_docs = self.retriever.invoke(rewritten_query)

            result = self.llm.invoke(
                self.prompt_template.format_messages(
                    context=retrieved_docs,
                    chat_history=history_to_messages(chat_history),
                    input=question,
                    product_list=product_list,
                )
            )
            detected_products = self.detect_products(question)
            return result.content, detected_products
        except Exception as e:
            return f"An error occurred: {str(e)}. Please try again.", []


@lru_cache(maxsize=1)
def get_advisor() -> ProductAdvisor:
    return ProductAdvisor()
