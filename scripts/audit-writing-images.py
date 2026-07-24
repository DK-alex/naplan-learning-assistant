from __future__ import annotations

import hashlib
import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1] / "public" / "assets" / "writing-prompts"
YEARS = (3, 5, 7, 9)


def main() -> None:
    errors: list[str] = []
    files: list[Path] = []
    hashes: dict[str, list[str]] = {}
    by_year: dict[str, int] = {}

    for year in YEARS:
        directory = ROOT / f"year-{year}"
        year_files = sorted(directory.glob("*.webp"))
        by_year[str(year)] = len(year_files)
        if len(year_files) != 100:
            errors.append(f"Year {year}: expected 100 WebP files, found {len(year_files)}")
        files.extend(year_files)

    for file in files:
        digest = hashlib.sha256(file.read_bytes()).hexdigest()
        hashes.setdefault(digest, []).append(str(file.relative_to(ROOT)))
        try:
            with Image.open(file) as image:
                if image.format != "WEBP":
                    errors.append(f"{file.name}: expected WEBP, found {image.format}")
                if image.size != (1024, 768):
                    errors.append(f"{file.name}: expected 1024x768, found {image.size[0]}x{image.size[1]}")
        except Exception as error:
            errors.append(f"{file.name}: cannot be decoded ({error})")

    duplicates = [paths for paths in hashes.values() if len(paths) > 1]
    if duplicates:
        errors.append(f"Duplicate image hashes: {duplicates}")

    sizes = [file.stat().st_size for file in files]
    report = {
        "result": "passed" if not errors else "failed",
        "total_files": len(files),
        "by_year": by_year,
        "dimensions": "1024x768",
        "duplicate_hash_groups": len(duplicates),
        "total_mb": round(sum(sizes) / 1024 / 1024, 2) if sizes else 0,
        "minimum_kb": round(min(sizes) / 1024, 1) if sizes else 0,
        "maximum_kb": round(max(sizes) / 1024, 1) if sizes else 0,
        "errors": errors,
    }
    print(json.dumps(report, indent=2))
    if errors:
        raise SystemExit(1)


if __name__ == "__main__":
    main()

