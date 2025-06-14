#!/bin/bash

# Check if ImageMagick is installed
if ! command -v magick &> /dev/null; then
    echo "ImageMagick not found. Installing..."
    brew install imagemagick
fi

# Convert SVG files to PNG
for svg_file in assets/icons/*.svg; do
    if [ -f "$svg_file" ]; then
        png_file="${svg_file%.svg}.png"
        echo "Converting $svg_file to $png_file"
        magick -background none -size 24x24 "$svg_file" "$png_file"
    fi
done

echo "Icon conversion complete!" 