#!/usr/bin/env -S uv run
# /// script
# dependencies = [
#   "pillow>=10.0",
#   "requests>=2.31",
# ]
# requires-python = ">=3.11"
# ///
"""
DNA to Image Visualization using Hilbert Curve

Converts a chromosome FASTA file into a visual representation where each
nucleotide becomes a colored pixel, laid out along a Hilbert space-filling curve.

The Hilbert curve preserves locality better than a linear layout - nearby
nucleotides in the sequence will be nearby in the image, which can reveal
patterns in the DNA structure.

Colors are chosen based on base pairing:
  A (Adenine)  → Red    } complementary pair
  T (Thymine)  → Green  }
  G (Guanine)  → Blue   } complementary pair
  C (Cytosine) → Yellow }
  N (unknown)  → Gray

Usage:
    uv run dna_image_hilbert.py

Output:
    chrY_hilbert.png in the same directory as this script

Original concept: Jason Knight, 2011 (originally in Haskell)
Recreated with Claude Code, 2026 (Hilbert curve variant)
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


def hilbert_d2xy(n: int, d: int) -> tuple[int, int]:
    """
    Convert Hilbert curve index d to (x, y) coordinates.

    n: size of the grid (must be power of 2)
    d: index along the Hilbert curve (0 to n*n - 1)

    Returns (x, y) coordinates in the grid.
    """
    x = y = 0
    s = 1
    while s < n:
        rx = 1 & (d // 2)
        ry = 1 & (d ^ rx)
        x, y = hilbert_rot(s, x, y, rx, ry)
        x += s * rx
        y += s * ry
        d //= 4
        s *= 2
    return x, y


def hilbert_rot(n: int, x: int, y: int, rx: int, ry: int) -> tuple[int, int]:
    """Rotate/flip quadrant for Hilbert curve."""
    if ry == 0:
        if rx == 1:
            x = n - 1 - x
            y = n - 1 - y
        x, y = y, x
    return x, y


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


def sequence_to_image_hilbert(sequence: str, output_path: Path) -> None:
    """Convert a DNA sequence to a PNG image using Hilbert curve layout."""
    num_bases = len(sequence)

    # Find the smallest power of 2 that can fit all bases
    # Hilbert curve requires power-of-2 dimensions
    order = math.ceil(math.log2(math.sqrt(num_bases)))
    side_length = 2 ** order
    total_pixels = side_length * side_length

    print(f"Creating {side_length}x{side_length} image (Hilbert order {order}, {total_pixels:,} pixels)...")
    print(f"  (Using {num_bases:,} of {total_pixels:,} pixels)")

    # Create image with black background
    img = Image.new("RGBA", (side_length, side_length), (0, 0, 0, 255))
    pixels = img.load()

    # Pre-compute Hilbert curve coordinates for better performance
    print("  Computing Hilbert curve coordinates...")

    # Fill pixels along the Hilbert curve
    for i, nucleotide in enumerate(sequence):
        x, y = hilbert_d2xy(side_length, i)
        color = NUCLEOTIDE_COLORS.get(nucleotide, NUCLEOTIDE_COLORS["N"])
        pixels[x, y] = color

        # Progress indicator every 10%
        if (i + 1) % (num_bases // 10) == 0:
            pct = ((i + 1) / num_bases) * 100
            print(f"\r  Processing: {pct:.0f}%", end="")

    print(f"\r  Processing: 100%")

    # Remaining pixels stay black (padding)
    remaining = total_pixels - num_bases
    if remaining > 0:
        print(f"  {remaining:,} padding pixels remain black")

    # Save the image
    print(f"Saving to {output_path}...")
    img.save(output_path, "PNG")
    print(f"  Done! Image saved as {output_path}")


def main() -> None:
    """Main entry point."""
    # Use the directory containing this script
    script_dir = Path(__file__).parent

    fasta_path = script_dir / FASTA_FILENAME
    output_path = script_dir / "chrY_hilbert.png"

    print("=" * 60)
    print("DNA to Image Visualization (Hilbert Curve)")
    print("=" * 60)
    print()

    # Download FASTA file
    download_fasta(FASTA_URL, fasta_path)

    # Parse the sequence
    sequence = parse_fasta(fasta_path)

    # Generate the image
    sequence_to_image_hilbert(sequence, output_path)

    print()
    print("Color key:")
    print("  A (Adenine)  → Red")
    print("  T (Thymine)  → Green")
    print("  G (Guanine)  → Blue")
    print("  C (Cytosine) → Yellow")
    print("  N (unknown)  → Gray")
    print()
    print("The Hilbert curve layout preserves locality - nearby nucleotides")
    print("in the sequence are nearby in the image, revealing patterns.")


if __name__ == "__main__":
    main()
