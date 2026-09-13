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

print(f"Using device: {device}")
print("TrOCR loaded successfully!")