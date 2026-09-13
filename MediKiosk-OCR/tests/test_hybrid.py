from paddleocr import PaddleOCR
from transformers import TrOCRProcessor, VisionEncoderDecoderModel
from PIL import Image
import torch
import re
import json


# ==============================
# LOAD PRETRAINED MODELS
# ==============================

print("Loading models...")

paddle_ocr = PaddleOCR()

model_name = "microsoft/trocr-base-handwritten"

processor = TrOCRProcessor.from_pretrained(model_name)
trocr = VisionEncoderDecoderModel.from_pretrained(model_name)

device = "mps" if torch.backends.mps.is_available() else "cpu"
trocr.to(device)

print("Models loaded!")
print("Device:", device)


# ==============================
# MEDICATION PARSER
# ==============================

INSTRUCTIONS = [
    "once a day",
    "twice a day",
    "thrice a day",
    "once daily",
    "twice daily",
    "three times a day",
    "daily",
    "morning",
    "night",
    "after meal",
    "after meals",
    "after a meal",
    "before meal",
    "before meals",
    "with food",
    "without food",
]


def extract_medication(text):

    text = text.strip()

    # Remove common OCR garbage
    text = re.sub(r"^[#2]+", "", text).strip()

    lower = text.lower()

    # Find dosage
    has_strength = re.search(
        r"\d+(?:\.\d+)?\s*(mg|mcg|ml|g)",
        text,
        re.IGNORECASE
    )

    # Check for medication instructions
    has_instruction = any(
        instruction in lower
        for instruction in INSTRUCTIONS
    )

    if not has_strength and not has_instruction:
        return None

    # Split by commas
    parts = [
        p.strip()
        for p in text.split(",")
        if p.strip()
    ]

    if not parts:
        return None

    medicine = parts[0]

    # Reject obvious non-medication lines
    rejected = [
        "prescription",
        "physician",
        "doctor",
        "address",
        "contact",
        "patient",
        "date",
        "medical",
        "phone",
    ]

    if any(word in medicine.lower() for word in rejected):
        return None

    # Extract strength
    strength = ""

    if has_strength:
        strength = has_strength.group().strip()

        medicine = re.sub(
            re.escape(strength),
            "",
            medicine,
            flags=re.IGNORECASE
        ).strip(" ,.")

    # Remove dosage from remaining parts
    remaining_parts = []

    for part in parts[1:]:

        if not re.fullmatch(
            r"\d+(?:\.\d+)?\s*(mg|mcg|ml|g)",
            part,
            re.IGNORECASE
        ):
            remaining_parts.append(part)

    instructions = ", ".join(remaining_parts)

    return {
        "medicine": medicine,
        "strength": strength,
        "instructions": instructions
    }


# ==============================
# PROCESS PRESCRIPTION
# ==============================

image_path = "handwritten-prescription.jpeg"

image = Image.open(image_path).convert("RGB")

print("\nProcessing:", image_path)

result = paddle_ocr.predict(image_path)

medications = []


for page in result:

    boxes = page["rec_boxes"]
    paddle_texts = page["rec_texts"]

    print(f"\nDetected {len(boxes)} regions.")

    for i, box in enumerate(boxes):

        x1, y1, x2, y2 = [
            int(value) for value in box
        ]

        padding = 10

        x1 = max(0, x1 - padding)
        y1 = max(0, y1 - padding)
        x2 = min(image.width, x2 + padding)
        y2 = min(image.height, y2 + padding)

        crop = image.crop(
            (x1, y1, x2, y2)
        )

        # ==========================
        # PaddleOCR text
        # ==========================

        paddle_text = paddle_texts[i]

        # ==========================
        # TrOCR text
        # ==========================

        pixel_values = processor(
            images=crop,
            return_tensors="pt"
        ).pixel_values.to(device)

        generated_ids = trocr.generate(
            pixel_values
        )

        trocr_text = processor.batch_decode(
            generated_ids,
            skip_special_tokens=True
        )[0]

        # ==========================
        # CHOOSE BETTER RESULT
        # ==========================

        paddle_has_strength = re.search(
            r"\d+(?:\.\d+)?\s*(mg|mcg|ml|g)",
            paddle_text,
            re.IGNORECASE
        )

        trocr_has_strength = re.search(
            r"\d+(?:\.\d+)?\s*(mg|mcg|ml|g)",
            trocr_text,
            re.IGNORECASE
        )

        if paddle_has_strength and not trocr_has_strength:
            selected_text = paddle_text
        else:
            selected_text = trocr_text

        print(
            f"Region {i + 1}: {selected_text}"
        )

        # ==========================
        # EXTRACT MEDICATION
        # ==========================

        medication = extract_medication(
            selected_text
        )

        if medication:
            medications.append(medication)


# ==============================
# FINAL JSON
# ==============================

output = {
    "filename": image_path,
    "medications": medications
}


print("\n==============================")
print("FINAL MEDICATION RESULT")
print("==============================\n")

print(
    json.dumps(
        output,
        indent=2,
        ensure_ascii=False
    )
)