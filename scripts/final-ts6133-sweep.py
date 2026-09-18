#!/usr/bin/env python3
"""Final TS6133 sweep: delete the reported unused declaration line when it is
a safe standalone statement (const/let with no further use, unused import),
else comment nothing. Idempotent, driven purely by tsc output."""
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
    for round_no in range(1, 4):
        text = run_tsc()
        by_file = defaultdict(list)
        for line in text.splitlines():
            m = PAT.match(line)
            if m:
                by_file[m.group("file")].append((int(m.group("line")), int(m.group("col")), m.group("name")))
        if not by_file:
            break
        total = sum(len(v) for v in by_file.values())
        print(f"round {round_no}: {total} TS6133 in {len(by_file)} files")
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
                stripped = raw.strip()
                # Case 1: unused import (single-line) -> strip specifier or drop line
                if "import" in stripped and "{" in stripped and name in stripped:
                    new = re.sub(rf"(?<=[{{,\s])type\s+{re.escape(name)}\s*,\s*", "", raw, count=1)
                    if new == raw:
                        new = re.sub(rf"(?<=[{{,\s]){re.escape(name)}\s*,\s*", "", raw, count=1)
                    if new == raw:
                        new = re.sub(rf",\s*type\s+{re.escape(name)}(?=\s*[}}])", "", raw, count=1)
                    if new == raw:
                        new = re.sub(rf",\s*{re.escape(name)}(?=\s*[}}])", "", raw, count=1)
                    if new == raw:
                        new = re.sub(rf"(?<=[{{\s])type\s+{re.escape(name)}(?=\s*[}}])", "", raw, count=1)
                    if new == raw:
                        new = re.sub(rf"(?<=[{{\s]){re.escape(name)}(?=\s*[}}])", "", raw, count=1)
                    if new != raw and not re.search(r"import\s*\{\s*\}\s*from", new):
                        lines[idx] = new
                        changed = True
                    elif re.search(r"import\s*\{\s*\}\s*from", new):
                        del lines[idx]
                        changed = True
                    continue
                # Case 2: whole line declares it and only it -> drop line
                if re.fullmatch(rf"(?:const|let|var)\s+(?:type\s+)?{re.escape(name)}\s*=?[^=]*[;?]?\n?", stripped) and stripped.endswith(("=", ";")) is not True:
                    pass  # too risky; handled by exact patterns below
                m2 = re.fullmatch(rf"(?:const|let|var)\s+{re.escape(name)}\s*=\s*[^;]+;?", stripped)
                if m2:
                    del lines[idx]
                    changed = True
                    continue
                # Case 3: class property `private static readonly NAME = ...` -> keep, prefix handled elsewhere
                # Case 4: destructure member `{ ..., name } = body` -> remove member
                m3 = re.fullmatch(rf"(?:const|let)\s*\{{.*\b{re.escape(name)}\b.*\}}\s*=\s*[^;]+;?", stripped)
                if m3:
                    new = re.sub(rf"(?<=[{{,\s])_{re.escape(name)}\s*,\s*", "", raw, count=1)
                    if new == raw:
                        new = re.sub(rf"(?<=[{{,\s]){re.escape(name)}\s*,\s*", "", raw, count=1)
                    if new == raw:
                        new = re.sub(rf",\s*_?{re.escape(name)}(?=\s*\}})", "", raw, count=1)
                    if new == raw:
                        new = re.sub(rf"(?<=[{{\s])_?{re.escape(name)}(?=\s*\}})", "", raw, count=1)
                    if new != raw:
                        lines[idx] = new
                        changed = True
                    continue
                # Case 5: `private _name: T = ...` or `private _name: T` class prop -> prefix impossible; drop initializer? skip.
                # Case 6: `_name(args...)` or function param on own line -> rename to `_name`
                c = col - 1
                if 0 <= c < len(raw) and raw[c : c + len(name)] == name:
                    before = raw[:c]
                    # function parameter context: line ends with ',' or contains ':' type annotation
                    if re.search(r":\s*\w+", raw) or stripped.endswith(","):
                        lines[idx] = before + "_" + raw[c:]
                        changed = True
            if changed:
                with open(path, "w", encoding="utf-8") as f:
                    f.writelines(lines)

    text = run_tsc()
    print("remaining TS6133:", len(PAT.findall(text)))
    print("total errors:", len(re.findall(r"error TS\d+", text)))

if __name__ == "__main__":
    main()
