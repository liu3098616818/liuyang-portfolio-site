# -*- coding: utf-8 -*-
"""
把 D:\作品集\videos 下用户整理好的 5 类作品，按网站现有形式批量转码：

  public/media/preview/<slug>.mp4  —— 卡片 hover 预览（最长 40s，保留音轨）
  public/media/poster/<slug>.jpg   —— 卡片静止封面（1.5s 取帧，避开黑场）

注意：灯箱点开播放的**不是**这份预览，而是 scripts/make_full.py 生成的
  public/media/full/<slug>.mp4     —— 完整不截断、长边 1080、crf 25
所以这里只是「悬停小预览」，规格刻意压小：
  横屏 960x540 / 竖屏 540x960、fps 30、libx264 crf 26、aac 96k 单声道、+faststart
（多数源片是 HEVC，网页播不了，必须转 h264）

已存在的文件默认跳过，加 --force 重转。
"""
import os
import re
import json
import subprocess
import sys

FFMPEG = r"C:\Users\pc\.workbuddy\binaries\python\envs\default\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
SRC_ROOT = r"D:\作品集\videos"
OUT = r"D:\作品集网站\public\media"

PREVIEW_DIR = os.path.join(OUT, "preview")
POSTER_DIR = os.path.join(OUT, "poster")
os.makedirs(PREVIEW_DIR, exist_ok=True)
os.makedirs(POSTER_DIR, exist_ok=True)

# (源相对路径, slug, 中文标题, 英文标题, 分类, 竖屏?, 说明)
ITEMS = [
    # 01 口播剪辑 —— 全竖屏
    ("01-口播剪辑/口播剪辑1.mp4", "talk-01", "口播剪辑 01", "TALKING EDIT 01", "口播剪辑", True, "口播剪辑 · 字幕包装"),
    ("01-口播剪辑/口播剪辑2.mp4", "talk-02", "口播剪辑 02", "TALKING EDIT 02", "口播剪辑", True, "口播剪辑 · 节奏卡点"),
    ("01-口播剪辑/口播剪辑3.mp4", "talk-03", "口播剪辑 03", "TALKING EDIT 03", "口播剪辑", True, "口播剪辑 · 信息密度优化"),

    # 02 剪辑与调色 —— 全横屏
    ("02-剪辑与调色/剪辑1.mp4", "edit-01", "剪辑 01", "EDIT REEL 01", "剪辑与调色", False, "商业剪辑 · 卡点节奏"),
    ("02-剪辑与调色/剪辑2.mp4", "edit-02", "剪辑 02", "EDIT REEL 02", "剪辑与调色", False, "剪辑 + 转场设计"),
    ("02-剪辑与调色/调色1.mp4", "color-01", "调色 01", "COLOR GRADING 01", "剪辑与调色", False, "达芬奇调色 · 影调统一"),
    ("02-剪辑与调色/调色2.mp4", "color-02", "调色 02", "COLOR GRADING 02", "剪辑与调色", False, "氛围调色 · 色彩叙事"),
    ("02-剪辑与调色/调色3.mp4", "color-03", "调色 03", "COLOR GRADING 03", "剪辑与调色", False, "快节奏调色样片"),
    ("02-剪辑与调色/调色4.mp4", "color-04", "调色 04", "COLOR GRADING 04", "剪辑与调色", False, "人物肤色与场景分离"),

    # 03 信息流 —— 全竖屏
    ("03-信息流/信息流1.mp4", "feed-01", "信息流 01", "INFO FEED 01", "信息流", True, "信息流投放版 · 前 3 秒钩子"),
    ("03-信息流/信息流2.mp4", "feed-02", "信息流 02", "INFO FEED 02", "信息流", True, "信息流投放版 · 转化向"),

    # 04 AIGC 与数字人
    ("04-AIGC与数字人/AIGC.mp4",            "aigc-demo",    "AIGC 成片",      "AIGC REEL",        "AIGC 与数字人", True,  "AI 生成素材整合"),
    ("04-AIGC与数字人/京剧.mp4",             "opera",        "京剧",          "PEKING OPERA",     "AIGC 与数字人", False, "AI 融合传统戏曲影像"),
    ("04-AIGC与数字人/人物法相天地.mp4",      "figure-faxiang", "人物法相天地",   "COSMIC FIGURE",    "AIGC 与数字人", False, "AI 视觉概念片"),
    ("04-AIGC与数字人/古装剧请.mp4",          "drama-guzhuang", "古装剧情",      "PERIOD DRAMA",     "AIGC 与数字人", False, "古装剧情 · 编导 + 剪辑"),
    ("04-AIGC与数字人/敦煌舞.mp4",            "dunhuang",     "敦煌舞",         "DUNHUANG DANCE",   "AIGC 与数字人", False, "舞蹈影像 · 氛围调色"),
    ("04-AIGC与数字人/数字人口播.mp4",         "avatar-talk",  "数字人口播",      "AI AVATAR TALK",   "AIGC 与数字人", True,  "数字人口播 · AI 制作流程"),
    ("04-AIGC与数字人/海南VLOG.mp4",          "vlog-hainan",  "海南 VLOG",      "HAINAN VLOG",      "AIGC 与数字人", True,  "旅拍 Vlog · 拍摄 + 剪辑 + 调色"),
    ("04-AIGC与数字人/追踪飞行.mp4",           "tracking",     "追踪飞行",       "TRACKING SHOT",    "AIGC 与数字人", False, "运镜与追踪合成"),

    # 05 品牌与城市宣传
    ("05-品牌与城市宣传/广告宣传.mp4",        "ad-brand",     "广告宣传",       "BRAND AD",         "品牌与城市宣传", False, "品牌广告宣传片"),
    ("05-品牌与城市宣传/时尚宣传.mp4",         "fashion",      "时尚宣传",       "FASHION FILM",     "品牌与城市宣传", True,  "时尚向宣传 · 竖屏投放版"),
    ("05-品牌与城市宣传/瑞幸咖啡宣传.mp4",      "ad-luckin",    "瑞幸咖啡宣传",    "LUCKIN COFFEE",    "品牌与城市宣传", False, "品牌联名宣传片"),
    ("05-品牌与城市宣传/雄安新区宣传.mp4",      "ad-xiongan",   "雄安新区宣传",    "XIONGAN NEW AREA", "品牌与城市宣传", False, "城市形象宣传片"),
]

PREVIEW_MAX_SEC = 40
FORCE = "--force" in sys.argv

# 支持 `python prepare_works.py --only edit-01 fashion ...`：
# 只处理这几个且强制重转。用于修正「新 slug 与旧文件重名、被跳过而误用旧源片」的情况。
ONLY = None
if "--only" in sys.argv:
    idx = sys.argv.index("--only")
    ONLY = set(sys.argv[idx + 1:])
    FORCE = True


def scale_filter(vertical):
    if vertical:
        return "scale=540:960:force_original_aspect_ratio=increase,crop=540:960,setsar=1,fps=30"
    return "scale=960:540:force_original_aspect_ratio=increase,crop=960:540,setsar=1,fps=30"


# 封面取帧位置：默认 1.5s（避开黑场开头），但超短视频要退到 0s，
# 否则 -ss 超出片长会取不到帧（调色3 只有 1.2s，就踩了这个坑）
_PROBE_JSON = os.path.join(os.path.dirname(os.path.abspath(__file__)), "videos_probe.json")
_DUR_MAP = {}
if os.path.exists(_PROBE_JSON):
    try:
        with open(_PROBE_JSON, encoding="utf-8") as f:
            for it in json.load(f):
                _DUR_MAP[os.path.basename(it["file"])] = it.get("dur", 0)
    except Exception:
        pass


def poster_seek(src):
    dur = _DUR_MAP.get(os.path.basename(src), 0)
    return "0" if 0 < dur < 2.5 else "1.5"


def run(args, label):
    p = subprocess.run(args, capture_output=True, text=True, encoding="utf-8", errors="ignore")
    if p.returncode != 0:
        print(f"[FAIL] {label}\n{(p.stderr or '')[-500:]}")
        return False
    return True


manifest = []
failed = []

# --only 时只留下指定的条目
TARGETS = [it for it in ITEMS if not ONLY or it[1] in ONLY]
total = len(TARGETS)

for i, (rel, slug, title, title_en, cat, vertical, note) in enumerate(TARGETS, 1):
    src = os.path.join(SRC_ROOT, rel.replace("/", os.sep))
    if not os.path.exists(src):
        print(f"[{i}/{total}] [MISS] {src}")
        failed.append(slug)
        continue

    pv = os.path.join(PREVIEW_DIR, f"{slug}.mp4")
    ps = os.path.join(POSTER_DIR, f"{slug}.jpg")

    if FORCE or not os.path.exists(pv):
        ok = run([FFMPEG, "-y", "-ss", "0", "-i", src, "-t", str(PREVIEW_MAX_SEC),
                  "-vf", scale_filter(vertical),
                  "-c:v", "libx264", "-preset", "medium", "-crf", "26",
                  "-c:a", "aac", "-b:a", "96k", "-ac", "1",
                  "-movflags", "+faststart", pv], f"preview {slug}")
    else:
        ok = True

    if FORCE or not os.path.exists(ps):
        ok2 = run([FFMPEG, "-y", "-ss", poster_seek(src), "-i", src, "-frames:v", "1",
                   "-vf", scale_filter(vertical) + ",eq=saturation=1.15",
                   "-q:v", "4", ps], f"poster {slug}")
    else:
        ok2 = True

    if os.path.exists(pv) and os.path.exists(ps):
        size_mb = round(os.path.getsize(pv) / 1024 / 1024, 2)
        manifest.append({
            "slug": slug, "title": title, "titleEn": title_en,
            "cat": cat, "vertical": vertical, "note": note,
            "preview": f"preview/{slug}.mp4",
            "poster": f"poster/{slug}.jpg",
            "size_mb": size_mb,
        })
        print(f"[{i}/{total}] OK  {slug:<16} {title:<12} {size_mb:>6.2f}MB")
    else:
        failed.append(slug)
        print(f"[{i}/{total}] NG  {slug}")

# --only 时只重转了部分条目，manifest 要与已有内容合并，不能整体覆盖
mf_path = os.path.join(OUT, "manifest.json")
if ONLY and os.path.exists(mf_path):
    with open(mf_path, encoding="utf-8") as f:
        merged = json.load(f)
    by_slug = {m["slug"]: m for m in merged}
    by_slug.update({m["slug"]: m for m in manifest})
    manifest = list(by_slug.values())

with open(mf_path, "w", encoding="utf-8") as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)

print(f"\nDONE. 成功 {len(manifest)}/{total}，失败 {len(failed)}")
if failed:
    print("失败：", ", ".join(failed))
