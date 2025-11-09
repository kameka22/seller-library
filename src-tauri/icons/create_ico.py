#!/usr/bin/env python3
from PIL import Image

# Load the main icon
icon = Image.open('icon.png')

# Create .ico file with multiple sizes
icon.save('icon.ico', format='ICO', sizes=[
    (16, 16),
    (32, 32),
    (48, 48),
    (64, 64),
    (128, 128),
    (256, 256)
])

print("✓ Windows icon created: icon.ico")
