import requests
import re

URL = "https://www.offi.fr/expositions-musees/musee-du-louvre-2615.html"

response = requests.get(
    URL,
    timeout=30,
    headers={
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                      "(KHTML, like Gecko) Chrome/130.0 Safari/537.36"
    },
)

print("STATUS:", response.status_code)
print("URL:", response.url)
print("TAILLE:", len(response.text))

if response.status_code != 200:
    print(response.text[:2000])
    raise SystemExit(1)

text = response.text

# Cherche les deux titres connus dans le HTML
for title in ["Zurbarán", "Sculpter la couleur"]:
    print()
    print("=" * 80)
    print("RECHERCHE:", title)
    print("=" * 80)

    match = re.search(title, text, re.IGNORECASE)

    if not match:
        print("TITRE INTROUVABLE DANS LE HTML")
        continue

    start = max(0, match.start() - 1000)
    end = min(len(text), match.end() + 2000)

    print(text[start:end])
