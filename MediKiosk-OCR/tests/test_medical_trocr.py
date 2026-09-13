from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

from typing import Annotated
from pathlib import Path
import re
import shutil

import fitz  # PyMuPDF
from PIL import Image
from paddleocr import PaddleOCR


# ============================================================
# CONFIGURATION
# ============================================================

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".pdf",
}


# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(
    title="MediKiosk OCR API",
    description="OCR backend for extracting medication information from prescriptions.",
    version="1.0.0",
)


# Allow your friend's frontend to communicate with this backend.
# During development, "*" is fine.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# OCR MODEL
# ============================================================

print("Loading PaddleOCR...")

ocr = PaddleOCR(
    lang="en"
)

print("PaddleOCR loaded successfully!")


# ============================================================
# TEXT CLEANING
# ============================================================

def clean_text(text: str) -> str:
    """Clean common OCR artifacts."""

    if not text:
        return ""

    text = text.replace("\n", " ")
    text = re.sub(r"\s+", " ", text)

    return text.strip()


# ============================================================
# MEDICATION DETECTION
# ============================================================

MEDICATION_INSTRUCTION_WORDS = [
    "once",
    "twice",
    "thrice",
    "daily",
    "day",
    "days",
    "morning",
    "night",
    "evening",
    "afternoon",
    "meal",
    "meals",
    "before",
    "after",
    "tablet",
    "tablets",
    "capsule",
    "capsules",
    "syrup",
    "injection",
    "drops",
    "dose",
]


def looks_like_medication_line(text: str) -> bool:
    """
    Decide whether an OCR line is likely to contain medication information.

    This is intentionally conservative.
    We do NOT want the system inventing medicines.
    """

    lower = text.lower()

    # Medication-related dosage information
    has_strength = bool(
        re.search(
            r"\b\d+(?:\.\d+)?\s*(mg|mcg|g|ml|iu)\b",
            lower,
        )
    )

    # Medication-related instructions
    has_instruction = any(
        word in lower
        for word in MEDICATION_INSTRUCTION_WORDS
    )

    # Common prescription separators
    has_comma = "," in text

    return has_strength or (
        has_instruction and has_comma
    )


# ============================================================
# MEDICATION EXTRACTION
# ============================================================

def extract_medication(text: str) -> dict:
    """
    Convert an OCR line into a structured medication object.

    Example:

    "Paracetamol, 500 mg, Twice a day"

    becomes:

    {
        "medicine": "Paracetamol",
        "strength": "500 mg",
        "instructions": "Twice a day"
    }
    """

    text = clean_text(text)

    if not text:
        return None

    # Remove common OCR numbering
    text = re.sub(r"^[#\-\*\d\.\s]+", "", text).strip()

    parts = [
        part.strip()
        for part in text.split(",")
        if part.strip()
    ]

    if not parts:
        return None

    # --------------------------------------------------------
    # Find dosage / strength
    # --------------------------------------------------------

    strength_match = re.search(
        r"\b\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|iu)\b",
        text,
        re.IGNORECASE,
    )

    strength = ""

    if strength_match:
        strength = strength_match.group(0)

    # --------------------------------------------------------
    # Find instructions
    # --------------------------------------------------------

    instruction_parts = []

    for part in parts:

        lower = part.lower()

        # Skip the strength itself
        if strength and lower.strip() == strength.lower():
            continue

        # Detect instruction-related words
        if any(
            word in lower
            for word in MEDICATION_INSTRUCTION_WORDS
        ):
            instruction_parts.append(part)

    instructions = ", ".join(instruction_parts)

    # --------------------------------------------------------
    # Medicine name
    # --------------------------------------------------------

    medicine = parts[0]

    # Don't return obvious non-medication information
    bad_terms = [
        "patient",
        "name",
        "age",
        "address",
        "contact",
        "phone",
        "doctor",
        "physician",
        "prescription",
        "date",
        "medical",
        "hospital",
    ]

    if medicine.lower() in bad_terms:
        return None

    # Placeholder text from sample prescriptions
    if "insert medicine name" in medicine.lower():
        return None

    # If the line doesn't look medication-related, ignore it.
    if not looks_like_medication_line(text):
        return None

    return {
        "medicine": medicine,
        "strength": strength,
        "instructions": instructions,
    }


# ============================================================
# OCR IMAGE
# ============================================================

def process_image(image_path: Path) -> dict:
    """
    Run PaddleOCR on one image.
    """

    result = ocr.predict(str(image_path))

    raw_text = []
    medications = []

    for res in result:

        # PaddleOCR 3.x returns structured result objects.
        # Convert to JSON when available.
        try:
            data = res.json
        except Exception:
            data = None

        if callable(data):
            data = data()

        if isinstance(data, str):
            import json
            data = json.loads(data)

        if not isinstance(data, dict):
            continue

        # ----------------------------------------------------
        # Extract recognized text
        # ----------------------------------------------------

        rec_texts = data.get("rec_texts", [])
        rec_scores = data.get("rec_scores", [])

        for index, text in enumerate(rec_texts):

            text = clean_text(str(text))

            if not text:
                continue

            raw_text.append(text)

            medication = extract_medication(text)

            if medication:

                confidence = None

                if index < len(rec_scores):
                    try:
                        confidence = round(
                            float(rec_scores[index]),
                            3
                        )
                    except Exception:
                        confidence = None

                medication["confidence"] = confidence

                medications.append(medication)

    return {
        "raw_text": raw_text,
        "medications": medications,
    }


# ============================================================
# PDF PROCESSING
# ============================================================

def process_pdf(pdf_path: Path) -> dict:
    """
    Convert every PDF page into an image and OCR each page.
    """

    pdf = fitz.open(pdf_path)

    all_raw_text = []
    all_medications = []

    pdf_dir = UPLOAD_DIR / f"{pdf_path.stem}_pages"
    pdf_dir.mkdir(exist_ok=True)

    for page_number, page in enumerate(pdf):

        # Render page at good resolution
        pix = page.get_pixmap(
            matrix=fitz.Matrix(2, 2),
            alpha=False,
        )

        image_path = (
            pdf_dir /
            f"page_{page_number + 1}.png"
        )

        pix.save(str(image_path))

        page_result = process_image(image_path)

        for text in page_result["raw_text"]:
            all_raw_text.append({
                "page": page_number + 1,
                "text": text,
            })

        for medication in page_result["medications"]:

            medication["page"] = page_number + 1

            all_medications.append(medication)

    pdf.close()

    return {
        "raw_text": all_raw_text,
        "medications": all_medications,
    }


# ============================================================
# FILE PROCESSING
# ============================================================

def process_file(file_path: Path) -> dict:

    extension = file_path.suffix.lower()

    if extension == ".pdf":

        result = process_pdf(file_path)

    else:

        result = process_image(file_path)

    return result


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/")
def home():

    return {
        "status": "running",
        "service": "MediKiosk OCR API",
        "version": "1.0.0",
    }


# ============================================================
# OCR API
# ============================================================

@app.post("/ocr")
async def ocr_prescriptions(
    files: Annotated[
        list[UploadFile],
        File(...)
    ]
):

    documents = []

    for uploaded_file in files:

        filename = uploaded_file.filename or "unknown"

        extension = Path(filename).suffix.lower()

        # ----------------------------------------------------
        # Validate file
        # ----------------------------------------------------

        if extension not in ALLOWED_EXTENSIONS:

            documents.append({
                "filename": filename,
                "status": "error",
                "error": (
                    f"Unsupported file type: {extension}. "
                    f"Allowed types: JPG, JPEG, PNG, PDF."
                ),
            })

            continue

        # ----------------------------------------------------
        # Save uploaded file
        # ----------------------------------------------------

        safe_filename = Path(filename).name

        save_path = UPLOAD_DIR / safe_filename

        with save_path.open("wb") as buffer:
            shutil.copyfileobj(
                uploaded_file.file,
                buffer
            )

        # ----------------------------------------------------
        # Run OCR
        # ----------------------------------------------------

        try:

            result = process_file(save_path)

            documents.append({
                "filename": filename,
                "status": "success",
                "raw_text": result["raw_text"],
                "medications": result["medications"],
            })

        except Exception as e:

            documents.append({
                "filename": filename,
                "status": "error",
                "error": str(e),
            })

    return {
        "documents": documents
    }