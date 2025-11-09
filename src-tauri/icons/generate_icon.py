#!/usr/bin/env python3
from PIL import Image, ImageDraw
import math

# Create a high-resolution icon (1024x1024)
size = 1024
img = Image.new('RGBA', (size, size), color=(0, 0, 0, 0))
draw = ImageDraw.Draw(img)

# Colors - modern blue gradient
bg_color = (59, 130, 246)  # Blue-500
accent_color = (37, 99, 235)  # Blue-600
tag_color = (251, 191, 36)  # Amber-400
white = (255, 255, 255)

# Draw rounded rectangle background
margin = 100
corner_radius = 180
draw.rounded_rectangle(
    [margin, margin, size - margin, size - margin],
    radius=corner_radius,
    fill=bg_color
)

# Draw a 3D box/package in the center
box_size = 400
box_x = (size - box_size) // 2
box_y = (size - box_size) // 2 - 50

# Box front face
box_front = [
    (box_x + 50, box_y + 150),
    (box_x + box_size - 50, box_y + 150),
    (box_x + box_size - 50, box_y + box_size + 50),
    (box_x + 50, box_y + box_size + 50)
]
draw.polygon(box_front, fill=accent_color)

# Box top face (isometric)
box_top = [
    (box_x + 50, box_y + 150),
    (box_x + box_size // 2, box_y + 50),
    (box_x + box_size - 50, box_y + 150)
]
draw.polygon(box_top, fill=(96, 165, 250))  # Lighter blue

# Box right face (isometric)
box_right = [
    (box_x + box_size - 50, box_y + 150),
    (box_x + box_size // 2, box_y + 50),
    (box_x + box_size // 2, box_y + box_size - 50),
    (box_x + box_size - 50, box_y + box_size + 50)
]
draw.polygon(box_right, fill=(29, 78, 216))  # Darker blue

# Draw price tag
tag_width = 200
tag_height = 120
tag_x = box_x + box_size - 80
tag_y = box_y + 80

# Tag shape (with hole for string)
tag_points = [
    (tag_x, tag_y + 30),
    (tag_x + tag_width, tag_y + 30),
    (tag_x + tag_width, tag_y + tag_height),
    (tag_x + tag_width - 30, tag_y + tag_height + 30),
    (tag_x, tag_y + tag_height + 30)
]
draw.polygon(tag_points, fill=tag_color)

# Tag hole
hole_center = (tag_x + 30, tag_y + 60)
hole_radius = 15
draw.ellipse(
    [hole_center[0] - hole_radius, hole_center[1] - hole_radius,
     hole_center[0] + hole_radius, hole_center[1] + hole_radius],
    fill=bg_color
)

# Draw dollar sign on tag
draw.text(
    (tag_x + 100, tag_y + 70),
    "$",
    fill=accent_color,
    font_size=80,
    anchor="mm"
)

# Save the icon
img.save('icon.png')
print("✓ Modern icon created: icon.png (1024x1024)")

# Create additional sizes for macOS
for size_px in [512, 256, 128, 64, 32, 16]:
    resized = img.resize((size_px, size_px), Image.Resampling.LANCZOS)
    resized.save(f'icon_{size_px}x{size_px}.png')
    print(f"✓ Created: icon_{size_px}x{size_px}.png")

print("\nIcon generation complete!")
