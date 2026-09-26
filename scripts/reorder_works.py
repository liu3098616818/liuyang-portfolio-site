# -*- coding: utf-8 -*-
"""按用户指定顺序重排 works 数组，并把 NO.xx 按新位置重新编号 01-15。"""
import io, re, sys

P = r"D:\作品集网站\src\data\site.js"

# 用户指定顺序：先 8 个 16:9 横屏，再 7 个 9:16 竖屏
ORDER = [
    "drama-guzhuang",  # 古装剧情
    "dance-dunhuang",  # 敦煌舞
    "ad-01",           # 广告宣传 01
    "color-821",       # 821 调色
    "edit-03",         # 剪辑 03
    "edit-01",         # 剪辑 01（原列表中第二个「剪辑 03」按遗漏项推断为剪辑 01）
    "edit-02",         # 剪辑 02
    "edit-04",         # 剪辑 04
    "fashion",         # 时尚宣传
    "vlog-hainan",     # 海南 VLOG
    "ai-marketing",    # 智能营销成片
    "marketing-02",    # 营销成片 02
    "avatar-0919",     # 9 月 19 日口播
    "ai-edit",         # 智能剪辑成片
    "ai-avatar",       # 数字人口播
]

src = io.open(P, encoding="utf-8").read()
start = src.index("export const works = [")
end = src.index("export const categories")
block = src[start:end]

# 解析出每个 slug 对应的原始条目文本
entries = {}
for m in re.finditer(r"\{\s*slug: '([^']+)'.*?\n  \}", block, re.S):
    entries[m.group(1)] = m.group(0)

missing = [s for s in ORDER if s not in entries]
extra = [s for s in entries if s not in ORDER]
if missing or extra:
    print("MISSING:", missing, "EXTRA:", extra)
    sys.exit(1)

out = ["export const works = ["]
for i, slug in enumerate(ORDER, 1):
    body = entries[slug]
    body = re.sub(r"no: '\d+'", f"no: '{i:02d}'", body, count=1)
    out.append(body)
out.append("]")
new_block = "\n".join(out) + "\n\n"

io.open(P, "w", encoding="utf-8").write(src[:start] + new_block + src[end:])
print("reordered:", len(ORDER))
for i, s in enumerate(ORDER, 1):
    print(f"  {i:02d} {s}")
