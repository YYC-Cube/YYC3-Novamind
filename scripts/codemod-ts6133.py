#!/usr/bin/env python3
"""Codemod: batch-fix TS6133/TS6192 unused identifier errors reported by tsc."""
import re
import subprocess
import sys
from collections import defaultdict

ROOT = "/Volumes/Max/YYC3-Novamind"

# error code -> message name pattern
PAT = re.compile(
    r"^(?P<file>[^(:]+)\((?P<line>\d+),(?P<col>\d+)\): error TS(?P<code>6133|6192): (?P<msg>.+)$"
)


def run_tsc():
    out = subprocess.run(
        ["npx", "tsc", "--noEmit"], cwd=ROOT, capture_output=True, text=True
    )
    return out.stdout + out.stderr


def collect(errors_text):
    by_file = defaultdict(list)
    for line in errors_text.splitlines():
        m = PAT.match(line)
        if not m:
            continue
        name = None
        mn = re.search(r"'([^']+)'", m.group("msg"))
        if mn:
            name = mn.group(1)
        by_file[m.group("file")].append(
            {"line": int(m.group("line")), "col": int(m.group("col")), "code": m.group("code"), "name": name}
        )
    return by_file


def fix_file(path, items):
    with open(path, encoding="utf-8") as f:
        lines = f.readlines()  # keep line endings

    # process bottom-up to keep indices stable
    changed = False
    for it in sorted(items, key=lambda x: -x["line"]):
        idx = it["line"] - 1
        if idx >= len(lines):
            continue
        raw = lines[idx]
        stripped = raw.strip()
        name = it["name"]
        if not name:
            # TS6192 with no quoted name: remove whole import line if simple
            if it["code"] == "6192" and stripped.startswith("import ") and stripped.endswith("'") or (it["code"] == "6192" and stripped.startswith("import")):
                del lines[idx]
                changed = True
            continue

        # multi-line import member: line is exactly `Name,` or `Name`
        if re.fullmatch(rf"{re.escape(name)},?", stripped):
            del lines[idx]
            changed = True
            continue

        # single-line import: remove the specifier inside braces
        if "import" in stripped and "{" in stripped:
            new = re.sub(
                rf"(?<=[{{,\s]){re.escape(name)}\s*,\s*",
                "",
                raw,
                count=1,
            )
            if new == raw:
                new = re.sub(
                    rf",\s*{re.escape(name)}(?=\s*[}}])",
                    "",
                    raw,
                    count=1,
                )
            if new == raw:
                new = re.sub(
                    rf"(?<=[{{\s]){re.escape(name)}(?=\s*[}}])",
                    "",
                    raw,
                    count=1,
                )
            if new != raw:
                # cleanup possible empty import braces -> drop the import
                if re.search(r"import\s*\{\s*\}\s*from", new):
                    continue
                lines[idx] = new
                changed = True
            continue

        # parameter / local / destructure: skip — renaming variables risks
        # breaking references elsewhere; only imports are safe to strip.
        continue

    if changed:
        with open(path, "w", encoding="utf-8") as f:
            f.writelines(lines)
    return changed


def main():
    for round_no in range(1, 4):
        text = run_tsc()
        by_file = collect(text)
        if not by_file:
            print("no TS6133/6192 left")
            break
        total = sum(len(v) for v in by_file.values())
        print(f"round {round_no}: {total} errors in {len(by_file)} files")
        for rel, items in by_file.items():
            fix_file(f"{ROOT}/{rel}", items)
    text = run_tsc()
    n6133 = len(re.findall(r"error TS6133", text))
    n6192 = len(re.findall(r"error TS6192", text))
    total = len(re.findall(r"error TS\d+", text))
    print(f"after: TS6133={n6133} TS6192={n6192} total={total}")


if __name__ == "__main__":
    sys.exit(main())
