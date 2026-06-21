import os

courses = [
    ("course-piano-kids", "Children Piano", "#FF9A9E", "#FECFEF"),
    ("course-piano-adult", "Adult Piano", "#a18cd1", "#fbc2eb"),
    ("course-flute", "Flute Class", "#84fab0", "#8fd3f4"),
    ("course-stage", "Stage Training", "#fccb90", "#d57eeb"),
    ("course-theory", "Music Theory", "#e0c3fc", "#8ec5fc"),
    ("course-bootcamp", "Bootcamp", "#fa709a", "#fee140"),
    ("course-eurhythmics", "Eurhythmics", "#ffecd2", "#fcb69f"),
    ("og-music", "Yi's Piano Studio", "#c471ed", "#f64f59"),
]

os.makedirs("img", exist_ok=True)

svg_template = """<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:{color1};stop-opacity:1" />
      <stop offset="100%" style="stop-color:{color2};stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#grad)" />
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="48" fill="white" text-anchor="middle" dominant-baseline="middle" font-weight="bold">{text}</text>
</svg>"""

for filename, text, c1, c2 in courses:
    with open(f"img/{filename}.svg", "w") as f:
        f.write(svg_template.format(text=text, color1=c1, color2=c2))
    print(f"Generated img/{filename}.svg")
