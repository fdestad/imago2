import re
import html
import requests
from datetime import date
from urllib.parse import urljoin


VENUES = [
    ("Louvre", "https://www.offi.fr/expositions-musees/musee-du-louvre-2615.html"),
    ("Jeu de Paume", "https://www.offi.fr/expositions-musees/jeu-de-paume-2556.html"),
    ("Orangerie", "https://www.offi.fr/expositions-musees/musee-de-lorangerie-2889.html"),
    ("Orsay", "https://www.offi.fr/expositions-musees/musee-dorsay-2897.html"),
    ("MEP", "https://www.offi.fr/expositions-musees/maison-europeenne-de-la-photographie-2699.html"),
    ("IMA", "https://www.offi.fr/expositions-musees/institut-du-monde-arabe-2504.html"),
    ("MAD", "https://www.offi.fr/expositions-musees/les-arts-decoratifs-1462.html"),
    ("FLV", "https://www.offi.fr/expositions-musees/fondation-louis-vuitton-6084.html"),
    ("Bourse", "https://www.offi.fr/expositions-musees/bourse-de-commerce-pinault-collection-6929.html"),
    ("MAC VAL", "https://www.offi.fr/expositions-musees/mac-val-1444.html"),
    ("Fondation Cartier", "https://www.offi.fr/expositions-musees/fondation-cartier-pour-lart-contemporain-2334.html"),
    ("Grand Palais", "https://www.offi.fr/expositions-musees/grand-palais-5399.html"),
    ("Petit Palais", "https://www.offi.fr/expositions-musees/petit-palais-2991.html"),
    ("Marmottan", "https://www.offi.fr/expositions-musees/marmottan-monet-2747.html"),
    ("Luxembourg", "https://www.offi.fr/expositions-musees/musee-du-luxembourg-2626.html"),
    ("Arsenal", "https://www.offi.fr/expositions-musees/pavillon-de-larsenal-2974.html"),
    ("Cernuschi", "https://www.offi.fr/expositions-musees/musee-cernuschi-1751.html"),
    ("MAM", "https://www.offi.fr/expositions-musees/musee-dart-moderne-1450.html"),
    ("Lafayette", "https://www.offi.fr/theatre/lafayette-anticipations-7097.html"),
    ("Fondation Cartier-Bresson", "https://www.offi.fr/expositions-musees/fondation-henri-cartier-bresson-2335.html"),
    ("Cité de l’architecture", "https://www.offi.fr/expositions-musees/cite-de-larchitecture-et-du-patrimoine-1851.html"),
    ("Galliera", "https://www.offi.fr/expositions-musees/musee-galliera-2366.html"),
]


TODAY = date.today()

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/130.0 Safari/537.36"
    )
}


def fetch(url):
    response = requests.get(
        url,
        headers=HEADERS,
        timeout=30,
    )
    response.raise_for_status()
    return response.text


def clean_text(value):
    value = html.unescape(value)
    value = re.sub(r"<[^>]+>", "", value)
    value = re.sub(r"\s+", " ", value)
    return value.strip()


def parse_exhibitions(source_url, text):
    """
    Extracts exhibition cards from L'Officiel's HTML.

    The useful structure is:

        <div ... class="column ... A_musees_expositions ...">
            ...
            <span itemprop="name">TITLE</span>
            ...
            <meta itemprop="startDate" content="YYYY-MM-DD">
            <meta itemprop="endDate" content="YYYY-MM-DD">
        </div>
    """

    # Each exhibition card has this class.
    pattern = re.compile(
        r'<div[^>]+class="[^"]*\bA_musees_expositions\b[^"]*"'
        r'[^>]*>(.*?)(?=<div[^>]+class="[^"]*\bA_musees_expositions\b|'
        r'</main>|</body>)',
        re.IGNORECASE | re.DOTALL,
    )

    exhibitions = []

    for block in pattern.findall(text):
        title_match = re.search(
            r'<span[^>]+itemprop="name"[^>]*>(.*?)</span>',
            block,
            re.IGNORECASE | re.DOTALL,
        )

        start_match = re.search(
            r'<meta[^>]+itemprop="startDate"[^>]+content="([^"]+)"',
            block,
            re.IGNORECASE,
        )

        end_match = re.search(
            r'<meta[^>]+itemprop="endDate"[^>]+content="([^"]+)"',
            block,
            re.IGNORECASE,
        )

        url_match = re.search(
            r'<a[^>]+itemprop="url"[^>]+href="([^"]+)"',
            block,
            re.IGNORECASE,
        )

        description_match = re.search(
            r'<meta[^>]+itemprop="description"[^>]+content="([^"]*)"',
            block,
            re.IGNORECASE | re.DOTALL,
        )

        if not title_match or not start_match or not end_match:
            continue

        title = clean_text(title_match.group(1))
        start = start_match.group(1)
        end = end_match.group(1)

        try:
            start_date = date.fromisoformat(start)
            end_date = date.fromisoformat(end)
        except ValueError:
            continue

        # Ignore obviously non-exhibition entries.
        if not title:
            continue

        exhibition_url = (
            urljoin(source_url, html.unescape(url_match.group(1)))
            if url_match
            else source_url
        )

        description = (
            clean_text(description_match.group(1))
            if description_match
            else ""
        )

        exhibitions.append({
            "title": title,
            "start": start_date,
            "end": end_date,
            "url": exhibition_url,
            "description": description,
        })

    # Deduplicate.
    unique = {}
    for exhibition in exhibitions:
        key = (
            exhibition["title"],
            exhibition["start"],
            exhibition["end"],
        )
        unique[key] = exhibition

    return list(unique.values())


def main():
    print("=" * 80)
    print("IMAGO — TEST DU SCRAPER")
    print("Date :", TODAY.isoformat())
    print("=" * 80)

    total = 0
    errors = 0

    for venue_name, url in VENUES:
        print()
        print("-" * 80)
        print(venue_name)
        print("-" * 80)

        try:
            text = fetch(url)
            exhibitions = parse_exhibitions(url, text)

            if not exhibitions:
                print("Aucune exposition détectée.")
                continue

            for exhibition in sorted(
                exhibitions,
                key=lambda x: x["start"]
            ):
                status = (
                    "EN CE MOMENT"
                    if exhibition["start"] <= TODAY <= exhibition["end"]
                    else "BIENTÔT"
                    if TODAY < exhibition["start"]
                    else "TERMINÉE"
                )

                print(
                    f"[{status}] "
                    f"{exhibition['title']} | "
                    f"{exhibition['start']} → {exhibition['end']}"
                )

            total += len(exhibitions)

        except Exception as error:
            errors += 1
            print("ERREUR :", error)

    print()
    print("=" * 80)
    print("RÉSUMÉ")
    print("=" * 80)
    print("Lieux testés       :", len(VENUES))
    print("Expositions trouvées :", total)
    print("Erreurs             :", errors)
    print("=" * 80)


if __name__ == "__main__":
    main()
