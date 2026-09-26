# -*- coding: utf-8 -*-
"""
把 01 关于我 照片位的图片裁到 9:12（站点 portraitt 容器的比例）。
源图 1080x1920（9:16）比容器长，竖向要多出 25%，必须裁。

我看不到图的内容，无法判断人物站位，所以同时产出三种构图供挑选：
  top0   顶部完全保留   —— 帽子/头顶绝对不会被切，代价是底部多切
  top120 略微下沉       —— 通用折中
  top240 居中裁切       —— 上下各切一半，适合人物正好居中

默认采用 top0（最安全，绝对不伤头部）。
"""
import os
from PIL import Image

SRC = r"C:\Users\pc\.workbuddy\clipboard-images\clipboard-2026-09-24T11-45-00-512Z-0b0f56db.jpg"
OUT_MAIN = r"D:\作品集网站\public\media\portrait.jpg"
OUT_ALT_DIR = r"D:\作品集网站\scripts\裁切备选"

OUT_W, OUT_H = 900, 1200          # 9:12
JPEG_Q = 82                       # 原版 portrait.jpg 只有 63KB，别让网页首屏变重

img = Image.open(SRC).convert("RGB")
W, H = img.size
print(f"源图 {W}x{H}  比例 {W/H:.4f}  (目标 {OUT_W/OUT_H:.4f})")

# 目标比例下应有的高度
need_h = W * OUT_H / OUT_W        # 1080 * 1200/900 = 1440
print(f"按宽度换算，应保留高度 {need_h:.0f}，需裁掉 {H - need_h:.0f}px（{(H-need_h)/H*100:.1f}%）")

if H < need_h:
    print("图太扁，需要横向裁切（当前脚本未处理这种情况）")

variants = {"top0": 0, "top120": 120, "top240": 240}
os.makedirs(OUT_ALT_DIR, exist_ok=True)

for name, shift in variants.items():
    top = shift
    bottom = top + need_h
    if bottom > H:
        bottom = H
        top = H - need_h
    crop = img.crop((0, int(top), W, int(bottom)))
    # 缩放时保证仍严格是 9:12
    crop = crop.resize((OUT_W, OUT_H), Image.LANCZOS)
    path = os.path.join(OUT_ALT_DIR, f"portrait_{name}.jpg")
    crop.save(path, "JPEG", quality=JPEG_Q, optimize=True, progressive=True)
    sz = os.path.getsize(path)
    print(f"  {name:8s} 裁切区间 y={int(top)}..{int(bottom)}  输出 {OUT_W}x{OUT_H}  {sz/1024:.0f}KB")

# 默认取最安全的顶部对齐
Image.open(os.path.join(OUT_ALT_DIR, "portrait_top0.jpg")).save(
    OUT_MAIN, "JPEG", quality=JPEG_Q, optimize=True, progressive=True
)
print(f"\n已写入主版本：{OUT_MAIN}  {os.path.getsize(OUT_MAIN)/1024:.0f}KB")
print(f"备选都在：{OUT_ALT_DIR}")
