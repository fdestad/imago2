import re
import html
import json
import requests
from datetime import date, timedelta
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
    ("BnF", "https://www.offi.fr/a-travers-paris/bibliotheque-nationale-de-france-site-francois-mitterrand-1553.html"),
    ("Agnès B.", "https://www.offi.fr/expositions-musees/galerie-du-jour-agnes-b-4569.html"),
    ("Palais de Tokyo", "https://www.offi.fr/expositions-musees/palais-de-tokyo-2905.html"),
]

VENUE_INFO = {
    "Louvre": {
        "hours": "LUN 09:00–18:00 · MAR fermé · MER 09:00–21:00 · JEU 09:00–18:00 · VEN 09:00–21:00 · SAM–DIM 09:00–18:00",
        "official_url": "https://www.louvre.fr/",
    },
    "Jeu de Paume": {
        "hours": "LUN fermé · MAR 11:00–21:00 · MER–DIM 11:00–19:00",
        "official_url": "https://jeudepaume.org/",
    },
    "Orangerie": {
        "hours": "LUN 09:00–18:00 · MAR fermé · MER–JEU 09:00–18:00 · VEN 09:00–21:00 · SAM–DIM 09:00–18:00",
        "official_url": "https://www.musee-orangerie.fr/",
    },
    "Orsay": {
        "hours": "LUN fermé · MAR–MER 09:30–18:00 · JEU 09:30–21:45 · VEN–DIM 09:30–18:00",
        "official_url": "https://www.musee-orsay.fr/",
    },
    "MEP": {
        "hours": "LUN–MAR fermé · MER 11:00–20:00 · JEU 11:00–22:00 · VEN 11:00–20:00 · SAM–DIM 10:00–20:00",
        "official_url": "https://www.mep-fr.org/",
    },
    "IMA": {
        "hours": "LUN fermé · MAR–VEN 10:00–18:00 · SAM–DIM 10:00–19:00",
        "official_url": "https://www.imarabe.org/",
    },
    "MAD": {
        "hours": "LUN fermé · MAR–DIM 11:00–18:00 · JEU jusqu’à 21:00",
        "official_url": "https://madparis.fr/",
    },
    "FLV": {
        "hours": "LUN 11:00–20:00 · MAR fermé · MER–VEN 11:00–20:00 · SAM–DIM 10:00–20:00",
        "official_url": "https://www.fondationlouisvuitton.fr/",
    },
    "Bourse": {
        "hours": "LUN 11:00–19:00 · MAR fermé · MER–DIM 11:00–19:00 · VEN jusqu’à 21:00",
        "official_url": "https://www.pinaultcollection.com/fr/boursedecommerce",
    },
    "MAC VAL": {
        "hours": "LUN fermé · MAR–DIM 11:00–18:00",
        "official_url": "https://www.macval.fr/",
    },
    "Fondation Cartier": {
        "hours": "LUN fermé · MAR–JEU 11:00–19:00 · VEN 11:00–22:00 · SAM–DIM 11:00–19:00",
        "official_url": "https://www.fondationcartier.com/",
    },
    "Grand Palais": {
        "hours": "LUN fermé · MAR–JEU 10:00–19:30 · VEN 10:00–22:00 · SAM–DIM 10:00–19:30",
        "official_url": "https://www.grandpalais.fr/",
    },
    "Petit Palais": {
        "hours": "LUN fermé · MAR–JEU 10:00–18:00 · VEN–SAM 10:00–20:00 · DIM 10:00–18:00",
        "official_url": "https://www.petitpalais.paris.fr/",
    },
    "Marmottan": {
        "hours": "LUN fermé · MAR–MER 10:00–18:00 · JEU 10:00–21:00 · VEN–DIM 10:00–18:00",
        "official_url": "https://www.marmottan.fr/",
    },
    "Luxembourg": {
        "hours": "LUN 10:30–22:00 · MAR–DIM 10:30–19:00",
        "official_url": "https://museeduluxembourg.fr/",
    },
    "Arsenal": {
        "hours": "LUN fermé · MAR–DIM 11:00–19:00",
        "official_url": "https://www.pavillon-arsenal.com/",
    },
    "Cernuschi": {
        "hours": "LUN fermé · MAR–DIM 10:00–18:00",
        "official_url": "https://www.parismusees.paris.fr/fr/musee-cernuschi",
    },
    "MAM": {
        "hours": "LUN fermé · MAR–MER 10:00–18:00 · JEU 10:00–22:00 · VEN–DIM 10:00–18:00",
        "official_url": "https://www.mam.paris.fr/",
    },
    "Lafayette": {
        "hours": "LUN–MAR fermé · MER–SAM 12:00–19:00 · DIM 12:00–17:00",
        "official_url": "https://www.lafayetteanticipations.com/",
    },
    "Fondation Cartier-Bresson": {
        "hours": "LUN fermé · MAR–DIM 11:00–19:00",
        "official_url": "https://www.henricartierbresson.org/",
    },
    "Cité de l’architecture": {
        "hours": "MAR fermé · LUN, MER, VEN–DIM 11:00–19:00 · JEU jusqu’à 21:00",
        "official_url": "https://www.citedelarchitecture.fr/",
    },
    "Galliera": {
        "hours": "LUN fermé · MAR–JEU 10:00–18:00 · VEN 10:00–21:00 · SAM–DIM 10:00–18:00",
        "official_url": "https://www.palaisgalliera.paris.fr/",
    },
    "BnF": {
        "hours": "LUN 14:00–20:00 · MAR–SAM 09:00–20:00 · DIM 13:00–19:00",
        "official_url": "https://www.bnf.fr/",
    },
    "Agnès B.": {
        "hours": "LUN fermé · MAR–SAM 11:00–19:00 · DIM 14:00–19:00",
        "official_url": "https://www.agnesb.com/fr-eu/GalerieDuJour.html",
    },
    "Palais de Tokyo": {
        "hours": "LUN–DIM 12:00–21:00 · MAR fermé",
        "official_url": "https://palaisdetokyo.com/",
    },
}

TODAY = date.today()
UPCOMING_LIMIT = TODAY + timedelta(days=30)

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
    Extract all exhibition cards from L'Officiel.

    L'Officiel uses schema.org VisualArtsEvent markup:
      - itemprop="name"
      - itemprop="startDate"
      - itemprop="endDate"
      - itemprop="url"
      - itemprop="description"
    """

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

    # Remove duplicates
    unique = {}

    for exhibition in exhibitions:
        key = (
            exhibition["title"],
            exhibition["start"],
            exhibition["end"],
        )
        unique[key] = exhibition

    return list(unique.values())


def classify(exhibition):
    """
    Determine whether an exhibition is current, upcoming or irrelevant.
    """

    start = exhibition["start"]
    end = exhibition["end"]

    if start <= TODAY <= end:
        return "current"

    if TODAY < start <= UPCOMING_LIMIT:
        return "upcoming"

    return None


def serialize(exhibition, venue):
    """
    Convert internal date objects to the JSON format used by the app.
    """

    status = classify(exhibition)

    return {
        "title": exhibition["title"],
        "venue": venue,
        "start": exhibition["start"].isoformat(),
        "end": exhibition["end"].isoformat(),
        "status": status,
        "url": exhibition["url"],
        "description": exhibition["description"],
    }


def main():

    current = []
    upcoming = []

    errors = []
    successful_sources = 0

    print("=" * 80)
    print("IMAGO — PRODUCTION SCRAPER TEST")
    print("Date :", TODAY.isoformat())
    print("Bientôt jusqu'au :", UPCOMING_LIMIT.isoformat())
    print("=" * 80)

    for venue_name, source_url in VENUES:

        print()
        print("-" * 80)
        print(venue_name)
        print("-" * 80)

        try:
            source = fetch(source_url)
            all_exhibitions = parse_exhibitions(source_url, source)

            successful_sources += 1

            venue_current = []
            venue_upcoming = []

            for exhibition in all_exhibitions:

                status = classify(exhibition)

                if status == "current":
                    item = serialize(exhibition, venue_name)
                    current.append(item)
                    venue_current.append(item)

                elif status == "upcoming":
                    item = serialize(exhibition, venue_name)
                    upcoming.append(item)
                    venue_upcoming.append(item)

            for item in venue_current:
                print(
                    f"[EN CE MOMENT] "
                    f"{item['title']} | "
                    f"jusqu'au {item['end']}"
                )

            for item in venue_upcoming:
                print(
                    f"[BIENTÔT] "
                    f"{item['title']} | "
                    f"à partir du {item['start']}"
                )

            if not venue_current and not venue_upcoming:
                print("Aucune exposition pertinente.")

        except Exception as error:

            errors.append({
                "venue": venue_name,
                "url": source_url,
                "error": str(error),
            })

            print("ERREUR :", error)

    # Current exhibitions: soonest ending first
    current.sort(
        key=lambda x: x["end"]
    )

    # Upcoming exhibitions: soonest starting first
    upcoming.sort(
        key=lambda x: x["start"]
    )

    data = {
    "updated": TODAY.isoformat(),
    "venues": VENUE_INFO,
    "current": current,
    "upcoming": upcoming,
}

    with open(
        "exhibitions.json",
        "w",
        encoding="utf-8",
    ) as file:

        json.dump(
            data,
            file,
            ensure_ascii=False,
            indent=2,
        )

    print()
    print("=" * 80)
    print("RÉSUMÉ")
    print("=" * 80)
    print("Lieux testés          :", len(VENUES))
    print("Sources réussies      :", successful_sources)
    print("Sources en erreur     :", len(errors))
    print("En ce moment          :", len(current))
    print("Bientôt               :", len(upcoming))
    print("Total affichable      :", len(current) + len(upcoming))
    print("Fichier généré        : exhibitions.json")
    print("=" * 80)

    if errors:
        print()
        print("ERREURS")
        for error in errors:
            print(
                f"- {error['venue']} : "
                f"{error['error']}"
            )


if __name__ == "__main__":
    main()
