from paddleocr import PaddleOCR
from prescription_parser import extract_medications
import json
import os


# Files to process
files = [
    "Blank-Prescription-1.pdf",
    "Blank-Prescription-2.pdf",
    "prescription-image.png"
]


ocr = PaddleOCR()

all_documents = []


for file in files:

    # Check that the file exists
    if not os.path.exists(file):
        print(f"File not found: {file}")
        continue

    print(f"Processing: {file}")

    result = ocr.predict(file)

    document = {
        "filename": file,
        "pages": []
    }

    for page_number, page in enumerate(result, start=1):

        texts = page["rec_texts"]
        scores = page["rec_scores"]

        ocr_data = []

        for text, score in zip(texts, scores):

            ocr_data.append({
                "text": text,
                "confidence": round(float(score), 2)
            })

        medications = extract_medications(ocr_data)

        document["pages"].append({
            "page": page_number,
            "medications": medications
        })

    all_documents.append(document)


print("\n===== FINAL OCR RESULT =====\n")

print(
    json.dumps(
        {
            "documents": all_documents
        },
        indent=2,
        ensure_ascii=False
    )
)