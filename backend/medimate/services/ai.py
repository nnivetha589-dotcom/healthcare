import json
from urllib.request import Request, urlopen


def generate_ai_answer(app, question):
    if app.config["DEMO_AI"]:
        text = question.lower()
        emergency_terms = (
            "chest pain", "difficulty breathing", "can't breathe", "cannot breathe",
            "fainted", "unconscious", "stroke", "severe bleeding", "suicidal",
        )
        if any(term in text for term in emergency_terms):
            return (
                "Demo AI · Urgent safety guidance: These symptoms may need immediate medical attention. "
                "Call your local emergency number now or go to the nearest emergency department. "
                "Do not drive yourself if you feel faint or unsafe. This is safety guidance, not a diagnosis."
            )
        responses = (
            (("fever", "temperature", "hot"), "Demo AI · Fever information: Rest, drink fluids if you can, and note the temperature, time, and other symptoms. Seek medical advice promptly for a very high or persistent fever, confusion, stiff neck, breathing trouble, dehydration, or concern about a young child or older adult. What is the temperature, how long has it lasted, and what other symptoms are present?"),
            (("headache", "migraine"), "Demo AI · Headache information: Consider hydration, regular food, rest, and reducing bright screens. Seek urgent care for a sudden severe headache, weakness, confusion, vision loss, fever with a stiff neck, or a headache after a head injury. How sudden was it, where is the pain, and how long has it lasted?"),
            (("blood pressure", "bp", "hypertension"), "Demo AI · Blood pressure information: A single reading does not establish a diagnosis. Sit quietly for five minutes, use a correctly sized cuff, and record the date, time, and reading. Discuss repeated unusual readings with a clinician, and do not change prescribed medicine doses without them. What was the reading and was it repeated after resting?"),
            (("sleep", "insomnia", "tired", "fatigue"), "Demo AI · Sleep information: Keep a consistent sleep and wake time, reduce caffeine late in the day, and keep the room dark and comfortable. Track sleep duration and daytime symptoms for a week. Talk with a clinician if tiredness is persistent, worsening, or affecting safety."),
            (("water", "hydration", "dehydrated"), "Demo AI · Hydration information: Drink regularly and use thirst and urine colour as general cues, unless a clinician has given you fluid restrictions. Seek care for confusion, fainting, inability to keep fluids down, or very little urine."),
            (("report", "lab", "blood test", "scan", "result"), "Demo AI · Report help: I can explain medical terms in plain language when you share the exact wording, value, unit, reference range, and report date. I will not diagnose from one result. Please remove names or IDs you do not want to share, and confirm results with your clinician."),
            (("medicine", "medication", "tablet", "dose", "prescription"), "Demo AI · Medication safety: Follow the prescription or clinician-provided instructions. I cannot recommend a new medicine or change a dose. A pharmacist or prescribing clinician can check interactions, missed doses, and side effects for your specific medicines."),
            (("exercise", "workout", "walking", "fitness"), "Demo AI · Activity information: Gentle activity such as walking can support general wellbeing when it is safe for you. Start gradually, warm up, and stop for chest pain, severe breathlessness, faintness, or unusual symptoms. Ask a clinician for personalised advice if you have a medical condition or are returning after illness."),
        )
        for terms, response in responses:
            if any(term in text for term in terms):
                return response
        if len(text.split()) < 4 or any(term in text for term in ("help", "what should i do", "not feeling well")):
            return "Demo AI · I need a little more information to help safely. What symptom or health topic are you asking about, when did it start, how severe is it, and what age group is the person in? If there are emergency symptoms, contact local urgent medical help now."
        return "Demo AI · I can provide general health information, but I need more context rather than guessing. Please share the main symptom or topic, when it started, how severe it is, relevant measurements, and any clinician instructions. I cannot diagnose or replace professional care."

    payload = json.dumps({
        "model": app.config["AI_MODEL"],
        "messages": [
            {"role": "system", "content": "Give safe, general health information. Do not diagnose, prescribe, or change doses. Ask clarifying questions when needed and advise urgent care for emergency symptoms."},
            {"role": "user", "content": question},
        ],
        "temperature": 0.2,
    }).encode("utf-8")
    req = Request(
        app.config["AI_API_URL"],
        data=payload,
        headers={
            "Authorization": f"Bearer {app.config['AI_API_KEY']}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urlopen(req, timeout=20) as response:
            result = json.loads(response.read().decode("utf-8"))
        return result["choices"][0]["message"]["content"]
    except (OSError, KeyError, IndexError, json.JSONDecodeError) as exc:
        app.logger.warning("AI provider request failed: %s", exc)
        return "The configured AI service is temporarily unavailable. Please try again later or use general medical guidance from a qualified clinician."
