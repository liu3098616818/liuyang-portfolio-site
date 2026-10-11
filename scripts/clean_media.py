# -*- coding: utf-8 -*-
"""
清理 public/media 里不再被引用的旧作品媒体：
  - preview/*.mp4、poster/*.jpg 里，凡 slug 不在当前 works 列表中的，删除
  - 但**保留 hero 用到的 poster**（Hero.jsx 引用了 poster/dance-dunhuang.jpg）
  - 保留 no-media.jpg、hero-bg-v3.mp4、portrait.jpg 等根目录资源
先打印待删清单与体积，加 --apply 才真正删除。
"""
import os
import re
import io
import sys
import json

MEDIA = r"D:\作品集网站\public\media"
SITE = r"D:\作品集网站\src\data\site.js"
SRC_DIR = r"D:\作品集网站\src"

APPLY = "--apply" in sys.argv

# 1) 当前 works 的 slug
site = io.open(SITE, encoding="utf-8").read()
m = re.search(r"export const works = \[(.*?)\n\]", site, re.S)
slugs = set(re.findall(r"slug:\s*'([^']+)'", m.group(1)))
print(f"当前 works slug 共 {len(slugs)} 个")

# 2) 扫描 src 下所有组件，收集被直接引用的媒体文件名（排除 works 的 slug 拼接）
referenced = set()
for root, _, files in os.walk(SRC_DIR):
    for fn in files:
        if not fn.endswith((".jsx", ".js")):
            continue
        txt = io.open(os.path.join(root, fn), encoding="utf-8").read()
        for lit in re.findall(r"mediaUrl\(\s*'([^']+)'\s*\)", txt):
            referenced.add(lit)
print(f"组件里直接引用的媒体: {sorted(referenced) if referenced else '（无）'}")

# 3) 逐目录清理
targets = []
for sub in ("preview", "poster"):
    d = os.path.join(MEDIA, sub)
    if not os.path.isdir(d):
        continue
    for fn in sorted(os.listdir(d)):
        name, ext = os.path.splitext(fn)
        full = os.path.join(d, fn)

        if sub == "preview":
            keep = name in slugs
        else:
            # poster：works 的 slug 或组件直接引用的路径（如 poster/dance-dunhuang.jpg）
            keep = name in slugs or f"poster/{fn}" in referenced

        if not keep:
            targets.append(full)

total_mb = sum(os.path.getsize(p) for p in targets) / 1048576
print(f"\n待清理 {len(targets)} 个文件，共 {total_mb:.2f} MB")
for p in targets:
    print(f"  - {os.path.relpath(p, MEDIA)}")

if APPLY:
    for p in targets:
        os.remove(p)
    print(f"\n已删除 {len(targets)} 个文件")
else:
    print("\n（预演模式，加 --apply 才真正删除）")
