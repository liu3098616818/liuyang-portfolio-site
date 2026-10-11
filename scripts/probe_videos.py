# -*- coding: utf-8 -*-
"""
探测 D:\作品集\videos 下所有视频的规格：分辨率 / 时长 / 编码 / 朝向。
只读取文件头（`-i` 不做解码），所以整目录扫一遍很快。
输出 JSON 供后续转码与作品条目生成使用。
"""
import os
import re
import json
import subprocess
import imageio_ffmpeg

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
SRC = r"D:\作品集\videos"

# 实际行形如：
#   Stream #0:0[0x1](und): Video: hevc (Main) (hvc1 / 0x31637668), yuv420p(...), 1922x1080 [...]
# 流编号后面可能跟 [0x1]、(und) 等，宽松匹配
RE_VIDEO = re.compile(
    r"Stream #\d+:\d+\S*:\s*Video:\s*(\S+).*?,\s*(\d{2,5})x(\d{2,5})"
)
RE_DUR = re.compile(r"Duration: (\d{2}):(\d{2}):(\d{2})\.(\d{2})")
RE_ROT = re.compile(r"rotate\s*:\s*(\d+)")


def probe(path):
    # -i 会返回非 0（没有输出文件），信息全在 stderr
    r = subprocess.run(
        [FFMPEG, "-i", path],
        capture_output=True,
        encoding="utf-8",
        errors="replace",
    )
    txt = r.stderr or ""

    m = RE_VIDEO.search(txt)
    codec, w, h = (m.group(1), int(m.group(2)), int(m.group(3))) if m else ("?", 0, 0)

    d = RE_DUR.search(txt)
    dur = 0.0
    if d:
        hh, mm, ss, cs = (int(x) for x in d.groups())
        dur = hh * 3600 + mm * 60 + ss + cs / 100.0

    rot = RE_ROT.search(txt)
    rotation = int(rot.group(1)) if rot else 0

    return {
        "codec": codec,
        "w": w,
        "h": h,
        "dur": round(dur, 2),
        "rotation": rotation,
        "size": os.path.getsize(path),
    }


def main():
    out = []
    for cat in sorted(os.listdir(SRC)):
        catdir = os.path.join(SRC, cat)
        if not os.path.isdir(catdir):
            continue
        for fn in sorted(os.listdir(catdir)):
            if not fn.lower().endswith((".mp4", ".mov", ".mkv", ".webm", ".avi")):
                continue
            p = os.path.join(catdir, fn)
            info = probe(p)
            # 竖屏判定：考虑 rotate 元数据
            w, h, rot = info["w"], info["h"], info["rotation"]
            if rot in (90, 270):
                w, h = h, w
            info["vertical"] = h > w
            info["ratio"] = round(max(w, h) / min(w, h), 3) if min(w, h) else 0
            info["cat"] = cat
            info["file"] = fn
            out.append(info)
            print(
                f'{cat:<18} {fn:<20} {info["w"]}x{info["h"]:<6} '
                f'{info["dur"]:>6.1f}s  {"竖" if info["vertical"] else "横"}  '
                f'{str(info["codec"]):<10} {info["size"]/1048576:>7.1f}MB'
            )
    with open(r"D:\作品集网站\scripts\videos_probe.json", "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print(f"\n共 {len(out)} 个视频 → scripts/videos_probe.json")


if __name__ == "__main__":
    main()
