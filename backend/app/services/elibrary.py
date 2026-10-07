"""Keyword detection + asset lookups ported unchanged from app.py:
e-library queries, BI product detection, campaign/fund keyword lists."""
import os

from . import storage

# Keywords that mean "also answer the question, then add download links"
BOTH_KEYWORDS = ["benefits", "features", "topfeatures", "feature", "benefit", "topfeature"]

FUND_KEYWORDS = ["nfl midcap fund", "mid cap fund", "mid-cap fund", "midcap fund"]

CAMPAIGN_KEYWORDS = [
    "august ace", "aug ace", "ace august", "august campaign", "aug campaign",
    "campaign", "campaign target", "target for august", "august target",
    "aug target", "monthly campaign", "august incentive", "ace campaign",
]


def is_elibrary_query(user_q: str):
    one_pager = ["one page", "onepage", "one-page", "one pager", "onepager", "one-pager", "brochure", "product brochure", "productbrochure", "marketing brochure", "marketingbrochure", "leaflet", "brochure leaflet", "brochureleaflet"]
    give_get = ["give get", "giveget"]
    all_kw = ["content", "content material", "contentmaterial", "content document", "contentdocument", "creative", "creative material", "creativematerial", "creative document", "creativedocument", "material", "marketing material", "marketingmaterial", "product library", "productlibrary"]
    documents = ["document", "marketing document", "marketingdocument", "product document", "productdocument"]
    benefits = ["usp", "get usp", "getusp", "give usp", "giveusp", "usp document", "uspdocument", "benefits", "features", "topfeatures", "feature", "benefit", "topfeature"]
    video = ["video", "video document", "videodocument", "video brochure", "videobrochure", "av document", "avdocument"]
    q = user_q.lower()
    type_of_docs = set()
    if any(keyword in q for keyword in one_pager):
        type_of_docs.add("one pager")
    if any(keyword in q for keyword in give_get):
        type_of_docs.add("give get")
    if any(keyword in q for keyword in all_kw):
        type_of_docs.update({"one pager", "give get", "video", "benefit"})
    if any(keyword in q for keyword in documents):
        type_of_docs.update({"one pager", "give get", "benefit"})
    if any(keyword in q for keyword in benefits):
        type_of_docs.update("benefit")
    if any(keyword in q for keyword in video):
        type_of_docs.add("video")

    if len(type_of_docs) == 0:
        return False, None
    return True, type_of_docs


def display_name(filename: str) -> str:
    return os.path.splitext(filename)[0]


def get_file_icon(filename: str) -> str:
    ext = filename.lower()
    if ext.endswith(".pdf"):
        return "picture_as_pdf"
    if ext.endswith((".mp4", ".mov", ".avi", ".mkv")):
        return "smart_display"
    if ext.endswith((".jpg", ".jpeg", ".png", ".gif", ".webp")):
        return "image"
    if ext.endswith((".ppt", ".pptx")):
        return "slideshow"
    if ext.endswith((".doc", ".docx")):
        return "description"
    if ext.endswith((".xls", ".xlsx")):
        return "grid_on"
    return "insert_drive_file"


def get_all_assets_for_product(product_folder: str, type_of_docs) -> list:
    files = storage.list_files_in_folder(product_folder)
    files_selected = {
        file
        for file in files
        if any(keyword.lower() in file.lower() for keyword in type_of_docs)
    }
    download_links = []
    for file_key in files_selected:
        url = storage.generate_forced_download_url(file_key)
        filename = file_key.split("/")[-1]
        download_links.append(
            {
                "name": display_name(filename),
                "url": url,
                "icon": get_file_icon(filename),
            }
        )
    return download_links


def detect_bi_product(query: str):
    query = query.lower()
    product_aliases = {
        "iInvest Ultima Plus": ["ultima"],
        "GIP": ["gip", "guaranteed income plan"],
        "iGuarantee Vishwas": ["igv", "iguarantee", "vishwas"],
        "Secure N Grow": ["secure n grow", "secure and grow", "sng", "secure & grow", "securengrow", "secure grow"],
    }

    if not ("bi" in query or "edm" in query or "illustration" in query):
        return None

    for product, aliases in product_aliases.items():
        for alias in aliases:
            if alias in query:
                return product
    return None


def is_sensitive_query(text: str):
    """Compliance stub — mirrors app.py where all layers are disabled."""
    return False, None, []
