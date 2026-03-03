#!/usr/bin/env python3
"""Reverse the order of ### sections in a markdown file."""

import sys
import re


def reverse_sections(text: str) -> str:
    # Split into lines and find ### header positions
    lines = text.splitlines(keepends=True)
    section_starts = [i for i, line in enumerate(lines) if re.match(r'^### ', line)]

    if len(section_starts) < 2:
        return text  # Nothing to reverse

    # Content before the first ### section
    preamble = lines[:section_starts[0]]

    # Extract each section (from its ### line to the next ### line or end)
    sections = []
    for i, start in enumerate(section_starts):
        end = section_starts[i + 1] if i + 1 < len(section_starts) else len(lines)
        sections.append(lines[start:end])

    sections.reverse()

    return "".join(preamble + [line for section in sections for line in section])


def main():
    if len(sys.argv) != 2:
        print(f"Usage: {sys.argv[0]} <markdown_file>", file=sys.stderr)
        sys.exit(1)

    path = sys.argv[1]
    with open(path, "r") as f:
        original = f.read()

    result = reverse_sections(original)

    with open(path, "w") as f:
        f.write(result)

    print(f"Reversed ### sections in {path}")


if __name__ == "__main__":
    main()
