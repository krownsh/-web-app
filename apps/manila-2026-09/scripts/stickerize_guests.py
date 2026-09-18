"""Cut out near-white studio backdrop and add a white sticker stroke."""
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1] / "public" / "guests"
FILES = ["a.png", "b.png", "c.png", "d.png"]
WHITE = 238
STROKE = 22


def flood_background(rgb: np.ndarray) -> np.ndarray:
    h, w, _ = rgb.shape
    bg = np.zeros((h, w), dtype=bool)
    q = deque()

    def is_backdrop(y, x):
        r, g, b = rgb[y, x]
        return int(r) >= WHITE and int(g) >= WHITE and int(b) >= WHITE

    for x in range(w):
        for y in (0, h - 1):
            if is_backdrop(y, x):
                q.append((y, x))
                bg[y, x] = True
    for y in range(h):
        for x in (0, w - 1):
            if is_backdrop(y, x) and not bg[y, x]:
                q.append((y, x))
                bg[y, x] = True

    while q:
        y, x = q.popleft()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < h and 0 <= nx < w and not bg[ny, nx] and is_backdrop(ny, nx):
                bg[ny, nx] = True
                q.append((ny, nx))
    return bg


def outline(src: Image.Image) -> Image.Image:
    rgba = src.convert("RGBA")
    arr = np.array(rgba)
    bg = flood_background(arr[:, :, :3])
    alpha = np.where(bg, 0, 255).astype(np.uint8)
    cut = Image.fromarray(np.dstack([arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], alpha]))
    mask = cut.split()[-1].filter(ImageFilter.MaxFilter(STROKE * 2 + 1))
    stroke = Image.new("RGBA", cut.size, (255, 255, 255, 0))
    stroke.putalpha(mask)
    out = Image.alpha_composite(stroke, cut)
    return out


def main():
    for name in FILES:
        path = ROOT / name
        out = outline(Image.open(path))
        out.save(path, "PNG")
        print(name, out.size)


if __name__ == "__main__":
    main()
