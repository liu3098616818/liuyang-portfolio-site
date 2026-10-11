# -*- coding: utf-8 -*-
"""
生成「完整版」作品视频：public/media/full/<slug>.mp4

背景：之前灯箱播的是 preview/<slug>.mp4 —— 那是给卡片 hover 用的轻量预览，
最长 40s、540x960、crf 31，所以用户看到「只能播 40 秒、而且糊」。
现在拆成两层：
  preview/<slug>.mp4  —— 卡片 hover 预览（小、短、轻）
  full/<slug>.mp4     —— 灯箱点开播放（完整不截断、清晰）

规格：
  - 按源片比例缩放，**短边上限 1080**（横屏 1920x1080 / 竖屏 1080x1920），
    源片不足这个尺寸就原样保留，**绝不放大、绝不裁画面**
  - fps 30、libx264 High、crf 25、preset slow、yuv420p
  - 音轨 aac 128k（源片若无音轨则自动没有）
  - +faststart（边下边播）

用法：
  python scripts/make_full.py                 # 全部（已存在则跳过）
  python scripts/make_full.py --only opera talk-01
  python scripts/make_full.py --force
  python scripts/make_full.py --cap 720 --crf 23   # 想再小一点时用（cap 指的是短边）
"""
import os
import re
import sys
import json
import subprocess

FFMPEG = r"C:\Users\pc\.workbuddy\binaries\python\envs\default\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
SRC_ROOT = r"D:\作品集\videos"
OUT = r"D:\作品集网站\public\media"
PROBE = r"D:\作品集网站\scripts\videos_probe.json"

FULL_DIR = os.path.join(OUT, "full")
os.makedirs(FULL_DIR, exist_ok=True)

# 从 prepare_works.py 复用同一份素材映射，避免两处维护 slug
_src = open(os.path.join(os.path.dirname(__file__), "prepare_works.py"), encoding="utf-8").read()
_block = _src.split("ITEMS = [")[1].split("\n]")[0]
ITEMS = []
for line in _block.split("\n"):
    m = re.search(r'"([^"]+\.mp4)",\s*"([^"]+)"', line)
    if m:
        ITEMS.append((m.group(1), m.group(2)))

CAP = 1080
CRF = 25
PRESET = "slow"
for a in ("--cap", "--crf"):
    if a in sys.argv:
        v = sys.argv[sys.argv.index(a) + 1]
        if a == "--cap":
            CAP = int(v)
        else:
            CRF = int(v)
FORCE = "--force" in sys.argv
ONLY = None
if "--only" in sys.argv:
    ONLY = set(sys.argv[sys.argv.index("--only") + 1:])
    FORCE = True

probe = {(p["cat"], p["file"]): p for p in json.load(open(PROBE, encoding="utf-8"))}


def target_wh(p, cap):
    """
    按源片比例缩放，**短边**不超过 cap，绝不放大（源片小于 cap 就原样保留）。
      横屏 1920x1080 → 1920x1080   竖屏 1080x1920 → 1080x1920
      横屏 1280x720  → 1280x720（不放大）
    注意别写成「长边 cap」：那样 1920x1080 会被压成 1080x608，等于没提清晰度。
    结果取偶数（yuv420p 要求），不裁画面。
    """
    w, h = p["w"], p["h"]
    f = min(1.0, cap / min(w, h))
    tw = int(round(w * f / 2)) * 2
    th = int(round(h * f / 2)) * 2
    return max(tw, 2), max(th, 2)


total_in = 0
total_out = 0
done = []
for src, slug in ITEMS:
    if ONLY and slug not in ONLY:
        continue
    out = os.path.join(FULL_DIR, f"{slug}.mp4")
    if os.path.exists(out) and not FORCE:
        total_out += os.path.getsize(out)
        done.append((slug, os.path.getsize(out) / 1048576, "skip"))
        continue
    cat, fn = src.split("/")
    p = probe[(cat, fn)]
    tw, th = target_wh(p, CAP)
    src_path = os.path.join(SRC_ROOT, src)
    total_in += os.path.getsize(src_path)
    cmd = [
        FFMPEG, "-hide_banner", "-loglevel", "error", "-y",
        "-i", src_path,
        "-vf", f"scale={tw}:{th},setsar=1,fps=30",
        "-c:v", "libx264", "-preset", PRESET, "-crf", str(CRF),
        "-profile:v", "high", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "128k",
        "-movflags", "+faststart",
        out,
    ]
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if r.returncode != 0 or not os.path.exists(out):
        print(f"✗ {slug} 失败: {r.stderr[-300:]}")
        continue
    mb = os.path.getsize(out) / 1048576
    total_out += os.path.getsize(out)
    done.append((slug, mb, f"{tw}x{th} {p['dur']:.0f}s"))
    print(f"✓ {slug:16} {tw}x{th}  {p['dur']:6.1f}s → {mb:6.1f} MB")

print("-" * 60)
print(f"完成 {len(done)} 个，完整版共 {total_out/1048576:.0f} MB")
big = sorted(done, key=lambda x: -x[1])[:5]
print("最大的 5 个：", ", ".join(f"{s} {m:.0f}MB" for s, m, _ in big))
