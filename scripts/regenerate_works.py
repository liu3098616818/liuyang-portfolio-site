# -*- coding: utf-8 -*-
"""
把 site.js 里的 works 数组 + categories 数组整体替换成
「D:\作品集\videos 里用户整理好的 23 个作品 / 5 个分类」。

只动 `// 精选作品` 到 `export const navItems` 之间的区块，其余内容原样保留。
"""
import re
import io
import json

SITE = r"D:\作品集网站\src\data\site.js"
MANIFEST = r"D:\作品集网站\public\media\manifest.json"

# 分类顺序直接沿用用户文件夹的编号顺序
CAT_ORDER = [
    "口播剪辑",
    "剪辑与调色",
    "信息流",
    "AIGC 与数字人",
    "品牌与城市宣传",
]

# 条目顺序与 prepare_works.py 的 ITEMS 一致（= 用户文件夹里的排列）。
# 必须显式固定：manifest.json 在「--only 补转」后顺序会被打乱
# （曾导致调色 03/04 对调），这里按该表重排，保证编号稳定。
SLUG_ORDER = [
    "talk-01", "talk-02", "talk-03",
    "edit-01", "edit-02", "color-01", "color-02", "color-03", "color-04",
    "feed-01", "feed-02",
    # AIGC 与数字人：用户 2026-10-11 指定的排列
    # 京剧 / 古装剧情 / 敦煌舞 / 人物法相天地 / 追踪飞行 / 海南VLOG / 数字人口播 / AIGC成片
    "opera", "drama-guzhuang", "dunhuang", "figure-faxiang",
    "tracking", "vlog-hainan", "avatar-talk", "aigc-demo",
    "ad-brand", "fashion", "ad-luckin", "ad-xiongan",
]

with open(MANIFEST, encoding="utf-8") as f:
    mf = json.load(f)

# 按分类顺序 + 原列表顺序排列
by_cat = {}
for m in mf:
    by_cat.setdefault(m["cat"], []).append(m)

# 先按分类聚拢，再按 SLUG_ORDER 排定最终顺序（分类顺序与条目顺序都稳）
grouped = []
for c in CAT_ORDER:
    grouped.extend(by_cat.get(c, []))
for c, items in by_cat.items():
    if c not in CAT_ORDER:
        grouped.extend(items)

rank = {s: i for i, s in enumerate(SLUG_ORDER)}
ordered = sorted(grouped, key=lambda m: rank.get(m["slug"], 999))

missing = [m["slug"] for m in ordered if m["slug"] not in rank]
if missing:
    print("⚠ 未在 SLUG_ORDER 中，按原序排在末尾：", ", ".join(missing))

lines = []
for i, m in enumerate(ordered, 1):
    slug = m["slug"]
    no = f"{i:02d}"
    # site.js 里媒体路径统一用 mediaUrl()，保证 Pages 子路径下不 404
    lines.append("  {")
    lines.append(f"    slug: '{slug}',")
    lines.append(f"    no: '{no}',")
    lines.append(f"    title: '{m['title']}',")
    lines.append(f"    titleEn: '{m['titleEn']}',")
    lines.append(f"    cat: '{m['cat']}',")
    lines.append(f"    vertical: {'true' if m['vertical'] else 'false'},")
    lines.append(f"    year: '2026',")
    lines.append(f"    note: '{m['note']}',")
    # 注意：Works.jsx 只用 `preview/${slug}.mp4` 和 `poster/${slug}.jpg`，
    # 不读 w.src / w.poster —— 所以这里靠 slug 与文件名一致即可，不必写 src/poster
    lines.append("  },")

works_block = "\n".join([
    "// 精选作品 —— 2026-10-11 按 D:\\作品集\\videos 里用户整理好的 5 类共 23 个片子整体重建",
    "// 每个条目都在源码里配好 preview + poster，所以**不能带 custom 标记**：",
    "// 带 custom 会让 Works.jsx / Lightbox.jsx 强制回落到 no-media.jpg 灰占位图",
    "export const works = [",
    *lines,
    "]",
    "",
])

cats = ["  'ALL',"] + [f"  '{c}'," for c in CAT_ORDER]
cats_block = "export const categories = [\n" + "\n".join(cats) + "\n]"

new_block = works_block + "\n" + cats_block + "\n\n"

src = io.open(SITE, encoding="utf-8").read()

# 定位要替换的区块：从「// 精选作品」注释到 navItems 之前
start = src.index("// 精选作品")
end = src.index("export const navItems")
old = src[start:end]

src2 = src[:start] + new_block + src[end:]

io.open(SITE, "w", encoding="utf-8", newline="\n").write(src2)

print(f"替换完成：删掉 {len(old.splitlines())} 行，写入 {len(new_block.splitlines())} 行")
print(f"作品 {len(ordered)} 条，分类 {len(CAT_ORDER)} 个")
for c in CAT_ORDER:
    print(f"  {c}: {len(by_cat.get(c, []))} 条")
