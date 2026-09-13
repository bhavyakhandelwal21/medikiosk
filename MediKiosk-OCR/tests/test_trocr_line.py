from transformers import TrOCRProcessor, VisionEncoderDecoderModel
from PIL import Image
import torch

print("Loading TrOCR...")

processor = TrOCRProcessor.from_pretrained(
    "microsoft/trocr-base-handwritten"
)

model = VisionEncoderDecoderModel.from_pretrained(
    "microsoft/trocr-base-handwritten"
)

device = "mps" if torch.backends.mps.is_available() else "cpu"
model.to(device)

print("Using device:", device)

# Load the cropped handwritten line
image = Image.open("medication-line.png").convert("RGB")

# Convert image into model input
pixel_values = processor(
    images=image,
    return_tensors="pt"
).pixel_values

pixel_values = pixel_values.to(device)

# Generate text
generated_ids = model.generate(pixel_values)

# Convert model output into readable text
generated_text = processor.batch_decode(
    generated_ids,
    skip_special_tokens=True
)[0]

print("\n===== TrOCR RESULT =====")
print(generated_text)