from PIL import Image
import matplotlib.pyplot as plt

image = Image.open("handwritten-prescription.jpeg")

plt.figure(figsize=(12, 12))
plt.imshow(image)

plt.xticks(range(0, 1200, 100))
plt.yticks(range(0, 1400, 100))
plt.grid()

plt.show()
