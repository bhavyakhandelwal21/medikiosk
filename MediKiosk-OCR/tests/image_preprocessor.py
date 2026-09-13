import cv2


def preprocess_image(input_path, output_path):
    # Load the image
    image = cv2.imread(input_path)

    if image is None:
        raise ValueError(f"Could not load image: {input_path}")

    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Light noise reduction
    denoised = cv2.GaussianBlur(gray, (3, 3), 0)

    # Save the lightly processed image
    cv2.imwrite(output_path, denoised)

    print(f"Processed image saved to: {output_path}")


if __name__ == "__main__":
    preprocess_image(
        "prescription-image.png",
        "prescription-image-processed.png"
    )