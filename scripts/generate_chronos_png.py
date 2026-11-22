"""
Generates high-resolution Chronos branding icons & logos for the desktop application.
"""
from PIL import Image, ImageDraw
import math

def render_chronos_emblem(size=512):
    # Render at 4x supersampling for ultra-crisp antialiasing
    scale = 4
    dim = size * scale
    cx, cy = dim / 2, dim / 2
    r_outer = dim * 0.45
    r_inner = dim * 0.42

    img = Image.new("RGBA", (dim, dim), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 1. Ambient Background Core Glow
    for step in range(60, 0, -2):
        rad = (step / 60.0) * (dim * 0.4)
        alpha = int((1.0 - step / 60.0) * 85)
        color = (192, 132, 252, alpha) # #c084fc
        draw.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], fill=color)

    # 2. Outer Astrolabe Chronometer Ring
    draw.ellipse([cx - r_outer, cy - r_outer, cx + r_outer, cy + r_outer], outline=(168, 85, 247, 180), width=int(3 * scale))
    draw.ellipse([cx - r_inner, cy - r_inner, cx + r_inner, cy + r_inner], outline=(56, 189, 248, 220), width=int(2 * scale))

    # 3. 12 Cardinal Astrolabe Hour Ticks
    for i in range(12):
        angle = (i * 30) * math.pi / 180.0
        cos_a, sin_a = math.cos(angle), math.sin(angle)
        tick_len = dim * 0.05 if i % 3 == 0 else dim * 0.03
        w = int(4 * scale) if i % 3 == 0 else int(2 * scale)
        x1 = cx + (r_outer - tick_len) * cos_a
        y1 = cy + (r_outer - tick_len) * sin_a
        x2 = cx + r_outer * cos_a
        y2 = cy + r_outer * sin_a
        color = (233, 213, 255, 240) if i % 3 == 0 else (168, 85, 247, 180)
        draw.line([(x1, y1), (x2, y2)], fill=color, width=w)

    # 4. The Infinity Knot / Lemniscate Loops (Left = Cyan, Right = Purple)
    # Parametric lemniscate of Gerono / Bernoulli: x = a*cos(t), y = a*sin(t)*cos(t)
    points_right = []
    points_left = []
    loop_scale = dim * 0.30

    for deg in range(0, 360, 2):
        rad = deg * math.pi / 180.0
        x = cx + loop_scale * math.cos(rad) / (1 + math.sin(rad)**2)
        y = cy + loop_scale * math.sin(rad) * math.cos(rad) / (1 + math.sin(rad)**2) * 1.5
        if deg <= 180:
            points_right.append((x, y))
        else:
            points_left.append((x, y))

    # Draw right purple loop
    for i in range(len(points_right) - 1):
        draw.line([points_right[i], points_right[i+1]], fill=(192, 132, 252, 255), width=int(14 * scale))
    # Draw left cyan loop
    for i in range(len(points_left) - 1):
        draw.line([points_left[i], points_left[i+1]], fill=(56, 189, 248, 255), width=int(14 * scale))

    # 5. Hourglass Facets
    hg_w = dim * 0.16
    hg_h = dim * 0.22
    hg_pts = [
        (cx - hg_w, cy - hg_h),
        (cx + hg_w, cy - hg_h),
        (cx + hg_w * 0.2, cy),
        (cx + hg_w, cy + hg_h),
        (cx - hg_w, cy + hg_h),
        (cx - hg_w * 0.2, cy),
        (cx - hg_w, cy - hg_h)
    ]
    draw.line(hg_pts, fill=(245, 208, 254, 200), width=int(3 * scale))

    # 6. Singularity Core (The Knot Center)
    cr = dim * 0.05
    draw.ellipse([cx - cr, cy - cr, cx + cr, cy + cr], fill=(168, 85, 247, 255), outline=(255, 255, 255, 255), width=int(2 * scale))
    draw.ellipse([cx - cr*0.4, cy - cr*0.4, cx + cr*0.4, cy + cr*0.4], fill=(255, 255, 255, 255))

    # 7. 4-point Flare Star
    flare_len = dim * 0.08
    draw.line([(cx, cy - flare_len), (cx, cy + flare_len)], fill=(255, 255, 255, 230), width=int(2 * scale))
    draw.line([(cx - flare_len, cy), (cx + flare_len, cy)], fill=(255, 255, 255, 230), width=int(2 * scale))

    # Downsample with Lanczos filter for crisp vector-like finish
    final = img.resize((size, size), Image.Resampling.LANCZOS)
    return final

if __name__ == "__main__":
    import os
    img512 = render_chronos_emblem(512)
    img256 = render_chronos_emblem(256)
    img128 = render_chronos_emblem(128)
    img64 = render_chronos_emblem(64)

    os.makedirs("chronos_app/resources/app_unpacked/companion/renderer", exist_ok=True)
    
    # Save to desktop app resources
    img512.save("chronos_app/resources/app_unpacked/companion/tray-icon.png", "PNG")
    img128.save("chronos_app/resources/app_unpacked/companion/renderer/logo.png", "PNG")
    
    # Save to public console assets
    os.makedirs("apps/console/public", exist_ok=True)
    img512.save("apps/console/public/chronos-logo-512.png", "PNG")
    img128.save("apps/console/public/chronos-logo-128.png", "PNG")
    
    # Save as .ico for windows executable
    img256.save("chronos_app/icon.ico", format="ICO", sizes=[(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)])
    img256.save("apps/console/public/chronos-icon.ico", format="ICO", sizes=[(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)])
    print("Chronos logo images generated successfully!")
