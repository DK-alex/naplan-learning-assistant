from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageOps


def process_image(source: Path, target: Path) -> None:
    with Image.open(source) as image:
        image = ImageOps.exif_transpose(image).convert("RGB")
        image = ImageOps.fit(
            image,
            (1024, 768),
            method=Image.Resampling.LANCZOS,
            centering=(0.5, 0.5),
        )
        target.parent.mkdir(parents=True, exist_ok=True)
        image.save(
            target,
            "WEBP",
            quality=78,
            method=6,
            optimize=True,
            exif=b"",
            icc_profile=None,
        )


def main() -> None:
    parser = argparse.ArgumentParser(description="Prepare one generated writing-stimulus image.")
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--target", required=True, type=Path)
    args = parser.parse_args()

    if not args.source.is_file():
        raise FileNotFoundError(f"Generated source image not found: {args.source}")
    process_image(args.source.resolve(), args.target.resolve())


if __name__ == "__main__":
    main()

