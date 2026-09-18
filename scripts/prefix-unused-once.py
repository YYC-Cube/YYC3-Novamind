#!/usr/bin/env python3
"""One-shot: prefix exactly the TS6133-reported identifiers with '_' (single pass)."""
import re
import subprocess
from collections import defaultdict

ROOT = "/Volumes/Max/YYC3-Novamind"
PAT = re.compile(
    r"^(?P<file>[^(:]+)\((?P<line>\d+),(?P<col>\d+)\): error TS6133: '(?P<name>[^']+)' is declared but its value is never read\.$"
)

def run_tsc():
    out = subprocess.run(["npx", "tsc", "--noEmit"], cwd=ROOT, capture_output=True, text=True)
    return out.stdout + out.stderr

def main():
    text = run_tsc()
    by_file = defaultdict(list)
    for line in text.splitlines():
        m = PAT.match(line)
        if m and not m.group("name").startswith("_"):
            by_file[m.group("file")].append((int(m.group("line")), int(m.group("col")), m.group("name")))

    for rel, items in by_file.items():
        path = f"{ROOT}/{rel}"
        with open(path, encoding="utf-8") as f:
            lines = f.readlines()
        changed = False
        for ln, col, name in sorted(items, key=lambda x: -x[0]):
            idx = ln - 1
            if idx >= len(lines):
                continue
            raw = lines[idx]
            c = col - 1
            if 0 <= c < len(raw) and raw[c : c + len(name)] == name:
                lines[idx] = raw[:c] + "_" + raw[c:]
                changed = True
        if changed:
            with open(path, "w", encoding="utf-8") as f:
                f.writelines(lines)
            print(f"prefixed {len(items)} name(s) in {rel}")

if __name__ == "__main__":
    main()
