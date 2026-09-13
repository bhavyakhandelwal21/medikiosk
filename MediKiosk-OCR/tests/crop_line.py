from PIL import Image

image = Image.open("handwritten-prescription.jpeg")

# Crop the Zantac medication line
crop = image.crop((120, 330, 1000, 420))
crop.save("medication-line.png")

print("Medication line saved as medication-line.png")