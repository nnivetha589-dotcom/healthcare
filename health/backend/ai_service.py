import os
import json
import re

# Red flag emergency symptoms keywords in English and Tamil
EMERGENCY_KEYWORDS = [
    "chest pain", "heart attack", "shortness of breath", "cannot breathe", 
    "unconscious", "passed out", "stroke", "paralysis", "severe bleeding", 
    "coughing blood", "sudden numbness", "anaphylaxis", "choking",
    # Tamil transliteration & script
    "நெஞ்சு வலி", "சுவாசிக்க முடியவில்லை", "மயக்கம்", "மாரடைப்பு",
    "nenju vali", "moochu thinaral", "mayakkam"
]

MEDICAL_EXPLANATIONS = {
    "hba1c": "Average blood sugar levels over the past 2 to 3 months. Used to monitor diabetes control.",
    "fasting blood sugar": "Glucose levels in blood after at least 8 hours of fasting.",
    "cholesterol": "A waxy fat-like substance found in blood. High levels can build up in arterial walls.",
    "ldl": "Low-Density Lipoprotein, often called 'bad cholesterol' because it can contribute to arterial plaques.",
    "hdl": "High-Density Lipoprotein, known as 'good cholesterol' because it helps remove other cholesterol forms.",
    "triglycerides": "A type of fat (lipid) found in blood converted from unused calories.",
    "hemoglobin": "An iron-rich protein in red blood cells that carries oxygen from lungs throughout your body.",
    "creatinine": "A normal waste product from muscle breakdown filtered out by healthy kidneys.",
    "wbc": "White Blood Cells, part of the immune system that helps fight infections and diseases.",
    "rbc": "Red Blood Cells, which transport oxygen to your organs and tissues.",
    "platelets": "Cell fragments that help blood clot to stop bleeding from cuts or injuries.",
    "tsh": "Thyroid Stimulating Hormone, controls thyroid gland production of essential metabolism hormones.",
    "sgpt": "Serum Glutamic Pyruvic Transaminase (ALT), an enzyme found mostly in liver cells.",
    "sgot": "Serum Glutamic Oxaloacetic Transaminase (AST), an enzyme present in liver and heart tissues.",
    "bilirubin": "A yellowish substance made during the normal breakdown of red blood cells."
}

TAMIL_TRANSLATIONS = {
    "hba1c": "கடந்த 2-3 மாதங்களின் சராசரி இரத்த சர்க்கரை அளவு. சர்க்கரை நோயைக் கண்காணிக்கப் பயன்படுகிறது.",
    "fasting blood sugar": "8 மணி நேர உண்ணாவிரதத்திற்குப் பின் இரத்தத்தில் உள்ள குளுக்கோஸ் அளவு.",
    "cholesterol": "இரத்தத்தில் உள்ள கொழுப்பு சத்து. அதிகளவு கொழுப்பு இதய நாளங்களில் படியக்கூடும்.",
    "ldl": "கெட்ட கொழுப்பு (LDL). இதயத்திற்கு செல்லும் இரத்த நாளங்களை அடைக்கும் வாய்ப்புள்ளது.",
    "hdl": "நல்ல கொழுப்பு (HDL). உடலிலிருந்து கெட்ட கொழுப்பை அகற்ற உதவுகிறது.",
    "triglycerides": "உடலில் உள்ள கொழுப்பின் ஒரு வகை (டிரைகிளிசரைடுகள்).",
    "hemoglobin": "ஹீமோகுளோபின் - உடலுக்கு பிராணவாயுவை (ஆக்சிஜன்) எடுத்துச் செல்லும் இரத்த சிவப்பு அணு புரதம்.",
    "creatinine": "கிரியேட்டினின் - சிறுநீரக செயல்பாட்டை அளவிடும் ஒரு கழிவுப் பொருள்.",
    "wbc": "வெள்ளை இரத்த அணுக்கள் - உடலுக்கு நோய் எதிர்ப்பு சக்தியை தரும் செல்கள்.",
    "platelets": "இரத்த தட்டணுக்கள் - காயம் ஏற்படும்போது இரத்தம் உறைவதற்கு உதவுகிறது.",
    "tsh": "தைராய்டு தூண்டும் ஹார்மோன் (TSH)."
}

class AIService:
    def __init__(self):
        self.api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("AI_API_KEY")
        self.model = None
        self.is_demo_mode = True

        if self.api_key and self.api_key.strip():
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel('gemini-1.5-flash')
                self.is_demo_mode = False
            except Exception as e:
                print(f"Error configuring Gemini API: {e}. Falling back to Safe Demo Mode.")
                self.is_demo_mode = True
        else:
            print("No AI API key found. Initializing MediMate Safe Demo Mode.")

    def check_emergency(self, text):
        lower = text.lower()
        for kw in EMERGENCY_KEYWORDS:
            if kw in lower:
                return True
        return False

    def generate_chat_response(self, prompt, lang='en', history=None, context_records=None):
        """
        Generates safe medical information response.
        Enforces:
        - Never provide formal diagnosis or prescription
        - Clearly state if information is insufficient
        - Display urgent-care guidance for red flags
        - Offer bilingual assistance (English / Tamil)
        """
        is_urgent = self.check_emergency(prompt)

        # Urgent care warning banner text
        urgent_en = "\n\n⚠️ **URGENT CARE NOTICE:** The symptoms you described may require immediate medical evaluation. Please call your local emergency number (108/911/999) or visit the nearest emergency room immediately."
        urgent_ta = "\n\n⚠️ **அவசர சிகிச்சை எச்சரிக்கை:** நீங்கள் குறிப்பிட்ட அறிகுறிகளுக்கு உடனடி மருத்துவ கவனிப்பு தேவைப்படலாம். தயவுசெய்து உடனடியாக 108 அவசர ஊர்தி அல்லது அருகிலுள்ள அவசர சிகிச்சை பிரிவை அணுகவும்."

        urgent_warning = urgent_ta if lang == 'ta' else urgent_en

        if not self.is_demo_mode and self.model:
            system_instruction = f"""
            You are MediMate AI, a compassionate personal health information companion.
            User preferred language: {'Tamil' if lang == 'ta' else 'English'}.
            
            CRITICAL SAFETY RULES:
            1. NEVER diagnose diseases or prescribe medication or dosage.
            2. If user mentions red-flag symptoms, provide immediate emergency guidance.
            3. If user's question lacks details, explicitly state: 'The information provided is insufficient for a clear health observation. Please consult your physician.'
            4. If answering in Tamil, use natural, clear Tamil script (தமிழ்).
            5. Always include a disclaimer that this is educational health information, not a substitute for a licensed doctor's diagnosis.
            6. Keep responses friendly, structured, clear, and reassuring.
            """
            try:
                full_prompt = f"{system_instruction}\n\nUser Question: {prompt}"
                if context_records:
                    full_prompt += f"\nContext/User Reports: {context_records}"
                
                response = self.model.generate_content(full_prompt)
                ai_text = response.text

                source = "general_info"
                if "insufficient" in ai_text.lower() or "போதாது" in ai_text:
                    source = "insufficient_info"
                elif context_records:
                    source = "report_data"

                if is_urgent and ("URGENT" not in ai_text.upper() and "அவசர" not in ai_text):
                    ai_text += urgent_warning

                return {
                    "text": ai_text,
                    "source": source,
                    "is_urgent": is_urgent,
                    "is_demo_mode": False
                }
            except Exception as e:
                print(f"Gemini API call failed: {e}. Using deterministic response.")

        # Safe Demo Mode Fallback Response
        demo_tag = "[Demo Mode - Safe Preconfigured Response]\n\n"
        source = "general_info"

        lower_prompt = prompt.lower()
        if is_urgent:
            if lang == 'ta':
                resp = f"{demo_tag}நீங்கள் விவரித்த அறிகுறிகள் தீவிர எச்சரிக்கை அறிகுறிகளாக இருக்கலாம்.{urgent_ta}\n\nதயவுசெய்து எந்த தாமதமும் இன்றி மருத்துவ நிபுணரை அணுகவும்."
            else:
                resp = f"{demo_tag}The symptoms you mentioned are serious warning indicators.{urgent_en}\n\nDo not wait. Please seek immediate professional medical attention."
            return {"text": resp, "source": "insufficient_info", "is_urgent": True, "is_demo_mode": True}

        # Symptom Checker logic in Demo Mode
        if any(w in lower_prompt for w in ["fever", "காய்ச்சல்", "kaichal", "temperature"]):
            if lang == 'ta':
                resp = f"{demo_tag}காய்ச்சல் என்பது உங்கள் உடல் நோய்த்தொற்றை எதிர்த்துப் போராடுவதற்கான ஓர் அறிகுறியாகும்.\n\n" \
                       f"• **கவனிக்க வேண்டியவை:** காய்ச்சலின் வெப்பநிலை எவ்வளவு? எத்தனை நாட்களாக உள்ளது? உடல்வலி, சளி அல்லது குளிர் நடுக்கம் உள்ளதா?\n" \
                       f"• **சுயபராமரிப்பு:** போதிய அளவு நீர் குடிக்கவும், நன்கு ஓய்வெடுக்கவும்.\n" \
                       f"• **மருத்துவ ஆலோசனை:** காய்ச்சல் 102°F-க்கு மேல் நீடித்தாலோ அல்லது 3 நாட்களுக்கு மேல் தொடர்ந்தாலோ உடனடியாக மருத்துவரை அணுகவும்.\n\n" \
                       f"*குறிப்பு: இது பொதுவான தகவல் மட்டுமே; மருத்துவப் பரிந்துரை அல்ல.*"
            else:
                resp = f"{demo_tag}Fever is typically your immune system's natural response to fight off infections.\n\n" \
                       f"• **Follow-up assessment:** What is your current temperature? How many days have you had it? Are you experiencing chills, cough, or fatigue?\n" \
                       f"• **Helpful care:** Stay well-hydrated with fluids, get ample rest, and track temperature readings.\n" \
                       f"• **When to see a doctor:** If fever exceeds 102°F (38.9°C), lasts longer than 3 days, or is accompanied by a stiff neck, seek medical attention promptly.\n\n" \
                       f"*Disclaimer: MediMate AI provides health education, not medical diagnoses.*"
        elif any(w in lower_prompt for w in ["headache", "தலைவலி", "thalai vali"]):
            if lang == 'ta':
                resp = f"{demo_tag}தலைவலி மன அழுத்தம், நீரிழப்பு, போதுமான தூக்கமின்மை அல்லது கண் சோர்வினால் ஏற்படலாம்.\n\n" \
                       f"• போதுமான தண்ணீர் குடித்து, அமைதியான இருண்ட அறையில் ஓய்வெடுக்கவும்.\n" \
                       f"• திடீரென கடுமையான தலைவலி அல்லது பார்வை மங்கினால் உடனே மருத்துவரை அணுகவும்."
            else:
                resp = f"{demo_tag}Headaches can be caused by dehydration, stress, poor sleep, or eye strain.\n\n" \
                       f"• Hydrate with plenty of water and rest in a calm, dim room.\n" \
                       f"• If accompanied by sudden severity, vision changes, or neck stiffness, consult a healthcare professional immediately."
        elif len(prompt.strip()) < 10 or any(w in lower_prompt for w in ["sick", "unwell", "உடம்பு சரியில்லை"]):
            source = "insufficient_info"
            if lang == 'ta':
                resp = f"{demo_tag}நீங்கள் வழங்கிய தகவல் போதுமானதாக இல்லை. தெளிவான சுகாதார வழிகாட்டுதலுக்கு, உங்கள் அறிகுறிகள் எப்போது ஆரம்பித்தன, என்னென்ன உபாதைகள் உள்ளன என்பதை விவரிக்கவும்."
            else:
                resp = f"{demo_tag}The information provided is insufficient for a helpful health observation. Please provide more details such as specific symptoms, duration, and any related factors so I can share relevant educational information."
        else:
            if lang == 'ta':
                resp = f"{demo_tag}வணக்கம்! உங்கள் நலனில் அக்கறை கொள்கிறோம். ஆரோக்கியமான வாழ்க்கை முறைக்கு சரிவிகித உணவு, 7-8 மணிநேர தூக்கம், மற்றும் போதுமான நீர்ச்சத்து அவசியம்.\n\n" \
                       f"உங்கள் குறிப்பிட்ட பரிசோதனை அறிக்கைகள் அல்லது அறிகுறிகளைப் பற்றி மேலும் அறிய இங்கே கேட்கலாம்."
            else:
                resp = f"{demo_tag}Hello! MediMate AI is here to help you understand your health trends, lab results, and wellness routines.\n\n" \
                       f"You can ask about blood test terms, track your daily health logs, or upload medical reports for simple explanations.\n\n" \
                       f"*Remember: Always verify health decisions with your certified physician.*"

        return {
            "text": resp,
            "source": source,
            "is_urgent": False,
            "is_demo_mode": True
        }

    def explain_medical_term(self, term, lang='en'):
        key = term.lower().strip()
        explanation = None
        for k, v in MEDICAL_EXPLANATIONS.items():
            if k in key or key in k:
                if lang == 'ta' and k in TAMIL_TRANSLATIONS:
                    explanation = TAMIL_TRANSLATIONS[k]
                else:
                    explanation = v
                break
        
        if not explanation:
            if lang == 'ta':
                explanation = f"'{term}' என்பது ஒரு குறிப்பிட்ட மருத்துவ பரிசோதனை குறியீடு. துல்லியமான விளக்கத்திற்கு உங்கள் மருத்துவரை அணுகவும்."
            else:
                explanation = f"'{term}' is a diagnostic marker. Reference ranges and biological significance should be reviewed with your primary healthcare provider."

        return explanation

    def analyze_report_text(self, text):
        """
        Extracts medical test metrics, values, units, and reference ranges safely using regex patterns.
        Never fabricates values.
        """
        metrics = []
        
        # Patterns for common lab tests
        patterns = [
            (r"(?i)HbA1c[:\s]+([0-9]+\.?[0-9]*)\s*(%|percent)?", "HbA1c", "%", "4.0 - 5.6%"),
            (r"(?i)Fasting\s+(?:Blood\s+)?Glucose[:\s]+([0-9]+(?:\.[0-9]+)?)\s*(mg/dL|mg/dl)?", "Fasting Blood Sugar", "mg/dL", "70 - 99 mg/dL"),
            (r"(?i)Total\s+Cholesterol[:\s]+([0-9]+(?:\.[0-9]+)?)\s*(mg/dL|mg/dl)?", "Total Cholesterol", "mg/dL", "< 200 mg/dL"),
            (r"(?i)LDL(?:\s+Cholesterol)?[:\s]+([0-9]+(?:\.[0-9]+)?)\s*(mg/dL|mg/dl)?", "LDL Cholesterol", "mg/dL", "< 100 mg/dL"),
            (r"(?i)HDL(?:\s+Cholesterol)?[:\s]+([0-9]+(?:\.[0-9]+)?)\s*(mg/dL|mg/dl)?", "HDL Cholesterol", "mg/dL", "> 40 mg/dL"),
            (r"(?i)Triglycerides[:\s]+([0-9]+(?:\.[0-9]+)?)\s*(mg/dL|mg/dl)?", "Triglycerides", "mg/dL", "< 150 mg/dL"),
            (r"(?i)Hemoglobin[:\s]+([0-9]+\.?[0-9]*)\s*(g/dL|gm/dl)?", "Hemoglobin", "g/dL", "13.0 - 17.0 g/dL"),
            (r"(?i)WBC(?:\s+Count)?[:\s]+([0-9,]+)\s*(cells/mcL|/mcL|/cumm)?", "WBC Count", "cells/mcL", "4,000 - 11,000 /mcL"),
            (r"(?i)Platelet(?:\s+Count)?[:\s]+([0-9,]+)\s*(/mcL|lakhs/cumm|/cumm)?", "Platelets", "/mcL", "150,000 - 450,000 /mcL"),
            (r"(?i)Creatinine[:\s]+([0-9]+\.?[0-9]*)\s*(mg/dL|mg/dl)?", "Creatinine", "mg/dL", "0.7 - 1.3 mg/dL"),
            (r"(?i)TSH[:\s]+([0-9]+\.?[0-9]*)\s*(uIU/mL|mIU/L)?", "TSH", "uIU/mL", "0.4 - 4.0 uIU/mL"),
            (r"(?i)Blood\s+Pressure[:\s]+([0-9]{2,3}/[0-9]{2,3})\s*(mmHg)?", "Blood Pressure", "mmHg", "120/80 mmHg")
        ]

        found_names = set()
        for pat, name, default_unit, ref_range in patterns:
            match = re.search(pat, text)
            if match:
                val = match.group(1).replace(",", "")
                unit = match.group(2) if (len(match.groups()) > 1 and match.group(2)) else default_unit
                metrics.append({
                    "name": name,
                    "value": float(val) if val.replace(".", "").isdigit() else val,
                    "unit": unit,
                    "reference_range": ref_range,
                    "explanation": self.explain_medical_term(name)
                })
                found_names.add(name.lower())

        # If no regex matched, look for lines with numbers
        if not metrics:
            lines = text.split("\n")
            for line in lines:
                line_clean = line.strip()
                if ":" in line_clean or "-" in line_clean:
                    parts = re.split(r"[:\-]", line_clean, maxsplit=1)
                    if len(parts) == 2 and any(char.isdigit() for char in parts[1]):
                        param = parts[0].strip()
                        val_str = parts[1].strip()
                        if len(param) > 2 and len(param) < 35:
                            metrics.append({
                                "name": param,
                                "value": val_str,
                                "unit": "-",
                                "reference_range": "Consult Doctor",
                                "explanation": self.explain_medical_term(param)
                            })
                            if len(metrics) >= 6:
                                break

        return metrics

ai_service = AIService()
