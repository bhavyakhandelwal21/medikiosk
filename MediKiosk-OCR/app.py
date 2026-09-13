from fastapi import FastAPI, UploadFile, File
from typing import Annotated
from fastapi.middleware.cors import CORSMiddleware

from paddleocr import PaddleOCR
from transformers import TrOCRProcessor, VisionEncoderDecoderModel
from PIL import Image

import torch
import re
import os
import shutil
import fitz


# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(title="MediKiosk OCR API")


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# LOAD OCR MODELS
# ============================================================

print("Loading PaddleOCR...")
paddle_ocr = PaddleOCR()

print("Loading TrOCR...")

model_name = "microsoft/trocr-base-handwritten"

processor = TrOCRProcessor.from_pretrained(
    model_name,
    use_fast=False
)

trocr = VisionEncoderDecoderModel.from_pretrained(
    model_name
)

device = (
    "mps"
    if torch.backends.mps.is_available()
    else "cpu"
)

trocr.to(device)

print("OCR models loaded!")
print("Device:", device)


# ============================================================
# MEDICATION INSTRUCTIONS
# ============================================================

INSTRUCTIONS = [
    "once a day",
    "twice a day",
    "thrice a day",
    "once daily",
    "twice daily",
    "three times a day",
    "daily",
    "morning",
    "afternoon",
    "evening",
    "night",
    "after meal",
    "after meals",
    "after a meal",
    "before meal",
    "before meals",
    "with food",
    "without food",
]


# ============================================================
# CLEAN OCR TEXT
# ============================================================

def clean_ocr_text(text):

    text = text.strip()

    # Remove common garbage characters at beginning
    text = re.sub(r"^[#2]+", "", text).strip()

    # Normalize spaces
    text = re.sub(r"\s+", " ", text)

    return text


# ============================================================
# CHECK FOR MEDICATION INFORMATION
# ============================================================

def has_medication_information(text):

    text = clean_ocr_text(text)

    lower = text.lower()

    # Dosage such as:
    # 500mg
    # 500 mg
    # 5 ml
    # 1 g

    has_strength = re.search(
        r"\d+(?:\.\d+)?\s*(mg|mcg|ml|g)",
        text,
        re.IGNORECASE
    )

    # Instructions such as:
    # twice a day
    # once a day
    # after meals

    has_instruction = any(
        instruction in lower
        for instruction in INSTRUCTIONS
    )

    return bool(
        has_strength or has_instruction
    )


# ============================================================
# MEDICATION PARSER
# ============================================================

def extract_medication(text):

    text = clean_ocr_text(text)

    if not text:
        return None

    lower = text.lower()

    # --------------------------------------------------------
    # Reject obvious non-medication text
    # --------------------------------------------------------

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
        "age",
        "mr.",
        "mrs.",
        "ms.",
        "dr.",
    ]

    # --------------------------------------------------------
    # Find strength
    # --------------------------------------------------------

    strength_match = re.search(
        r"\d+(?:\.\d+)?\s*(mg|mcg|ml|g)",
        text,
        re.IGNORECASE
    )

    # --------------------------------------------------------
    # Find instructions
    # --------------------------------------------------------

    has_instruction = any(
        instruction in lower
        for instruction in INSTRUCTIONS
    )

    # If there is no dosage and no instruction,
    # it is probably not a medication.
    if not strength_match and not has_instruction:
        return None

    # --------------------------------------------------------
    # Split by comma
    # --------------------------------------------------------

    parts = [
        part.strip()
        for part in text.split(",")
        if part.strip()
    ]

    if not parts:
        return None

    medicine = parts[0]

    # --------------------------------------------------------
    # Reject non-medication lines
    # --------------------------------------------------------

    if any(
        word in medicine.lower()
        for word in rejected
    ):
        return None

    # --------------------------------------------------------
    # Extract strength
    # --------------------------------------------------------

    strength = ""

    if strength_match:

        strength = strength_match.group().strip()

        medicine = re.sub(
            re.escape(strength),
            "",
            medicine,
            flags=re.IGNORECASE
        ).strip(" ,.")


    # --------------------------------------------------------
    # Remove standalone dosage from remaining parts
    # --------------------------------------------------------

    remaining_parts = []

    for part in parts[1:]:

        if not re.fullmatch(
            r"\d+(?:\.\d+)?\s*(mg|mcg|ml|g)",
            part,
            re.IGNORECASE
        ):
            remaining_parts.append(part)

    instructions = ", ".join(
        remaining_parts
    )


    # --------------------------------------------------------
    # Clean common OCR mistakes in instructions
    # --------------------------------------------------------

    instructions = re.sub(
        r"\s+",
        " ",
        instructions
    ).strip()


    if not medicine:
        return None


    return {
        "medicine": medicine.strip(),
        "strength": strength,
        "instructions": instructions
    }


# ============================================================
# CHECK WHETHER TWO OCR REGIONS SHOULD BE MERGED
# ============================================================

def should_merge_regions(current, next_region):

    x1, y1, x2, y2 = current["box"]

    nx1, ny1, nx2, ny2 = next_region["box"]

    current_text = clean_ocr_text(
        current["text"]
    )

    next_text = clean_ocr_text(
        next_region["text"]
    )


    # --------------------------------------------------------
    # Current region should look like a medication name
    # without dosage/instructions.
    #
    # Example:
    #
    # Paracetamol
    #
    # --------------------------------------------------------

    current_has_info = has_medication_information(
        current_text
    )

    next_has_info = has_medication_information(
        next_text
    )


    if current_has_info:
        return False

    if not next_has_info:
        return False


    # --------------------------------------------------------
    # Horizontal overlap
    # --------------------------------------------------------

    overlap_left = max(
        x1,
        nx1
    )

    overlap_right = min(
        x2,
        nx2
    )

    overlap_width = max(
        0,
        overlap_right - overlap_left
    )


    current_width = x2 - x1
    next_width = nx2 - nx1

    smaller_width = min(
        current_width,
        next_width
    )


    if smaller_width <= 0:
        return False


    horizontal_overlap = (
        overlap_width /
        smaller_width
    )


    # --------------------------------------------------------
    # Vertical relationship
    # --------------------------------------------------------

    current_center_y = (
        y1 + y2
    ) / 2

    next_center_y = (
        ny1 + ny2
    ) / 2

    vertical_distance = abs(
        next_center_y -
        current_center_y
    )


    # --------------------------------------------------------
    # Merge if:
    #
    # 1. Regions strongly overlap horizontally
    # 2. They are vertically close
    #
    # This handles:
    #
    # Paracetamol
    # 500mg, Twice a day
    # --------------------------------------------------------

    return (
        horizontal_overlap >= 0.60
        and vertical_distance <= 130
    )


# ============================================================
# MERGE OCR REGIONS
# ============================================================

def merge_regions(regions):

    if not regions:
        return []


    # Sort from top to bottom
    regions = sorted(
        regions,
        key=lambda region:
        region["box"][1]
    )


    merged = []

    i = 0

    while i < len(regions):

        current = regions[i]


        # ----------------------------------------------------
        # Try to merge current region with next region
        # ----------------------------------------------------

        if i + 1 < len(regions):

            next_region = regions[i + 1]


            if should_merge_regions(
                current,
                next_region
            ):

                print(
                    f"Merging OCR regions "
                    f"{i + 1} and {i + 2}"
                )


                x1, y1, x2, y2 = (
                    current["box"]
                )

                nx1, ny1, nx2, ny2 = (
                    next_region["box"]
                )


                merged_region = {
                    "box": (
                        min(x1, nx1),
                        min(y1, ny1),
                        max(x2, nx2),
                        max(y2, ny2)
                    ),
                    "text": (
                        clean_ocr_text(
                            current["text"]
                        )
                        + ", "
                        +
                        clean_ocr_text(
                            next_region["text"]
                        )
                    )
                }


                merged.append(
                    merged_region
                )


                # Skip both regions
                i += 2

                continue


        # ----------------------------------------------------
        # No merge
        # ----------------------------------------------------

        merged.append(
            current
        )

        i += 1


    return merged


# ============================================================
# PROCESS ONE IMAGE
# ============================================================

def process_image(
    image,
    filename,
    page_number=None
):

    # --------------------------------------------------------
    # Save temporary image
    # --------------------------------------------------------

    temp_name = "temp_ocr_image.png"

    image.save(
        temp_name
    )


    # --------------------------------------------------------
    # PaddleOCR
    # --------------------------------------------------------

    result = paddle_ocr.predict(
        temp_name
    )


    medications = []


    for page in result:

        boxes = page["rec_boxes"]

        paddle_texts = page["rec_texts"]


        print(
            f"Detected {len(boxes)} regions."
        )


        # ----------------------------------------------------
        # Create region objects
        # ----------------------------------------------------

        regions = []


        for i, box in enumerate(boxes):

            x1, y1, x2, y2 = [
                int(value)
                for value in box
            ]


            regions.append({
                "box": (
                    x1,
                    y1,
                    x2,
                    y2
                ),
                "text": paddle_texts[i]
            })


        # ----------------------------------------------------
        # Merge split regions
        # ----------------------------------------------------

        regions = merge_regions(
            regions
        )


        print(
            f"Processing {len(regions)} final regions."
        )


        # ----------------------------------------------------
        # Process each region
        # ----------------------------------------------------

        for i, region in enumerate(
            regions
        ):

            x1, y1, x2, y2 = (
                region["box"]
            )


            paddle_text = clean_ocr_text(
                region["text"]
            )


            # ------------------------------------------------
            # Add padding
            # ------------------------------------------------

            padding = 10

            x1 = max(
                0,
                x1 - padding
            )

            y1 = max(
                0,
                y1 - padding
            )

            x2 = min(
                image.width,
                x2 + padding
            )

            y2 = min(
                image.height,
                y2 + padding
            )


            # ------------------------------------------------
            # Crop
            # ------------------------------------------------

            crop = image.crop(
                (
                    x1,
                    y1,
                    x2,
                    y2
                )
            )


            # ------------------------------------------------
            # TrOCR
            # ------------------------------------------------

            pixel_values = processor(
                images=crop,
                return_tensors="pt"
            ).pixel_values.to(
                device
            )


            generated_ids = trocr.generate(
                pixel_values
            )


            trocr_text = processor.batch_decode(
                generated_ids,
                skip_special_tokens=True
            )[0]


            trocr_text = clean_ocr_text(
                trocr_text
            )


            # ------------------------------------------------
            # Choose OCR result
            # ------------------------------------------------
            #
            # TrOCR is generally preferred for handwriting.
            #
            # If PaddleOCR sees a dosage that TrOCR completely
            # misses, keep PaddleOCR's version.
            # ------------------------------------------------

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


            if (
                paddle_has_strength
                and not trocr_has_strength
            ):

                selected_text = paddle_text

            else:

                selected_text = trocr_text


            print(
                f"Region {i + 1}: "
                f"{selected_text}"
            )


            # ------------------------------------------------
            # Extract medication
            # ------------------------------------------------

            medication = extract_medication(
                selected_text
            )


            if medication:

                medication["page"] = (
                    page_number
                )

                medications.append(
                    medication
                )


    # --------------------------------------------------------
    # Remove temporary image
    # --------------------------------------------------------

    if os.path.exists(
        temp_name
    ):

        try:
            os.remove(
                temp_name
            )
        except:
            pass


    return medications


# ============================================================
# PROCESS PDF
# ============================================================

def process_pdf(
    file_path,
    filename
):

    pdf = fitz.open(
        file_path
    )


    all_medications = []


    for page_number in range(
        len(pdf)
    ):

        page = pdf[
            page_number
        ]


        # Render PDF page as image
        pix = page.get_pixmap(
            matrix=fitz.Matrix(
                2,
                2
            )
        )


        image = Image.frombytes(
            "RGB",
            [
                pix.width,
                pix.height
            ],
            pix.samples
        )


        medications = process_image(
            image,
            filename,
            page_number + 1
        )


        all_medications.extend(
            medications
        )


    pdf.close()


    return all_medications


# ============================================================
# PROCESS FILE
# ============================================================

def process_file(
    file_path,
    filename
):

    extension = os.path.splitext(
        filename
    )[1].lower()


    # --------------------------------------------------------
    # PDF
    # --------------------------------------------------------

    if extension == ".pdf":

        medications = process_pdf(
            file_path,
            filename
        )


    # --------------------------------------------------------
    # IMAGE
    # --------------------------------------------------------

    else:

        image = Image.open(
            file_path
        ).convert("RGB")


        medications = process_image(
            image,
            filename
        )


    return {
        "filename": filename,
        "medications": medications
    }


# ============================================================
# HOME
# ============================================================

@app.get("/")
def home():

    return {
        "message":
        "MediKiosk OCR API is running"
    }


# ============================================================
# OCR ENDPOINT
# ============================================================

@app.post("/ocr")
async def ocr(
    files: Annotated[
        list[UploadFile],
        File()
    ]
):

    # --------------------------------------------------------
    # Create uploads directory
    # --------------------------------------------------------

    os.makedirs(
        "uploads",
        exist_ok=True
    )


    documents = []


    # --------------------------------------------------------
    # Process all uploaded files
    # --------------------------------------------------------

    for file in files:

        file_path = os.path.join(
            "uploads",
            file.filename
        )


        # Save uploaded file
        with open(
            file_path,
            "wb"
        ) as buffer:

            shutil.copyfileobj(
                file.file,
                buffer
            )


        print(
            f"\nProcessing: "
            f"{file.filename}"
        )


        result = process_file(
            file_path,
            file.filename
        )


        documents.append(
            result
        )


    # --------------------------------------------------------
    # Return structured JSON
    # --------------------------------------------------------

    return {
        "documents": documents
    }