import re


# Words/phrases that commonly indicate medication instructions
INSTRUCTION_WORDS = [
    "once a day",
    "twice a day",
    "thrice a day",
    "once daily",
    "twice daily",
    "three times a day",
    "daily",
    "morning",
    "night",
    "at night",
    "after meal",
    "after meals",
    "before meal",
    "before meals",
    "with food",
    "without food",
]


def extract_medications(ocr_texts):
    medications = []

    for item in ocr_texts:

        text = item["text"]
        confidence = item["confidence"]

        # Remove brackets and extra spaces
        clean_text = text.strip("[]").strip()

        if not clean_text:
            continue

        # Ignore template placeholders
        if "insert medicine name" in clean_text.lower():
            continue

        lower_text = clean_text.lower()

        # Look for a strength such as:
        # 500 mg, 250 mcg, 10 ml, 2 g
        strength_match = re.search(
            r"\d+(?:\.\d+)?\s*(mg|mcg|ml|g)",
            clean_text,
            re.IGNORECASE
        )

        # Look for medication instructions
        has_instruction = any(
            phrase in lower_text
            for phrase in INSTRUCTION_WORDS
        )

        # A line is considered a medication candidate if:
        # 1. It contains a strength, OR
        # 2. It contains medication instructions
        if not strength_match and not has_instruction:
            continue

        # Split prescription line at semicolons
        parts = [part.strip() for part in clean_text.split(";")]

        # First part normally contains medicine name
        medicine_part = parts[0]

        # Extract strength if present
        if strength_match:
            strength = strength_match.group()

            medicine_name = re.sub(
                r",?\s*" + re.escape(strength),
                "",
                medicine_part,
                flags=re.IGNORECASE
            ).strip(" ,")
        else:
            strength = ""
            medicine_name = medicine_part.strip(" ,")

        # Everything after the first semicolon is an instruction
        instructions = "; ".join(parts[1:])

        # If there was no semicolon, the instruction may be
        # part of the same line.
        if not instructions and has_instruction:
            instruction_match = re.search(
                r"(once a day|twice a day|thrice a day|"
                r"once daily|twice daily|three times a day|"
                r"daily|morning|night|after meal|after meals|"
                r"before meal|before meals|with food|without food).*",
                medicine_name,
                re.IGNORECASE
            )

            if instruction_match:
                instructions = instruction_match.group().strip()

                medicine_name = medicine_name[
                    :instruction_match.start()
                ].strip(" ,")

        # Don't create an empty medication
        if not medicine_name:
            continue

        medication = {
            "medicine": medicine_name,
            "strength": strength,
            "instructions": instructions,
            "date": "",
            "confidence": round(float(confidence), 2)
        }

        medications.append(medication)

    return medications