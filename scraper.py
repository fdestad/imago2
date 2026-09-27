import re
from datetime import datetime
from urllib.parse import urljoin

import requests


HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; Imago/1.0)"
}


VENUES = {
    "Louvre":
        "https://www.offi.fr/expositions-musees/musee-du-louvre-2615.html",

    "Jeu de Paume":
        "https://www.offi.fr/expositions-musees/jeu-de-paume-2556.html",

    "Orangerie":
        "https://www.offi.fr/expositions-musees/musee-de-lorangerie-2889.html",

    "Orsay":
        "https://www.offi.fr/expositions-musees/musee-dorsay-2897.html",

    "MEP":
        "https://www.offi.fr/expositions-musees/maison-europeenne-de-la-photographie-2699.html",

    "IMA":
        "https://www.offi.fr/expositions-musees/institut-du-monde-arabe-2504.html",

    "MAD":
        "https://www.offi.fr/expositions-musees/les-arts-decoratifs-1462.html",

    "FLV":
        "https://www.offi.fr/expositions-musees/fondation-louis-vuitton-6084.html",

    "Bourse":
        "https://www.offi.fr/expositions-musees/bourse-de-commerce-pinault-collection-6929.html",

    "MAC VAL":
        "https://www.offi.fr/expositions-musees/mac-val-1444.html",

    "Fondation Cartier":
        "https://www.offi.fr/expositions-musees/fondation-cartier-pour-lart-contemporain-2334.html",

    "Grand Palais":
        "https://www.offi.fr/expositions-musees/grand-palais-5399.html",

    "Petit Palais":
        "https://www.offi.fr/expositions-musees/petit-palais-2991.html",

    "Marmottan":
        "https://www.offi.fr/expositions-musees/marmottan-monet-2747.html",

    "Luxembourg":
        "https://www.offi.fr/expositions-musees/musee-du-luxembourg-2626.html",

    "Arsenal":
        "https://www.offi.fr/expositions-musees/pavillon-de-larsenal-2974.html",

    "Cernuschi":
        "https://www.offi.fr/expositions-musees/musee-cernuschi-1751.html",

    "MAM":
        "https://www.offi.fr/expositions-musees/musee-dart-moderne-1450.html",

    "Lafayette":
        "https://www.offi.fr/theatre/lafayette-anticipations-7097.html",

    "Fondation Cartier-Bresson":
        "https://www.offi.fr/expositions-musees/fondation-henri-cartier-bresson-2335.html",

    "Cité de l'architecture":
        "https://www.offi.fr/expositions-musees/cite-de-larchitecture-et-du-patrimoine-1851.html",

    "Galliera":
        "https://www.offi.fr/expositions-musees/musee-galliera-2366.html",
}


MONTHS = {
    "janvier": 1,
    "février": 2,
    "mars": 3,
    "avril": 4,
    "mai": 5,
    "juin": 6,
    "juillet": 7,
    "août": 8,
    "septembre": 9,
    "octobre": 10,
    "novembre": 11,
    "décembre": 12,
}


DATE_PATTERN = re.compile(
    r"Du\s+"
    r"(\d{1,2})\s+([a-zéûôîà]+)\s+(\d{4})"
    r"\s+au\s+"
    r"(\d{1,2})\s+([a-zéûôîà]+)\s+(\d{4})",
    re.IGNORECASE,
)


def get_page(url):
    """
    Récupère une page L'Officiel via Jina Reader.
    """

    response = requests.get(
        "https://r.jina.ai/" + url,
        timeout=60,
        headers=HEADERS,
    )

    response.raise_for_status()

    text = response.text.strip()

    if not text:
        raise RuntimeError("Réponse vide.")

    return text


def parse_date(day, month, year):
    month_number = MONTHS.get(month.lower())

    if month_number is None:
        return None

    return datetime(
        int(year),
        month_number,
        int(day),
    ).strftime("%Y-%m-%d")


def extract_dates(text):
    match = DATE_PATTERN.search(text)

    if not match:
        return None

    start = parse_date(
        match.group(1),
        match.group(2),
        match.group(3),
    )

    end = parse_date(
        match.group(4),
        match.group(5),
        match.group(6),
    )

    if not start or not end:
        return None

    return start, end


def clean_title(title):
    title = title.strip()

    # Markdown link
    match = re.match(
        r"\[([^\]]+)\]\([^)]+\)",
        title,
    )

    if match:
        title = match.group(1)

    title = title.replace("**", "")
    title = title.replace("__", "")

    return title.strip()


def find_exhibition_links(markdown):
    """
    Cherche les liens d'expositions dans la page du lieu.

    On ne cherche pas une formulation précise de section :
    on identifie les liens vers les fiches /expositions-musees/
    et on les associe à leur bloc de contenu.
    """

    lines = markdown.splitlines()

    links = []

    for index, line in enumerate(lines):

        # Les titres d'événements apparaissent sous forme
        # de titres Markdown de niveau 5.
        if not line.strip().startswith("#####"):
            continue

        title_line = line.strip()

        # Recherche d'un lien Markdown dans le titre.
        match = re.search(
            r"\[([^\]]+)\]\((https?://www\.offi\.fr/[^)]+)\)",
            title_line,
        )

        if not match:
            continue

        title = clean_title(match.group(1))
        url = match.group(2)

        # On ne conserve que les fiches relevant des expositions.
        if "/expositions-musees/" not in url:
            continue

        # Les collections permanentes ne sont pas une exposition.
        if "collections permanentes" in title.lower():
            continue

        context = "\n".join(
            lines[index:index + 12]
        )

        dates = extract_dates(context)

        if dates is None:
            continue

        start, end = dates

        links.append({
            "title": title,
            "start": start,
            "end": end,
            "url": url,
        })

    return links


def scrape_venue(venue, url):
    print()
    print("=" * 80)
    print(venue)
    print("=" * 80)

    markdown = get_page(url)

    exhibitions = find_exhibition_links(markdown)

    if not exhibitions:
        raise RuntimeError(
            "Aucune exposition détectée."
        )

    # Suppression des doublons.
    unique = {}

    for exhibition in exhibitions:
        unique[
            (
                exhibition["title"],
                exhibition["url"],
            )
        ] = exhibition

    exhibitions = list(unique.values())

    for exhibition in exhibitions:
        exhibition["venue"] = venue

    print(
        f"{len(exhibitions)} exposition(s) détectée(s)"
    )

    for exhibition in exhibitions:
        print(
            f"  - {exhibition['title']} | "
            f"{exhibition['start']} → "
            f"{exhibition['end']} | "
            f"{exhibition['url']}"
        )

    return exhibitions


def main():
    all_exhibitions = []
    errors = []

    print("=" * 80)
    print("TEST SCRAPER IMAGO — L'OFFICIEL")
    print("=" * 80)
    print(
        f"{len(VENUES)} lieux à tester."
    )

    for venue, url in VENUES.items():

        try:
            exhibitions = scrape_venue(
                venue,
                url,
            )

            all_exhibitions.extend(
                exhibitions
            )

        except Exception as error:

            print(
                f"ERREUR — {venue}: {error}"
            )

            errors.append({
                "venue": venue,
                "error": str(error),
            })

    print()
    print("=" * 80)
    print("RÉSUMÉ")
    print("=" * 80)

    print(
        f"Lieux testés : {len(VENUES)}"
    )

    print(
        f"Expositions détectées : "
        f"{len(all_exhibitions)}"
    )

    print(
        f"Erreurs : {len(errors)}"
    )

    if errors:
        print()
        print("ERREURS")
        print("-" * 80)

        for error in errors:
            print(
                f"- {error['venue']} : "
                f"{error['error']}"
            )

    print()
    print("=" * 80)
    print("FIN DU TEST")
    print("=" * 80)


if __name__ == "__main__":
    main()
