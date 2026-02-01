#!/usr/bin/env -S uv run
# /// script
# dependencies = [
#   "pillow>=10.0",
#   "requests>=2.31",
# ]
# requires-python = ">=3.11"
# ///
"""
DNA to Image Visualization

Converts a chromosome FASTA file into a visual representation where each
nucleotide becomes a colored pixel. Colors are chosen based on base pairing:

  A (Adenine)  → Red    } complementary pair
  T (Thymine)  → Green  }
  G (Guanine)  → Blue   } complementary pair
  C (Cytosine) → Yellow }
  N (unknown)  → Gray

This script downloads the human Y chromosome from UCSC Genome Browser (hg38)
and generates a square PNG image.

Usage:
    uv run dna_image.py

Output:
    chrY.png in the same directory as this script

Original concept: Jason Knight, 2011 (originally in Haskell)
Recreated with Claude Code, 2026
"""

import gzip
import math
import sys
from pathlib import Path

import requests
from PIL import Image

# UCSC Genome Browser - Human reference genome hg38, Y chromosome
FASTA_URL = "https://hgdownload.cse.ucsc.edu/goldenPath/hg38/chromosomes/chrY.fa.gz"
FASTA_FILENAME = "chrY.fa.gz"

# Color mapping for nucleotides (RGBA)
# Base pairs: A-T and G-C are complementary
NUCLEOTIDE_COLORS = {
    "A": (255, 0, 0, 255),      # Red - Adenine
    "T": (0, 255, 0, 255),      # Green - Thymine (pairs with A)
    "G": (0, 0, 255, 255),      # Blue - Guanine
    "C": (255, 255, 0, 255),    # Yellow - Cytosine (pairs with G)
    "N": (128, 128, 128, 255),  # Gray - Unknown/ambiguous
}


def download_fasta(url: str, dest: Path) -> None:
    """Download FASTA file if not already present."""
    if dest.exists():
        print(f"Using cached {dest.name}")
        return

    print(f"Downloading {url}...")
    response = requests.get(url, stream=True)
    response.raise_for_status()

    total_size = int(response.headers.get("content-length", 0))
    downloaded = 0

    with open(dest, "wb") as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)
            downloaded += len(chunk)
            if total_size:
                pct = (downloaded / total_size) * 100
                print(f"\r  {downloaded:,} / {total_size:,} bytes ({pct:.1f}%)", end="")

    print(f"\n  Saved to {dest}")


def parse_fasta(filepath: Path) -> str:
    """Parse a gzipped FASTA file and return the sequence (uppercase)."""
    print(f"Parsing {filepath.name}...")
    sequence_parts = []

    opener = gzip.open if filepath.suffix == ".gz" else open

    with opener(filepath, "rt") as f:
        for line in f:
            # Skip header lines (start with >)
            if line.startswith(">"):
                continue
            # Add sequence data (strip whitespace, uppercase)
            sequence_parts.append(line.strip().upper())

    sequence = "".join(sequence_parts)
    print(f"  Parsed {len(sequence):,} nucleotides")
    return sequence


def sequence_to_image(sequence: str, output_path: Path) -> None:
    """Convert a DNA sequence to a PNG image."""
    num_bases = len(sequence)

    # Calculate square dimensions (round up to fit all bases)
    side_length = math.ceil(math.sqrt(num_bases))
    total_pixels = side_length * side_length

    print(f"Creating {side_length}x{side_length} image ({total_pixels:,} pixels)...")

    # Create image
    img = Image.new("RGBA", (side_length, side_length), (0, 0, 0, 255))
    pixels = img.load()

    # Fill pixels with nucleotide colors
    for i, nucleotide in enumerate(sequence):
        x = i % side_length
        y = i // side_length
        color = NUCLEOTIDE_COLORS.get(nucleotide, NUCLEOTIDE_COLORS["N"])
        pixels[x, y] = color

        # Progress indicator every 10%
        if (i + 1) % (num_bases // 10) == 0:
            pct = ((i + 1) / num_bases) * 100
            print(f"\r  Processing: {pct:.0f}%", end="")

    print(f"\r  Processing: 100%")

    # Fill remaining pixels (if any) with black
    remaining = total_pixels - num_bases
    if remaining > 0:
        print(f"  Filling {remaining:,} padding pixels with black")

    # Save the image
    print(f"Saving to {output_path}...")
    img.save(output_path, "PNG")
    print(f"  Done! Image saved as {output_path}")


def main() -> None:
    """Main entry point."""
    # Use the directory containing this script
    script_dir = Path(__file__).parent

    fasta_path = script_dir / FASTA_FILENAME
    output_path = script_dir / "chrY.png"

    print("=" * 60)
    print("DNA to Image Visualization")
    print("=" * 60)
    print()

    # Download FASTA file
    download_fasta(FASTA_URL, fasta_path)

    # Parse the sequence
    sequence = parse_fasta(fasta_path)

    # Generate the image
    sequence_to_image(sequence, output_path)

    print()
    print("Color key:")
    print("  A (Adenine)  → Red")
    print("  T (Thymine)  → Green")
    print("  G (Guanine)  → Blue")
    print("  C (Cytosine) → Yellow")
    print("  N (unknown)  → Gray")


if __name__ == "__main__":
    main()
