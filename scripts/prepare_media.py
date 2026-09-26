# -*- coding: utf-8 -*-
"""
扫描 D:\\作品集\\videos，为每个视频生成：
  1) 轻量预览版 (public/media/preview/*.mp4)  —— 卡片 hover 用，无音轨
  2) 封面帧     (public/media/poster/*.jpg)   —— 卡片静止态
  3) 完整原片   (public/media/full/*.mp4)     —— 灯箱播放用，保留音轨
另生成 hero-reel.mp4：横屏素材混剪，用于首页全屏背景。
"""
import os
import re
import shutil
import subprocess
import sys

FFMPEG = r"C:\Users\pc\.workbuddy\binaries\python\envs\default\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
SRC_ROOT = r"D:\作品集\videos"
OUT = r"D:\作品集网站\public\media"

PREVIEW_DIR = os.path.join(OUT, "preview")
POSTER_DIR = os.path.join(OUT, "poster")
for d in (PREVIEW_DIR, POSTER_DIR):
    os.makedirs(d, exist_ok=True)

# 中文文件名 -> 稳定英文名 (slug, 中文标题, 分类, 竖屏?)
ITEMS = [
    ("VLOG/海南VLOG.mp4",           "vlog-hainan",    "海南 VLOG",              "VLOG",          True),
    ("剧情与舞蹈/9.23古装剧情.mp4",  "drama-guzhuang", "9.23 古装剧情",           "剧情与舞蹈",     False),
    ("剧情与舞蹈/敦煌舞.mp4",        "dance-dunhuang", "敦煌舞",                 "剧情与舞蹈",     False),
    ("剪辑与调色/821调色.mp4",       "color-821",      "821 调色",               "剪辑与调色",     False),
    ("剪辑与调色/剪辑1.mp4",         "edit-01",        "剪辑 01",                "剪辑与调色",     False),
    ("剪辑与调色/剪辑2.mp4",         "edit-02",        "剪辑 02",                "剪辑与调色",     False),
    ("剪辑与调色/剪辑3.mp4",         "edit-03",        "剪辑 03",                "剪辑与调色",     False),
    ("剪辑与调色/剪辑4.mp4",         "edit-04",        "剪辑 04",                "剪辑与调色",     False),
    ("宣传与时尚/广告宣传1.mp4",      "ad-01",          "广告宣传 01",            "宣传与时尚",     False),
    ("宣传与时尚/时尚宣传.mp4",       "fashion",        "时尚宣传",               "宣传与时尚",     True),
    ("数字人与智能制作/数字人口播.mp4", "ai-avatar",     "数字人口播",             "数字人与智能制作", True),
    ("数字人与智能制作/智能剪辑成片 (1).mp4", "ai-edit", "智能剪辑成片",          "数字人与智能制作", True),
    ("数字人与智能制作/智能营销成片.mp4", "ai-marketing", "智能营销成片",         "数字人与智能制作", True),
    ("数字人口播剪辑/9月19日.mp4",    "avatar-0919",    "9 月 19 日口播",         "数字人口播剪辑",  True),
    ("营销作品/营销成片2.mp4",        "marketing-02",   "营销成片 02",            "营销作品",       True),
]

PREVIEW_MAX_SEC = 40


def run(args, label):
    p = subprocess.run(args, capture_output=True, text=True, encoding="utf-8", errors="ignore")
    if p.returncode != 0:
        print(f"[FAIL] {label}\n{p.stderr[-600:]}")
        return False
    return True


def scale_filter(vertical):
    # 统一 fps 30 + 严格尺寸，保证 concat 兼容
    if vertical:
        return "scale=540:960:force_original_aspect_ratio=increase,crop=540:960,setsar=1,fps=30"
    return "scale=960:540:force_original_aspect_ratio=increase,crop=960:540,setsar=1,fps=30"


manifest = []
for rel, slug, title, cat, vertical in ITEMS:
    src = os.path.join(SRC_ROOT, rel.replace("/", os.sep))
    if not os.path.exists(src):
        print(f"[MISS] {src}")
        continue

    pv = os.path.join(PREVIEW_DIR, f"{slug}.mp4")
    ps = os.path.join(POSTER_DIR, f"{slug}.jpg")

    # 1) 线上版：最长 40 秒，保留音轨（卡片 hover 与灯箱共用，兼顾体积与可看性）
    if not os.path.exists(pv):
        ok = run([FFMPEG, "-y", "-ss", "0", "-i", src, "-t", str(PREVIEW_MAX_SEC),
                  "-vf", scale_filter(vertical),
                  "-c:v", "libx264", "-preset", "veryfast", "-crf", "31",
                  "-c:a", "aac", "-b:a", "96k", "-ac", "1",
                  "-movflags", "+faststart", pv], f"preview {slug}")
        print(f"  preview {slug}: {'ok' if ok else 'FAIL'}")

    # 2) 封面帧：避开黑场开头
    if not os.path.exists(ps):
        ok = run([FFMPEG, "-y", "-ss", "1.5", "-i", src, "-frames:v", "1",
                  "-vf", scale_filter(vertical) + ",eq=saturation=1.15",
                  "-q:v", "4", ps], f"poster {slug}")
        print(f"  poster  {slug}: {'ok' if ok else 'FAIL'}")

    # 注：完整原片不再拷进项目，避免部署时上传 400MB。原片始终保留在 D:\作品集\videos。

    if os.path.exists(pv):
        manifest.append({
            "slug": slug, "title": title, "cat": cat, "vertical": vertical,
            "preview": f"/media/preview/{slug}.mp4",
            "poster": f"/media/poster/{slug}.jpg",
            "size_mb": round(os.path.getsize(pv) / 1024 / 1024, 1),
        })

# ---- Hero reel：横屏素材混剪 ----
HERO_CLIPS = [
    ("剧情与舞蹈/9.23古装剧情.mp4", 3, 6),
    ("剪辑与调色/821调色.mp4", 1, 6),
    ("剪辑与调色/剪辑1.mp4", 0, 5),
    ("剪辑与调色/剪辑3.mp4", 0, 5),
    ("剪辑与调色/剪辑4.mp4", 0, 5),
]
hero_out = os.path.join(OUT, "hero-reel.mp4")
tmp_dir = os.path.join(OUT, "_tmp")
os.makedirs(tmp_dir, exist_ok=True)

if not os.path.exists(hero_out):
    parts = []
    for i, (rel, ss, dur) in enumerate(HERO_CLIPS):
        src = os.path.join(SRC_ROOT, rel.replace("/", os.sep))
        seg = os.path.join(tmp_dir, f"h{i}.mp4")
        if run([FFMPEG, "-y", "-ss", str(ss), "-t", str(dur), "-i", src,
                "-vf", "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,setsar=1,fps=30",
                "-an", "-c:v", "libx264", "-preset", "veryfast", "-crf", "28", seg], f"hero seg {i}"):
            parts.append(seg)
        else:
            print(f"  hero seg {i} failed")

    if len(parts) >= 2:
        lst = os.path.join(tmp_dir, "list.txt")
        with open(lst, "w", encoding="utf-8") as f:
            for p in parts:
                f.write(f"file '{p}'\n")
        if run([FFMPEG, "-y", "-f", "concat", "-safe", "0", "-i", lst,
                "-c:v", "libx264", "-preset", "veryfast", "-crf", "26",
                "-movflags", "+faststart", hero_out], "hero concat"):
            print(f"  hero-reel: ok ({round(os.path.getsize(hero_out)/1024/1024,1)} MB)")
    shutil.rmtree(tmp_dir, ignore_errors=True)

# ---- 输出 manifest ----
import json
with open(os.path.join(OUT, "manifest.json"), "w", encoding="utf-8") as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)
print(f"\nDONE. {len(manifest)} clips.")
