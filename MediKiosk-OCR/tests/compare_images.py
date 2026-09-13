from paddleocr import PaddleOCR


ocr = PaddleOCR()


images = [
    "prescription-image.png",
    "prescription-image-processed.png"
]


for image in images:

    print("\n===================================")
    print(f"IMAGE: {image}")
    print("===================================\n")

    result = ocr.predict(image)

    for page in result:

        texts = page["rec_texts"]
        scores = page["rec_scores"]

        total_score = 0

        for text, score in zip(texts, scores):

            print(f"{float(score):.2f} | {text}")

            total_score += float(score)

        if len(scores) > 0:
            average_score = total_score / len(scores)
            print(f"\nAverage confidence: {average_score:.3f}")