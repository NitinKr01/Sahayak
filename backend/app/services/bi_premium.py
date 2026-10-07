import requests
from datetime import datetime, date
from typing import Dict, Any

# =========================
# CONSTANT MAPS
# =========================
API_FUNDS = [
    {"code": "ACCELERATOR", "name": "ACCELERATOR FUND"},
    {"code": "BLUECHIP", "name": "BLUE CHIP EQUITY FUND"},
    {"code": "FLEXICAP", "name": "FLEXI CAP FUND"},
    {"code": "STABLE", "name": "STABLE FUND"},
    {"code": "OPPORTUNITY", "name": "OPPORTUNITY FUND"},
    {"code": "SF", "name": "SECURE FUND"},
    {"code": "DB", "name": "DEBT FUND"},
    {"code": "LIQUID", "name": "LIQUID FUND"},
    {"code": "MIDCAP", "name": "MIDCAP FUND"},
    {"code": "MULTICAP", "name": "MULTI CAP FUND"},
]

PORTFOLIO_STRATEGY_MAP = {
    "SELF MANAGED (New Multicap Cap Fund)": "SELFMANAGED_NFO",
    "SELF MANAGED (New Mid Cap Fund)": "SELFMANAGED_NFO",
    "SELF MANAGED (Aggressive)": "SELFMANAGED_AGGRESSIVE",
    "SELF MANAGED (Balanced)": "SELFMANAGED_BALANCED",
    "SELF MANAGED (Conservative)": "SELFMANAGED_CONSERVATIVE",
    "LIFESTYLE": "LIFESTYLE"
}

# =========================
# AUTH
# =========================

def get_access_token(CLIENT_AUTH_HEADER, AUTH_URL) -> str:
    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": CLIENT_AUTH_HEADER,
    }
    payload = {"grant_type": "client_credentials"}

    response = requests.post(AUTH_URL, headers=headers, data=payload, timeout=10)
    response.raise_for_status()
    return response.json()["access_token"]

# =========================
# HELPERS
# =========================

def build_funds_payload(fund_allocation: dict) -> list:
    funds = []

    for fund in API_FUNDS:
        percentage = float(fund_allocation.get(fund["name"], 0.0))

        funds.append({
            "fundCode": fund["code"],
            "fundName": fund["name"],
            "percentage": round(percentage, 2),
        })

    return funds

def format_dob(dob) -> str:
    return dob.strftime("%Y-%m-%d")

# =========================
# PAYLOAD BUILDER
# =========================

def build_payload_ultima_plus(form_data: dict) -> dict:
    return {
        "fundsOpted": {
            "autoFundSwitchConsent": True,
            "funds": build_funds_payload(form_data["fund_allocation"]),
            "portfolio": "LIFESTYLE" if form_data["portfolio_strategy"] == "LIFESTYLE" else "SELFMANAGED",
            "portfolioStrategy": PORTFOLIO_STRATEGY_MAP[form_data["portfolio_strategy"]],
        },
        "insuranceDetail": None,
        "insured": {
            "dateOfBirth": form_data["dob"].strftime("%Y-%m-%d"),
            "gender": "M" if form_data["gender"] == "Male" else "F",
            "insuredLocation": "MH",
            "occupation": "SALARIED",
        },
        "policyHolder": {
            "policyHolderLocation": "MH",
            "relationToInsured": "SELF",
        },
        "policyInfo": {
            "coverages": [{
                "code": "ARMP0000150",
                "coverageClass": "DB",
                "premium": form_data["premium"],
                "sumAssured": 0,
            },
            *([{
                "code": "BLLADBV1",
                "coverageClass": "AD",
                "minSumAssured": 25000,
                "maxSumAssured": 3000000 if form_data.get("rider_type") == "Classic Option" else 1000000,
                "sumAssuredInMultiple": 1000,
                "coverageType": "RIDER",
                "coverageSequence": 1,
                "sumAssured": form_data.get("rider_sum_assured"),
                "benefitOption": "CLASSIC" if form_data.get("rider_type") == "Classic Option" else "PREMIUM",
                "coverageTerm": form_data.get("rider_age"),
                }] if form_data.get("rider") == "Yes" else [])
            ],
            "discountingFactors": {"discountType": 0},
            "healthInfo": {
                "smokerType": "NON_SMOKER" if form_data["smoker"] == "No" else "STANDARD"
            },
            "paymentInfo": {
                "autoDebit": "N",
                "paymentFrequency": "YEARLY",
                "premiumPayingTerm": form_data["premium_paying_term"],
                "premiumPayOption": "YEAR",
            },
            "planIncomeInfo": {
                "bonusAccrual": False,
                "incomeAccrual": False,
                "payoutFrequency": "MONTHLY",
                "payoutOption": "",
                "payoutDate": ""
            },
            "policyStartDate": datetime.today().strftime("%Y-%m-%d"),
            "policyTerm": form_data["policy_term"],
            "policyTermOption": "YEAR",
            "product": {
                "offerType": "",
                "fundStrategy": PORTFOLIO_STRATEGY_MAP[form_data["portfolio_strategy"]],
                "saInMultiple": form_data["sum_assured_multiple"],
                "schemeCode": "ARMP0000150",
            },
        },
        "relationToInsured": "SELF",
        "tenantId": "BANDHANBANK",
    }

def build_payload_secure(form_data: dict) -> dict:
    return {
        "fundsOpted": {
            "funds": build_funds_payload(form_data["fund_allocation"]),
            "portfolio": "LIFESTYLE" if form_data["portfolio_strategy"] == "LIFESTYLE" else "SELFMANAGED",
            "portfolioStrategy": PORTFOLIO_STRATEGY_MAP[form_data["portfolio_strategy"]],
        },
        "insuranceDetail": None,
        "insured": {
            "dateOfBirth": form_data["dob"].strftime("%Y-%m-%d"),
            "gender": "M" if form_data["gender"] == "Male" else "F",
            "insuredLocation": "MH",
            "occupation": "SALARIED",
        },
        "policyHolder": {
            "policyHolderLocation": "MH",
            "relationToInsured": "SELF",
        },
        "policyInfo": {
            "coverages": [{
                "code": "CMB12614601",
                "coverageClass": "DB",
                "premium": form_data["premium"],
                "sumAssured": 0,
            }],
            "discountingFactors": {"discountType": 0},
            "healthInfo": {
                "smokerType": "NON_SMOKER"
            },
            "paymentInfo": {
                "autoDebit": "N",
                "paymentFrequency": "YEARLY",
                "premiumPayingTerm": form_data["premium_paying_term"],
                "premiumPayOption": "YEAR",
            },
            "planIncomeInfo": {
                "bonusAccrual": False,
                "incomeAccrual": False,
                "payoutFrequency": "MONTHLY",
                "payoutOption": "",
                "payoutDate": ""
            },
            "policyStartDate": datetime.today().strftime("%Y-%m-%d"),
            "policyTerm": form_data["policy_term"],
            "existingPosSumAssured": form_data["pos_sum_assured"],
            "product": {
                "offerType": "",
                "fundStrategy": PORTFOLIO_STRATEGY_MAP[form_data["portfolio_strategy"]],
                "saInMultiple": form_data["sum_assured_multiple"],
                "schemeCode": "CMB12614601",
            },
        },
        "relationToInsured": "SELF",
        "tenantId": "BANDHANBANK",
    }

def build_payload_gip(form_data: dict) -> dict:
    return {
        "policyInfo": {
            "policyStartDate": datetime.today().strftime("%Y-%m-%d"),
            "policyTerm": form_data["policy_term"],
            "product": {
                "schemeCode": "ARMP0000137",
                "offerType": ""
            },
            "healthInfo": {
                "smokerType": "NON_SMOKER" if form_data["smoker"] == "No" else "STANDARD"
            },
            "paymentInfo": {
                "premiumPayingTerm": form_data["premium_paying_term"],
                "premiumPayOption": "YEAR",
                "autoDebit": "N",
                "paymentFrequency": "YEARLY"
            },
            "discountingFactors": {
                "discountType": 0
            },
            "coverages": [
            {
                "code": "ARMP0000137",
                "coverageClass": "DB",
                "sumAssured": 0,
                "premium": form_data["premium"]
            }],
            "planIncomeInfo": {
                "payoutFrequency": "HALF_YEARLY" if form_data["payout_frequency"] == "Half Yearly" else form_data["payout_frequency"].upper(),
                "payoutDate": None,
                "incomeOption": "FLEXI_START" if form_data["plan"] == "Flexi Start" else "EXTENDED_BENEFIT",
                "defermentPeriod": form_data["deferment_period"],
                "incomePeriod": form_data["income_period"],
                "accumulationPeriod": form_data["accumulation_period"],
                "advanceIncomeOption": form_data["advance_income_option"],
                "returnOfPremPercentage": form_data["rop"],
            }
        },
        "insured": {
            "dateOfBirth": form_data["dob"].strftime("%Y-%m-%d"),
            "gender": "TG" if form_data["gender"] == "Other" else form_data["gender"][0],
            "insuredLocation": "MH"
        },
        "policyHolderLocation": "MH",
        "relationToInsured": "SELF",
        "policyHolder": {
            "policyHolderLocation": "MH",
            "relationToInsured": "SELF"
        },
        "tenantId": "BANDHANBANK"
    }

def build_payload_igv(form_data):
    return {
        "policyInfo": {
            "policyStartDate": datetime.today().strftime("%Y-%m-%d"),
            "policyTerm": form_data["policy_term"],
            "product": {
                "schemeCode": "ARMP0000146",
                "offerType": ""
            },
            "healthInfo": {
                "smokerType": "NON_SMOKER" if form_data["smoker"] == "No" else "STANDARD"
            },
            "paymentInfo": {
                "premiumPayingTerm": form_data["premium_paying_term"],
                "premiumPayOption": "YEAR",
                "autoDebit": "N",
                "paymentFrequency": "YEARLY"
            },
            "discountingFactors": {
                "discountType": 0
            },
            "coverages": [
            {
                "code": "ARMP0000146",
                "coverageClass": "DB",
                "sumAssured": 0,
                "premium": form_data["premium"]
            }]
        },
        "insured": {
            "dateOfBirth": form_data["dob"].strftime("%Y-%m-%d"),
            "gender": "TG" if form_data["gender"] == "Other" else form_data["gender"][0],
            "insuredLocation": "MH"
        },
        "policyHolderLocation": "MH",
        "relationToInsured": "SELF",
        "policyHolder": {
            "policyHolderLocation": "MH",
            "relationToInsured": "SELF"
        },
        "tenantId": "BANDHANBANK"
    }
# =========================
# MAIN SERVICE
# =========================
def get_premium(product : str, form_data: dict, bi_secrets):
    if product == "GIP":
        payload = build_payload_gip(form_data)

    elif product == "iGuarantee Vishwas":
        payload = build_payload_igv(form_data)

    elif product == "Secure N Grow":
        payload = build_payload_secure(form_data)
        bi_secrets["BI_QUOTE_URL"] = bi_secrets["BI_COMBI_URL"]

    elif product == "iInvest Ultima Plus":
        payload = build_payload_ultima_plus(form_data)
    else:
        raise ValueError(f"Unsupported product: {product}")

    return _call_bi_api(payload, bi_secrets)

def _call_bi_api(payload: dict, bi_secrets):
    token = get_access_token(bi_secrets["BI_CLIENT_AUTH_HEADER"], bi_secrets["BI_AUTH_URL"])
    headers = {
        **bi_secrets["HEADER_BI_API"],
        "Authorization": f"Bearer {token}",
        "x-api-key": bi_secrets["BI_X_API_KEY"],
    }

    response = requests.post(
        bi_secrets["BI_QUOTE_URL"],
        headers=headers,
        json=payload,
        timeout=15,
    )

    response.raise_for_status()
    return response.json()

def call_bi_api_tester_qa(payload: dict):
    bi_secrets = {"BI_CLIENT_AUTH_HEADER":"Basic MnM3cGszazN2aWZtbmdrdTFqOGxwMXA0NjU6MXVlaW40bXQ4ajgzbGprOGNrOXAwdGs1aWhsaG1ybDZiamYxb3MwZDFsc292ZDJndGFmNA==",
    "BI_AUTH_URL":"https://auth.qa-bandhanlife.com/oauth2/token",
    "BI_QUOTE_URL":"https://service-api.qa-bandhanlife.com/proposal/retail/quotation",
    "BI_X_API_KEY":"QGNKilZJ6L5zvXsLGKX8841x4oKiEkkh97SfLSpv",
    "HEADER_BI_API":{"Content-Type":"application/json","User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; Win64)"}}

    token = get_access_token(bi_secrets["BI_CLIENT_AUTH_HEADER"], bi_secrets["BI_AUTH_URL"])
    headers = {
        **bi_secrets["HEADER_BI_API"],
        "Authorization": f"Bearer {token}",
        "x-api-key": bi_secrets["BI_X_API_KEY"],
    }
    response = requests.post(
        bi_secrets["BI_QUOTE_URL"],
        headers=headers,
        json=payload,
        timeout=15,
    )
    response.raise_for_status()
    return response.json()

if __name__ == "__main__":
    sample_input = {'gender': 'Male', 'dob': date(2008, 7, 22), 'age': 18, 'smoker': 'No', 'premium': 100000, 'payment_frequency': 'Yearly', 'policy_term': 40, 'premium_paying_term': 20, 'sum_assured_multiple': 10, 'portfolio_strategy': 'SELF MANAGED (New Multicap Cap Fund)', 'fund_allocation': {'MIDCAP FUND': 0, 'MULTI CAP FUND': 100, 'FLEXI CAP FUND': 0, 'ACCELERATOR FUND': 0, 'BLUE CHIP EQUITY FUND': 0, 'STABLE FUND': 0, 'OPPORTUNITY FUND': 0, 'SECURE FUND': 0, 'DEBT FUND': 0, 'LIQUID FUND': 0}, 'rider': 'No', 'customer_name': '', 'agent_name': '', 'agent_phone_number': ''}
    payload = build_payload_ultima_plus(sample_input)
    print(payload)
    print("+++++++++++++++++++++++++++++++++++++++++++++++++++++++")
    print(call_bi_api_tester_qa(payload))
