"""Run the Codex DOCX renderer with Windows-safe LibreOffice profile URIs."""

from __future__ import annotations

import importlib.util
from pathlib import Path
import subprocess
import sys


if len(sys.argv) < 3:
    raise SystemExit("Usage: render-docx-windows.py RENDER_DOCX_PY INPUT [renderer options]")

renderer_path = Path(sys.argv[1]).resolve()
spec = importlib.util.spec_from_file_location("codex_render_docx", renderer_path)
if spec is None or spec.loader is None:
    raise SystemExit(f"Could not load renderer: {renderer_path}")

renderer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(renderer)


def windows_safe_run_cmd(command, env, verbose):
    fixed_command = []
    for item in command:
        if isinstance(item, str) and item.startswith("-env:UserInstallation=file://"):
            raw_path = item.removeprefix("-env:UserInstallation=file://")
            fixed_command.append(f"-env:UserInstallation={Path(raw_path).resolve().as_uri()}")
        elif item == "soffice":
            soffice = Path(env["NAPLAN_QA_SOFFICE"]).resolve()
            fixed_command.append(str(soffice))
        else:
            fixed_command.append(item)

    process = subprocess.run(
        fixed_command,
        check=False,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        env=env,
    )
    if verbose:
        print("[render_docx] $ " + " ".join(fixed_command))
        if process.stdout:
            print(process.stdout)
        if process.stderr:
            print(process.stderr)
    return process


renderer._run_cmd = windows_safe_run_cmd
sys.argv = [str(renderer_path), *sys.argv[2:]]
renderer.main()
