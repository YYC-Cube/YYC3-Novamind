#!/usr/bin/env python3
"""Remove underscore prefix ONLY from names tsc reports as unused (TS6133),
turning them back to their original name so they can be resolved manually,
EXCEPT: delete unused import lines outright. Safe-mode: only names listed in
the tsc output are touched.
"""
import re
import subprocess
from collections import defaultdict

ROOT = "/Volumes/Max/YYC3-Novamind"
PAT = re.compile(
    r"^(?P<file>[^(:]+)\((?P<line>\d+),(?P<col>\d+)\): error TS6133: '_(?P<name>[^']+)' is declared but its value is never read\.$"
)


def run_tsc():
    out = subprocess.run(["npx", "tsc", "--noEmit"], cwd=ROOT, capture_output=True, text=True)
    return out.stdout + out.stderr


def main():
    text = run_tsc()
    by_file = defaultdict(list)
    for line in text.splitlines():
        m = PAT.match(line)
        if m:
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
            if 0 <= c < len(raw) and raw[c : c + 1 + len(name)] == f"_{name}":
                lines[idx] = raw[:c] + name + raw[c + 1 + len(name) :]
                changed = True
        if changed:
            with open(path, "w", encoding="utf-8") as f:
                f.writelines(lines)
            print(f"unprefixed {len(items)} name(s) in {rel}")


if __name__ == "__main__":
    main()
