from PIL import Image, ImageDraw, ImageFont
import datetime

# bold_font_path = "fonts/arialbd.ttf"  # <-- path to your font file
bold_font_path = "fonts/Ubuntu-Bold.ttf"  # <-- path to your font file
normal_font_path = "fonts/arial.ttf"

def filter_amount(amount):
    if(amount > 10000000):
        res = str(round(amount / 10000000, 1)) + " Crores"
    elif(amount > 100000):
        res = str(round(amount/100000, 1)) + " Lacs"
    else:
        res = format_indian_currency(amount)
    return res

def format_indian_currency(amount):
    amount = str(int(amount))

    if len(amount) <= 3:
        return amount

    last_3 = amount[-3:]
    remaining = amount[:-3]

    parts = []
    while len(remaining) > 2:
        parts.insert(0, remaining[-2:])
        remaining = remaining[:-2]

    if remaining:
        parts.insert(0, remaining)

    return ",".join(parts) + "," + last_3

def wrap_text(draw, text, font, max_width):
    lines = []
    words = text.split()
    current_line = ""

    for word in words:
        test_line = current_line + (" " if current_line else "") + word
        bbox = draw.textbbox((0, 0), test_line, font=font)
        text_width = bbox[2] - bbox[0]

        if text_width <= max_width:
            current_line = test_line
        else:
            lines.append(current_line)
            current_line = word

    if current_line:
        lines.append(current_line)

    return "\n".join(lines)

def ordinal(n):
    if 10 <= n % 100 <= 20:
        return str(n) + "th"
    else:
        suffix = {1: "st", 2: "nd", 3: "rd"}.get(n % 10, "th")
        return str(n) + suffix
    
def get_image_using_bi_gip(form_inputs, response):
    """
    Opens an image template, writes the policy_term at a specific location,
    and returns the edited image.
    """

    plan = form_inputs.get("plan")
    flexi = plan == "Flexi Start"
    defer_payout = form_inputs.get("defer_payout","No")
    # Load image template
    if flexi:
        if defer_payout == "Yes":
            template_path = "img/bi_image_template_gip_flexi_defer.jpg"
        else:
            template_path = "img/bi_image_template_gip_flexi.jpg"
    else:
        template_path = "img/bi_image_template_gip_extended.jpg"  # <-- path to your image

    image = Image.open(template_path)

    # Prepare drawing context
    draw = ImageDraw.Draw(image)

    # Load font (use a TTF font for better control)
    s_font_size = 60
    m_font_size = 80
    l_font_size = 115
    xl_font_size = 130
    xxl_font_size = 195

    s_normal_font = ImageFont.truetype(normal_font_path, s_font_size)
    m_normal_font = ImageFont.truetype(normal_font_path, m_font_size)

    s_bold_font = ImageFont.truetype(bold_font_path, s_font_size)
    m_bold_font = ImageFont.truetype(bold_font_path, m_font_size)
    l_bold_font = ImageFont.truetype(bold_font_path, l_font_size)
    xl_bold_font = ImageFont.truetype(bold_font_path, xl_font_size)
    xxl_bold_font = ImageFont.truetype(bold_font_path, xxl_font_size)

    # # Text color (R, G, B)
    white_color = (255, 255, 255)
    blue_color = (18, 49, 80)

    # Getting Values from API Respone
    age = form_inputs.get("age")
    gender = form_inputs.get("gender")
    income_period = form_inputs.get("income_period")
    advance_income_option = form_inputs.get("advance_income_option", False)
    deferment_period = form_inputs.get("deferment_period", 0)
    premium = response.get("policyInfo", {}).get("premium", {}).get("installmentPremium")
    policy_term = response.get('policyInfo', {}).get('policyTerm', 'N/A')
    premium_paying_term = response.get('policyInfo', {}).get('premiumPayingTerm', 'N/A')
    cover_amount = response.get('policyInfo', {}).get('coverages', {})[0].get('sumAssured', 'N/A')
    secured_income = response.get('planIncomeInfo', {}).get('securedIncomeInstall', 'N/A')
    guaranteed_income = response.get('planIncomeInfo', {}).get('guaranteedIncomeInstall', 'N/A')
    maturity_benefit = response.get('maturityBenefitInfo', {}).get('maturityBenefit', 'N/A')
    rop = response.get('planIncomeInfo', {}).get('rop', 'N/A')
    loyalty_addition = response.get('planIncomeInfo', {}).get('additionalLoyaltyPayout','N/A')
    agent_name = form_inputs.get("agent_name")
    agent_phone_number = form_inputs.get("agent_phone_number")
    customer_name = form_inputs.get("customer_name")

    premium_pay_pos = (175, 1870)
    draw.text(premium_pay_pos, filter_amount(premium), fill=white_color, font=l_bold_font)

    premium_payment_term_pay_pos = (85, 2005)
    draw.text(premium_payment_term_pay_pos, f"for {premium_paying_term} years", fill=white_color, font=m_normal_font)
    if flexi:
        secured_income_pos = (180, 2530)
    else:
        secured_income_pos = (485, 2533)
    draw.text(secured_income_pos, format_indian_currency(secured_income), fill=white_color, font=l_bold_font)

    if flexi:
        secured_income_details_pos = (65,2685)
    else:
        secured_income_details_pos = (395,2680)

    if defer_payout == "Yes":
        secured_income_details = f"from {ordinal(deferment_period+1)} year of the policy\nterm till {ordinal(policy_term)} year along\nwith ₹{filter_amount(cover_amount)} life cover"
    elif advance_income_option:
        secured_income_details = f"within 7 days for {policy_term} years \nwith ₹{filter_amount(cover_amount)} life cover"
    else:
        secured_income_details = f"for {policy_term} years with\n₹{filter_amount(cover_amount)} life cover"
    draw.multiline_text(secured_income_details_pos, secured_income_details, fill=white_color, font=s_normal_font,spacing=15)
    
    if flexi:
        guaranteed_income_pos = (1000, 2529)
        draw.text(guaranteed_income_pos, format_indian_currency(guaranteed_income), fill=white_color, font=l_bold_font)

        guaranteed_income_details_pos = (910,2680)
        guaranteed_income_details = f"for next {income_period} years"
        draw.multiline_text(guaranteed_income_details_pos, guaranteed_income_details, fill=white_color, font=s_normal_font,spacing=15)

    if flexi:
        rop_plus_loyalty_pos = (1795, 2610)
    else:
        rop_plus_loyalty_pos = (1460, 2538)
    rop_plus_loyalty = rop + loyalty_addition
    rop_plus_loyalty_display_value = "      —" if rop_plus_loyalty == 0 else format_indian_currency(rop_plus_loyalty)
    draw.text(rop_plus_loyalty_pos, rop_plus_loyalty_display_value, fill=white_color, font=l_bold_font)

    total_return_pos = (1385, 2965)
    total_return = secured_income * (policy_term - deferment_period) + guaranteed_income * income_period + rop_plus_loyalty
    draw.text(total_return_pos, format_indian_currency(total_return), fill=white_color, font=xl_bold_font)

    guaranteed_return_times_pos = (765, 3140)
    guaranteed_return_times = round(total_return / (premium * premium_paying_term), 2)
    draw.text(guaranteed_return_times_pos, f"{guaranteed_return_times:.2f}X", fill=white_color, font=xxl_bold_font)

    full_details_pos = (350, 3420)
    if flexi:
        full_details = f"Age: {age} {gender} | Premium Payment Term: {premium_paying_term} | Policy Term: {policy_term} | Income Term: {income_period} | Flexi Start Benefit"
    else:    
        full_details = f"Age: {age} {gender} | Premium Payment Term: {premium_paying_term} | Policy Term: {policy_term} | Extended Benefit"

    if advance_income_option:
        full_details = f"{full_details} / Advance Income"
    else:
        full_details = f"{full_details} / Arrear Income"

    # Wrap text within the defined width
    full_details_width_end = 2150
    full_details_center_width = full_details_width_end - full_details_pos[0]
    full_details_wrapped_text = wrap_text(draw, full_details, s_bold_font, full_details_center_width)
    full_details_bbox = draw.multiline_textbbox((0, 0), full_details_wrapped_text, font=s_bold_font, align="center", spacing=15)
    text_width = full_details_bbox[2] - full_details_bbox[0]

    # Center within 330 → 1500
    x = full_details_pos[0] + (full_details_center_width - text_width) // 2
    y = 3420

    draw.multiline_text((x, y), full_details_wrapped_text, font=s_bold_font, fill="black", align="center", spacing=15)
    # draw.multiline_text(full_details_pos, full_details, fill=blue_color, font=s_bold_font, spacing=15)

    contact_details_pos = (120, 4590)
    contact_details = f"Customer Name : {customer_name}\nBandhan Representative : {agent_name}\nContact No. : {agent_phone_number}"
    draw.multiline_text(contact_details_pos, contact_details, fill = blue_color, font= m_bold_font, spacing=15)

    return image

def old_get_image_using_bi_ultima(form_inputs, response):
    # Load image template
    template_path = "img/bi_image_templ.jpg"  # <-- path to your image
    image = Image.open(template_path)

    # Prepare drawing context
    draw = ImageDraw.Draw(image)

    # Load font (use a TTF font for better control)
    s_font_size = 62
    m_font_size = 80
    l_font_size = 125
    xl_font_size = 195

    s_normal_font = ImageFont.truetype(normal_font_path, s_font_size)
    m_normal_font = ImageFont.truetype(normal_font_path, m_font_size)

    s_bold_font = ImageFont.truetype(bold_font_path, s_font_size)
    m_bold_font = ImageFont.truetype(bold_font_path, m_font_size)
    l_bold_font = ImageFont.truetype(bold_font_path, l_font_size)
    xl_bold_font = ImageFont.truetype(bold_font_path, xl_font_size)

    # # Text color (R, G, B)
    white_color = (255, 255, 255)
    blue_color = (18, 49, 80)

    # Getting Values from API Respone
    age = form_inputs.get("age")
    gender = form_inputs.get("gender")
    premium = (response.get("policyInfo", {}).get("premium", {}).get("installmentPremium"))
    policy_term = response.get('policyInfo', {}).get('policyTerm', 'N/A')
    premium_paying_term = response.get('policyInfo', {}).get('premiumPayingTerm', 'N/A')
    fund_value_4 = None
    fund_value_8 = None
    for item in response.get("fundValue", []):
        if item.get("returnPercentage") == 4.0:
            fund_value_4 = item.get("returnValue")
        elif item.get("returnPercentage") == 8.0:
            fund_value_8 = item.get("returnValue")
    agent_name = form_inputs.get("agent_name")
    agent_phone_number = form_inputs.get("agent_phone_number")
    customer_name = form_inputs.get("customer_name")

    premium_pos = (340, 1915)
    draw.text(premium_pos, f"{format_indian_currency(int(premium))} p.a.", fill=blue_color, font=l_bold_font)

    premium_paying_term_pos = (375, 2115)
    draw.text(premium_paying_term_pos, f"for {premium_paying_term} years", fill=white_color, font=m_bold_font)

    fund_value_8_pos = (1380, 1915)
    draw.text(fund_value_8_pos,format_indian_currency(int(fund_value_8)), fill=white_color, font=xl_bold_font) 

    full_details_pos = (290, 2415)
    full_details = f"Age {age}, {gender} | PPT: {premium_paying_term} Years | PT: {policy_term} Years | Tax as per prevailing laws"
    draw.text(full_details_pos, full_details, fill=white_color, font=s_normal_font)

    contact_details_pos = (120, 4260)
    contact_details = f"Customer Name : {customer_name}\nBandhan Representative : {agent_name}\nContact No. : {agent_phone_number}"
    draw.multiline_text(contact_details_pos, contact_details, fill = blue_color, font= m_bold_font, spacing=15)

    return image

def get_image_using_bi_ultima_plus(form_inputs, response):

    # ==========================================================
    # Load Image
    # ==========================================================

    template_path = "img/bi_image_template_ultima_plus.jpg"
    image = Image.open(template_path)
    draw = ImageDraw.Draw(image)

    # ==========================================================
    # Fonts
    # ==========================================================
    s_font_size = 40
    m_font_size = 55
    ml_font_size = 65
    l_font_size = 85
    xl_font_size = 120
    xxl_font_size = 145

    s_normal_font = ImageFont.truetype(normal_font_path, s_font_size)
    m_normal_font = ImageFont.truetype(normal_font_path, m_font_size)

    s_bold_font = ImageFont.truetype(bold_font_path, s_font_size)
    m_bold_font = ImageFont.truetype(bold_font_path, m_font_size)
    ml_bold_font = ImageFont.truetype(bold_font_path, ml_font_size)
    l_bold_font = ImageFont.truetype(bold_font_path, l_font_size)
    xl_bold_font = ImageFont.truetype(bold_font_path, xl_font_size)
    white_color = (255, 255, 255)
    blue_color = (18, 49, 80)

    # ==========================================================
    # Form Values
    # ==========================================================

    age = form_inputs.get("age")
    gender = form_inputs.get("gender")
    customer_name = form_inputs.get("customer_name")
    agent_name = form_inputs.get("agent_name")
    agent_phone_number = form_inputs.get("agent_phone_number")
    premium = response.get("policyInfo", {}).get("premium", {}).get("installmentPremium")
    policy_term = response.get("policyInfo", {}).get("policyTerm")
    premium_paying_term = response.get("policyInfo", {}).get("premiumPayingTerm")
    fund_value_4 = None
    fund_value_8 = None
    for item in response.get("fundValue", []):
        if item.get("returnPercentage") == 4.0:
            fund_value_4 = item.get("returnValue")
        elif item.get("returnPercentage") == 8.0:
            fund_value_8 = item.get("returnValue")

    premium_pos = (180, 1600)
    draw.text(premium_pos, format_indian_currency(int(premium)), fill=blue_color, font=l_bold_font)

    premium_paying_term_pos = (165, 1735)
    draw.text(premium_paying_term_pos, f"for {premium_paying_term} years", fill=white_color, font=ml_bold_font)

    fund_value_8_pos = (1310, 1675)
    draw.text((fund_value_8_pos[0] - 305, fund_value_8_pos[1]), "8%", fill=blue_color, font=ml_bold_font)
    draw.text(fund_value_8_pos, f"₹{format_indian_currency(int(fund_value_8))}", fill=blue_color, font=ml_bold_font)

    fund_value_4_pos = (1310, 1800)
    draw.text((fund_value_4_pos[0] - 305, fund_value_4_pos[1]), "4%", fill=white_color, font=m_bold_font)
    draw.text(fund_value_4_pos, f"₹{format_indian_currency(int(fund_value_4))}", fill=white_color, font=m_bold_font)

    full_details = (f"Age {age}, {gender} | PPT: {premium_paying_term} Years | PT: {policy_term} Years")
    full_details_pos = (430, 1980)
    draw.text(full_details_pos, full_details, fill=white_color, font=m_normal_font)

    contact_details = (f"Customer Name : {customer_name}\nBandhan Representative : {agent_name}\nContact No. : {agent_phone_number}")

    contact_details_pos = (90, 3760)
    draw.multiline_text(contact_details_pos, contact_details, fill=blue_color, font=s_bold_font, spacing=25)

    return image

def get_image_using_bi_igv(form_inputs, response):
    # Load image template
    template_path = "img/bi_image_template_igv.jpg"  # <-- path to your image
    image = Image.open(template_path)

    # Prepare drawing context
    draw = ImageDraw.Draw(image)

    # Load font (use a TTF font for better control)
    s_font_size = 60
    m_font_size = 80
    l_font_size = 115
    xl_font_size = 130
    xxl_font_size = 195

    s_normal_font = ImageFont.truetype(normal_font_path, s_font_size)
    m_normal_font = ImageFont.truetype(normal_font_path, m_font_size)

    s_bold_font = ImageFont.truetype(bold_font_path, s_font_size)
    m_bold_font = ImageFont.truetype(bold_font_path, m_font_size)
    l_bold_font = ImageFont.truetype(bold_font_path, l_font_size)
    xl_bold_font = ImageFont.truetype(bold_font_path, xl_font_size)
    xxl_bold_font = ImageFont.truetype(bold_font_path, xxl_font_size)

    # # Text color (R, G, B)
    white_color = (255, 255, 255)
    blue_color = (18, 49, 80)
    # response_igv = {'policyInfo': {'product': {'schemeCode': 'ARMP0000146', 'saInMultiple': None}, 'policyTerm': 15, 'premiumPayingTerm': 5, 'sumAssuredOnDeath': 600000.0, 'coverages': [{'code': 'ARMP0000146', 'sumAssured': 600000.0, 'premium': {'value': 60000.0, 'sgst': 0.0, 'cgst': 0.0, 'igst': 0.0, 'ugst': 0.0, 'totalgst': 0.0, 'valueWithoutDiscount': 60000.0, 'discountValue': 0.0}, 'stampDutyAmount': 120.0, 'policyTermYears': 15, 'policyPayingTermYears': 5}], 'premium': {'frequency': 'YEARLY', 'installmentPremium': 60000.0, 'sgst': 0.0, 'cgst': 0.0, 'igst': 0.0, 'ugst': 0.0, 'totalgst': 0.0, 'premiumPayOption': 'YEAR'}, 'discountPercentage': 0.0, 'discountType': 'NO_DISCOUNT', 'inceptionDate': '2026-04-09T05:30:00.000+0530', 'currency': 31, 'stampDutyAmount': 120.0, 'benefitSumAssured': 0.0, 'benefitSumAssuredRate': 0, 'policyTermOption': 'YEAR', 'policyType': 'INDIVIDUAL'}, 'result': 'SUCCESS', 'secondYearPremiumInfo': {'coverages': [{'variant': 'Death Benefit', 'code': 'ARMP0000146', 'sumAssured': 600000.0, 'premium': {'value': 60000.0, 'sgst': 0.0, 'cgst': 0.0, 'igst': 0.0, 'ugst': 0.0, 'totalgst': 0.0, 'totalPremium': 60000.0, 'annualizedPremium': 60000.0, 'stampDutyAmount': 0.0, 'grossPremium': 60000.0}, 'stampDutyAmount': 0.0}], 'premium': {'frequency': 'YEARLY', 'installmentPremium': 60000.0, 'sgst': 0.0, 'cgst': 0.0, 'igst': 0.0, 'ugst': 0.0}, 'discountPercentage': 0.0, 'saOnDeath': 0.0, 'stampDutyAmount': 0.0}, 'maturityBenefitInfo': {'maturityBenefit': 600600.0, 'guaranteedAnnuityPayout': 0.0}, 'planIncomeInfo': {'payoutOption': None, 'bonusAccrual': None, 'incomeAccrual': False, 'payoutFrequency': None, 'payoutDate': None, 'incomeOption': None, 'incomePeriod': None, 'defermentPeriod': None, 'returnOfPremPercentage': None, 'accumulationPeriod': None, 'securedIncomePayout': None, 'guaranteedIncomePayoutIncomePeriod': None, 'rop': None, 'additionalLoyaltyPayout': None, 'annuityOption': None, 'securePolicyBenefit': False, 'advanceIncomeOption': None, 'specialPayOutDate': None, 'securedIncomeInstall': 0.0, 'guaranteedIncomeInstall': 0.0, 'guaranteedAnnuityPayout': None, 'annuityFrequency': None, 'annuityPayout': None}, 'basicSumAssured': 0.0, 'cached': False}
    age = form_inputs.get("age")
    gender = form_inputs.get("gender")
    premium = (response.get("policyInfo", {}).get("premium", {}).get("installmentPremium"))
    policy_term = response.get('policyInfo', {}).get('policyTerm', 'N/A')
    premium_paying_term = response.get('policyInfo', {}).get('premiumPayingTerm', 'N/A')
    cover_amount = response.get('policyInfo', {}).get('coverages', {})[0].get('sumAssured', 'N/A')
    maturity_benefit = response.get('maturityBenefitInfo', {}).get('maturityBenefit', 'N/A')
    agent_name = form_inputs.get("agent_name")
    agent_phone_number = form_inputs.get("agent_phone_number")
    customer_name = form_inputs.get("customer_name")

    premium_pos = (310, 2405)
    draw.text(premium_pos, filter_amount(int(premium)), fill=blue_color, font=xl_bold_font)

    premium_paying_term_pos = (210, 2585)
    draw.text(premium_paying_term_pos, f"for {premium_paying_term} years", fill=white_color, font=s_normal_font)

    maturity_benefit_pos = (1400, 2400)
    draw.text(maturity_benefit_pos, filter_amount(maturity_benefit), fill=blue_color, font=xl_bold_font)

    policy_term_pos = (1300, 2582)
    draw.text(policy_term_pos, f"at the end of {ordinal(policy_term)} year", fill=white_color, font=s_normal_font)
    # fund_value_8_pos = (1865, 1883)
    # draw.text(fund_value_8_pos,format_indian_currency(int(fund_value_8)), fill=blue_color, font=ImageFont.truetype(bold_font_path, m_font_size+20)) 

    # fund_value_4_pos = (1955, 2045)
    # draw.text(fund_value_4_pos,format_indian_currency(int(fund_value_4)), fill=white_color, font=ImageFont.truetype(bold_font_path, s_font_size+10))

    guaranteed_return_times_pos = (785, 2768)
    guaranteed_return_times = round(maturity_benefit / (premium * premium_paying_term), 2)
    draw.text(guaranteed_return_times_pos, f"{guaranteed_return_times:.2f}X", fill=blue_color, font=xxl_bold_font)

    cover_text_pos = (575, 3120)
    cover_text = "with a life cover of  "
    draw.text(cover_text_pos,cover_text, fill=white_color, font=m_normal_font)
    cover_text_width = draw.textlength(cover_text, font=m_normal_font)
    cover_amount_pos = (cover_text_pos[0] + cover_text_width, cover_text_pos[1]- 50)
    draw.text(cover_amount_pos, f"₹ {filter_amount(cover_amount)}", fill=white_color, font=xl_bold_font)

    full_details_pos = (300, 3280)
    full_details = f"Age {age} {gender} | Premium Payment Term: {premium_paying_term} years | Policy Term: {policy_term} years"
    draw.text(full_details_pos, full_details, fill=white_color, font=s_normal_font)

    # full_details_text_width = draw.textlength(full_details, font=s_normal_font)
    # super_text_pos = (full_details_pos[0] + full_details_text_width, full_details_pos[1])
    # draw.text(super_text_pos, "%", fill=white_color, font=super_normal_font)

    contact_details_pos = (180, 4250)
    contact_details = f"Customer Name : {customer_name}\nBandhan Representative : {agent_name}\nContact No. : {agent_phone_number}"
    draw.multiline_text(contact_details_pos, contact_details, fill = white_color, font= m_bold_font, spacing=25)

    return image

def get_image_using_bi_secure(form_inputs, response):
    # Load image template
    template_path = "img/bi_image_template_securengrow.jpg"  # <-- path to your image
    image = Image.open(template_path)

    # Prepare drawing context
    draw = ImageDraw.Draw(image)

    # Load font (use a TTF font for better control)
    s_font_size = 50
    m_font_size = 80
    l_font_size = 95
    xl_font_size = 130
    xxl_font_size = 155

    s_normal_font = ImageFont.truetype(normal_font_path, s_font_size)
    m_normal_font = ImageFont.truetype(normal_font_path, m_font_size)
    l_normal_font = ImageFont.truetype(normal_font_path, l_font_size)

    s_bold_font = ImageFont.truetype(bold_font_path, s_font_size)
    m_bold_font = ImageFont.truetype(bold_font_path, m_font_size)
    l_bold_font = ImageFont.truetype(bold_font_path, l_font_size)
    xl_bold_font = ImageFont.truetype(bold_font_path, xl_font_size)
    xxl_bold_font = ImageFont.truetype(bold_font_path, xxl_font_size)

    # # Text color (R, G, B)
    white_color = (255, 255, 255)
    blue_color = (18, 49, 80)

    age = form_inputs.get("age")
    gender = form_inputs.get("gender")
    premium = response.get("comboProductSummaryQuote", {}).get("modelPremiumCombi")
    policy_term = response.get("primaryProductQuote", {}).get("policyInfo", {}).get("policyTerm")
    premium_paying_term = response.get("primaryProductQuote", {}).get("policyInfo", {}).get("premiumPayingTerm")
    guaranteed_maturity_benefit = response.get("comboProductSummaryQuote", {}).get("guaranteedMaturityBenefit")
    maturity_4 = response.get("comboProductSummaryQuote", {}).get("maturityBenefit4")
    maturity_8 = response.get("comboProductSummaryQuote", {}).get("maturityBenefit8")
    agent_name = form_inputs.get("agent_name")
    agent_phone_number = form_inputs.get("agent_phone_number")
    customer_name = form_inputs.get("customer_name")

    premium_pos = (255, 1740)
    draw.text(premium_pos, f"₹ {filter_amount(int(premium))}", fill=white_color, font=xl_bold_font)

    premium_paying_term_pos = (400, 1880)
    draw.text(premium_paying_term_pos, f"for {premium_paying_term} years", fill=white_color, font=s_normal_font)

    guaranteed_maturity_benefit_pos = (280, 2580)
    draw.text(guaranteed_maturity_benefit_pos, f"₹ {filter_amount(guaranteed_maturity_benefit)}", fill=white_color, font=xl_bold_font)

    policy_term_pos = (360, 2730)
    draw.text(policy_term_pos, f"at the end of {ordinal(policy_term)} year", fill=white_color, font=s_normal_font)

    total_maturity_benefit = guaranteed_maturity_benefit + maturity_8
    total_maturity_benefit_pos = (1280,2045)
    draw.text(total_maturity_benefit_pos, f"₹ {format_indian_currency(total_maturity_benefit)}", fill=white_color,font=xxl_bold_font)

    maturity_8_pos = (1482, 2545)
    draw.text(maturity_8_pos,"@8%", fill=white_color, font=l_normal_font)
    draw.text((maturity_8_pos[0] + 250, maturity_8_pos[1]), f"₹ {format_indian_currency(maturity_8)}", fill=white_color, font=l_bold_font)

    maturity_4_pos = (1485, 2670)
    draw.text(maturity_4_pos,"@4%", fill=white_color, font=m_normal_font)
    draw.text((maturity_4_pos[0] + 230, maturity_4_pos[1]), f"₹ {format_indian_currency(maturity_4)}", fill=white_color, font=m_bold_font)

    full_details_pos = (320, 2910)
    full_details = f"Age {age} {gender} | Premium Payment Term: {premium_paying_term} years | Policy Term: {policy_term} years"
    draw.text(full_details_pos, full_details, fill=blue_color, font=s_bold_font)

    contact_details_pos = (120, 5690)
    contact_details = f"Customer Name : {customer_name}\nBandhan Representative : {agent_name}\nContact No. : {agent_phone_number}"
    draw.multiline_text(contact_details_pos, contact_details, fill = blue_color, font= m_bold_font, spacing=25)
    return image

def generate_bi_image(form_inputs, response, product):
    if product == "GIP":
        return get_image_using_bi_gip(form_inputs,response)

    elif product == "iGuarantee Vishwas":
        return get_image_using_bi_igv(form_inputs, response)

    elif product == "Secure N Grow":
        return get_image_using_bi_secure(form_inputs, response)

    elif product == "iInvest Ultima Plus":
        return get_image_using_bi_ultima_plus(form_inputs, response)
    else:
        raise ValueError(f"Unsupported product: {product}")

    # elif product == "Secure":
if __name__ == "__main__":
    response = {'primaryProductQuote': {'fundValue': [{'returnPercentage': 4.0, 'returnValue': 1147143.0}, {'returnPercentage': 8.0, 'returnValue': 1712069.0}], 'policyInfo': {'product': {'schemeCode': 'ARMP0000126', 'saInMultiple': 10.0}, 'policyTerm': 15, 'premiumPayingTerm': 10, 'sumAssuredOnDeath': 871960.0, 'coverages': [{'code': 'ARMP0000126', 'sumAssured': 871960.0, 'premium': {'value': 87196.0, 'sgst': 0.0, 'cgst': 0.0, 'igst': 0.0, 'ugst': 0.0, 'totalgst': 0.0, 'valueWithoutDiscount': 87196.0, 'discountValue': 0.0}, 'stampDutyAmount': 175.0, 'claimFeatureDetails': []}], 'premium': {'frequency': 'YEARLY', 'installmentPremium': 87196.0, 'totalgst': 0.0, 'premiumPayOption': 'YEAR'}, 'discountPercentage': 0.0, 'discountType': 'NO_DISCOUNT', 'inceptionDate': '2026-06-11T05:30:00.000+0530', 'currency': 31, 'stampDutyAmount': 175.0, 'premiumPayOption': 0, 'benefitSumAssured': 0.0, 'benefitSumAssuredRate': 0, 'policyTermOption': 'YEAR', 'policyType': 'INDIVIDUAL'}, 'result': 'SUCCESS', 'secondYearPremiumInfo': {'coverages': [{'variant': 'Death Benefit', 'code': 'ARMP0000126', 'sumAssured': 871960.0, 'premium': {'value': 87196.0, 'sgst': 0.0, 'cgst': 0.0, 'igst': 0.0, 'ugst': 0.0, 'totalgst': 0.0, 'totalPremium': 87196.0, 'annualizedPremium': 87196.0, 'stampDutyAmount': 0.0, 'grossPremium': 87196.0}, 'stampDutyAmount': 0.0}], 'premium': {'frequency': 'YEARLY', 'installmentPremium': 87196.0, 'sgst': 0.0, 'cgst': 0.0, 'igst': 0.0, 'ugst': 0.0}, 'discountPercentage': 0.0, 'saOnDeath': 871960.0, 'stampDutyAmount': 0.0}, 'maturityBenefitInfo': {'maturityBenefit': 0.0, 'guaranteedAnnuityPayout': 0.0}, 'basicSumAssured': 0.0, 'cached': False}, 'secondaryProductQuote': {'policyInfo': {'product': {'schemeCode': 'ARMP0000146', 'saInMultiple': None}, 'policyTerm': 15, 'premiumPayingTerm': 10, 'sumAssuredOnDeath': 1128040.0, 'coverages': [{'code': 'ARMP0000146', 'sumAssured': 1128040.0, 'premium': {'value': 112804.0, 'sgst': 0.0, 'cgst': 0.0, 'igst': 0.0, 'ugst': 0.0, 'totalgst': 0.0, 'valueWithoutDiscount': 112804.0, 'discountValue': 0.0}, 'stampDutyAmount': 226.0, 'policyTermYears': 15, 'policyPayingTermYears': 10, 'claimFeatureDetails': []}], 'premium': {'frequency': 'YEARLY', 'installmentPremium': 112804.0, 'sgst': 0.0, 'cgst': 0.0, 'igst': 0.0, 'ugst': 0.0, 'totalgst': 0.0, 'premiumPayOption': 'YEAR'}, 'discountPercentage': 0.0, 'discountType': 'NO_DISCOUNT', 'inceptionDate': '2026-06-11T05:30:00.000+0530', 'currency': 31, 'stampDutyAmount': 226.0, 'benefitSumAssured': 0.0, 'benefitSumAssuredRate': 0, 'policyTermOption': 'YEAR', 'policyType': 'INDIVIDUAL'}, 'result': 'SUCCESS', 'secondYearPremiumInfo': {'coverages': [{'variant': 'Death Benefit', 'code': 'ARMP0000146', 'sumAssured': 1128040.0, 'premium': {'value': 112804.0, 'sgst': 0.0, 'cgst': 0.0, 'igst': 0.0, 'ugst': 0.0, 'totalgst': 0.0, 'totalPremium': 112804.0, 'annualizedPremium': 112804.0, 'stampDutyAmount': 0.0, 'grossPremium': 112804.0}, 'stampDutyAmount': 0.0}], 'premium': {'frequency': 'YEARLY', 'installmentPremium': 112804.0, 'sgst': 0.0, 'cgst': 0.0, 'igst': 0.0, 'ugst': 0.0}, 'discountPercentage': 0.0, 'saOnDeath': 0.0, 'stampDutyAmount': 0.0}, 'maturityBenefitInfo': {'maturityBenefit': 2000015.0, 'guaranteedAnnuityPayout': 0.0}, 'planIncomeInfo': {'payoutOption': None, 'bonusAccrual': None, 'incomeAccrual': False, 'payoutFrequency': None, 'payoutDate': None, 'incomeOption': None, 'planOption': None, 'incomePeriod': None, 'inbuiltADBenefitSA': None, 'guaranteedIncomePayoutAmount': None, 'careerStartBenefitAmount': None, 'defermentPeriod': None, 'returnOfPremPercentage': None, 'accumulationPeriod': None, 'securedIncomePayout': None, 'guaranteedIncomePayoutIncomePeriod': None, 'rop': None, 'additionalLoyaltyPayout': None, 'annuityOption': None, 'securePolicyBenefit': False, 'advanceIncomeOption': None, 'specialPayOutDate': None, 'securedIncomeInstall': 0.0, 'guaranteedIncomeInstall': 0.0, 'guaranteedAnnuityPayout': None, 'annuityFrequency': None, 'annuityPayout': None, 'incomeShieldPayoutDuration': None}, 'basicSumAssured': 0.0, 'cached': False}, 'comboProductSummaryQuote': {'modelPremiumPrimary': 87196.0, 'modelPremiumSecondary': 112804.0, 'guaranteedMaturityBenefit': 2000015.0, 'maturityBenefit4': 1147143.0, 'maturityBenefit8': 1712069.0, 'totalMaturityBenefit4': 3147158.0, 'totalMaturityBenefit8': 3712084.0, 'guaranteedDeathBenefitPrimary': 871960.0, 'guaranteedDeathBenefitSecondary': 1128040.0, 'totalPremiumsPaidDuringPPT': 2000000.0, 'capitalGuaranteeSchemeCode': 'CMB12614601', 'primaryProductSchemeCode': 'ARMP0000126', 'secondaryProductSchemeCode': 'ARMP0000146', 'guaranteedDeathBenefitCombi': 2000000.0, 'modelPremiumCombi': 200000.0}}
    # form_input = {'gender': 'Male', 'dob': datetime.date(2008, 3, 10), 'age': 18, 'smoker': 'No', 'plan': 'Extended Benefit', 'premium': 50000, 'premium_paying_term': 5, 'income_period': 10, 'defer_payout': 'No', 'policy_term': 5, 'secured_income_accumulation_option': 'No', 'accumulation_period': 0, 'advance_income_option': True, 'payout_frequency': 'Yearly', 'deferment_period': 0, 'customer_name': '', 'agent_name': '', 'agent_phone_number': '', 'rop': 0}
    form_input = {'gender': 'Male', 'dob': datetime.date(2003, 11, 16), 'age': 22, 'smoker': 'No', 'plan': 'Extended Benefit', 'premium': 120000, 'premium_paying_term': 12, 'income_period': 30, 'defer_payout': 'No', 'policy_term': 12, 'secured_income_accumulation_option': 'No', 'accumulation_period': 0, 'advance_income_option': True, 'payout_frequency': 'Yearly', 'deferment_period': 0, 'customer_name': 'Naman Gupta', 'agent_name': 'Self', 'agent_phone_number': '9166712583', 'rop': 110}
    img = get_image_using_bi_secure(form_input, response)
    img.show()
