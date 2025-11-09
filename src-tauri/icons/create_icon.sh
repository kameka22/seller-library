#!/bin/bash
# Créer une icône PNG simple
python3 << 'PYTHON'
from PIL import Image, ImageDraw
import os

# Créer une image 32x32 bleue
img = Image.new('RGB', (32, 32), color='blue')
img.save('icon.png')
print("Icône créée!")
PYTHON
