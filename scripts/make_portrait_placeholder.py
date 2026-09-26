# -*- coding: utf-8 -*-
"""生成「关于我」左侧个人照片位的占位图 public/media/portrait.jpg
用户把自己的竖版照片重命名为 portrait.jpg 覆盖同名文件即可替换，无需改代码。
"""
import os
from PIL import Image, ImageDraw, ImageFont

OUT = r"D:\作品集网站\public\media\portrait.jpg"
W, H = 900, 1200  # 3:4 竖版

BG = (7, 6, 10)
PINK = (255, 30, 142)
WHITE = (246, 244, 241)
DIM = (110, 105, 118)

img = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(img)

# 玫粉虚线内框
m = 34
for i in range(m, W - m, 18):
    d.line([(i, m), (i + 9, m)], fill=PINK, width=2)
    d.line([(i, H - m), (i + 9, H - m)], fill=PINK, width=2)
for i in range(m, H - m, 18):
    d.line([(m, i), (m, i + 9)], fill=PINK, width=2)
    d.line([(W - m, i), (W - m, i + 9)], fill=PINK, width=2)

# 左上角编号标记
d.rectangle([m + 26, m + 26, m + 26 + 74, m + 26 + 46], fill=PINK)
f_tag = ImageFont.truetype("C:/Windows/Fonts/msyh.ttc", 30)
d.text((m + 40, m + 33), "01", font=f_tag, fill=(255, 255, 255))

# 主体文案
f_cn = ImageFont.truetype("C:/Windows/Fonts/msyh.ttc", 62)
f_en = ImageFont.truetype("C:/Windows/Fonts/msyh.ttc", 30)
f_sm = ImageFont.truetype("C:/Windows/Fonts/msyh.ttc", 22)


def center(text, font, y, fill):
    w = d.textbbox((0, 0), text, font=font)[2]
    d.text(((W - w) / 2, y), text, font=font, fill=fill)


center("个人照片", f_cn, H // 2 - 92, WHITE)
center("P O R T R A I T", f_en, H // 2 + 4, PINK)
center("把你的竖版照片命名为 portrait.jpg", f_sm, H // 2 + 96, DIM)
center("覆盖 public\\media\\portrait.jpg 即可", f_sm, H // 2 + 132, DIM)
center("建议 3:4 竖版 · 900 × 1200 以上", f_sm, H // 2 + 168, DIM)

os.makedirs(os.path.dirname(OUT), exist_ok=True)
img.save(OUT, "JPEG", quality=92)
print("saved:", OUT, img.size, round(os.path.getsize(OUT) / 1024, 1), "KB")
