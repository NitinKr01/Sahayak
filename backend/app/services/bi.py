"""Benefit Illustration: wraps the unchanged bi_premium (quote API) and
bi_image (PIL creative) modules. The image is returned as base64 and never
persisted — same as the Streamlit app, which stripped bi_image on save."""
import base64
from datetime import date
from io import BytesIO

from ..config import get_settings
from . import bi_image, bi_premium

PRODUCTS = ["iInvest Ultima Plus", "GIP", "iGuarantee Vishwas", "Secure N Grow"]


def generate_bi(product: str, form_data: dict) -> str:
    """Returns the BI creative as a base64-encoded JPEG."""
    fd = dict(form_data)
    dob = fd.get("dob")
    if isinstance(dob, str):
        fd["dob"] = date.fromisoformat(dob)

    # get_premium mutates bi_secrets for Secure N Grow (swaps in the combi
    # URL); pass a copy so the cached settings dict is never altered.
    response = bi_premium.get_premium(product, fd, dict(get_settings().BI_SECRETS))
    image = bi_image.generate_bi_image(fd, response, product)

    buf = BytesIO()
    image.convert("RGB").save(buf, format="JPEG", quality=90)
    return base64.b64encode(buf.getvalue()).decode()
