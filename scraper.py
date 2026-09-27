import requests
import re

URL = "https://www.offi.fr/expositions-musees/musee-du-louvre-2615.html"

response = requests.get(
    "https://r.jina.ai/" + URL,
    timeout=30,
    headers={"User-Agent": "Mozilla/5.0"},
)

response.raise_for_status()

text = response.text.replace("\r\n", "\n")

match = re.search(
    r"Événements programmés en Expositions",
    text,
    re.IGNORECASE,
)

if not match:
    print("SECTION INTROUVABLE")
    raise SystemExit(1)

start = match.start()

next_heading = re.search(
    r"(?m)^##\s+",
    text[match.end():],
)

if next_heading:
    end = match.end() + next_heading.start()
else:
    end = len(text)

section = text[start:end]

print("=" * 80)
print("CONTENU BRUT DE LA SECTION LOUVRE")
print("=" * 80)
print(section)
print("=" * 80)
