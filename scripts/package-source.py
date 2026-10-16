"""Create a portable source archive without dependencies, research data or hosting identity."""
import json
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parents[1]
destination = root.parent / "trace-source.zip"
excluded = {"node_modules", ".git", ".next", ".next-e2e", ".vinext", ".wrangler", ".sites-runtime", ".trace-data", "dist", "playwright-report", "work", "outputs", "next-env.d.ts", "__pycache__"}

def files(directory):
    for item in directory.iterdir():
        if item.name in excluded or item.is_symlink():
            continue
        if item.is_dir():
            yield from files(item)
        elif not (item.name.startswith(".env") and item.name != ".env.example") and not item.name.endswith(".tsbuildinfo"):
            yield item

with ZipFile(destination, "w", ZIP_DEFLATED, strict_timestamps=False) as archive:
    for item in files(root):
        relative = item.relative_to(root)
        name = "trace/" + relative.as_posix()
        if relative.as_posix() == ".openai/hosting.json":
            config = json.loads(item.read_text(encoding="utf-8"))
            config.pop("project_id", None)
            archive.writestr(name, json.dumps(config, indent=2) + "\n")
        else:
            archive.write(item, name)

print(f"Source archive: {destination}")
