# -*- coding: utf-8 -*-
"""扫描 Chrome / Edge 所有 profile 的 localStorage 快照，找作品集修改器的覆盖层数据"""
import json, os, glob, sys

ROOTS = [
    r"C:\Users\pc\AppData\Local\Google\Chrome\User Data",
    r"C:\Users\pc\AppData\Local\Microsoft\Edge\User Data",
]
NEEDLE_UTF8 = b"ly_portfolio"
NEEDLE_UTF16 = "ly_portfolio".encode("utf-16-le")

dec = json.JSONDecoder()


def try_json(s):
    """从一个可能带脏字符的字符串里贪心解出第一个 JSON 对象"""
    pos = 0
    limit = min(len(s), 300000)
    while pos < limit:
        if s[pos] == "{":
            try:
                obj, _ = dec.raw_decode(s[pos:])
                return obj
            except Exception:
                pass
        pos += 1
    return None


def scan_file(path, needle, wide):
    try:
        data = open(path, "rb").read()
    except Exception:
        return []
    hits = []
    start = 0
    while True:
        i = data.find(needle, start)
        if i < 0:
            break
        start = i + 1
        ns = data[i : i + 300000]
        if wide:
            s = ns.decode("utf-16-le", errors="ignore").replace("\x00", "")
        else:
            s = ns.decode("utf-8", errors="ignore")
        obj = try_json(s)
        if isinstance(obj, dict) and any(
            k in obj for k in ("text", "style", "works", "media")
        ):
            hits.append(obj)
    return hits


all_hits = []
for root in ROOTS:
    for levels in glob.glob(os.path.join(root, "*", "Local Storage", "leveldb", "*")):
        if not os.path.isfile(levels):
            continue
        for needle, wide in ((NEEDLE_UTF16, True), (NEEDLE_UTF8, False)):
            for obj in scan_file(levels, needle, wide):
                all_hits.append((levels, obj))

print("total hits:", len(all_hits))
seen = set()
for path, obj in all_hits:
    sig = json.dumps(obj, ensure_ascii=False, sort_keys=True)
    if sig in seen:
        continue
    seen.add(sig)
    print("=" * 60)
    print("file:", path)
    print("keys:", list(obj.keys()))
    print("text :", json.dumps(obj.get("text", {}), ensure_ascii=False))
    print("style:", json.dumps(obj.get("style", {}), ensure_ascii=False))
    if obj.get("works"):
        print("works:", len(obj["works"]), json.dumps(obj["works"], ensure_ascii=False)[:600])
    if obj.get("media"):
        print("media:", json.dumps(obj["media"], ensure_ascii=False)[:800])

if all_hits:
    out = r"D:\作品集网站\scripts\_extracted_overrides.json"
    json.dump(all_hits[-1][1], open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print("\nsaved ->", out)
