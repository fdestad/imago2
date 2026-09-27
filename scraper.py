import re
from datetime import datetime

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
    Récupère la page L'Officiel via Jina Reader.
    """

    jina_url = "https://r.jina.ai/" + url

    response = requests.get(
        jina_url,
        timeout=60,
        headers=HEADERS,
    )

    response.raise_for_status()

    text = response.text.strip()

    if not text:
        raise RuntimeError("Réponse vide de Jina Reader.")

    return text


def parse_date(day, month_name, year):
    """
    Convertit une date française en YYYY-MM-DD.
    """

    month = MONTHS.get(month_name.lower())

    if month is None:
        return None

    date = datetime(
        int(year),
        month,
        int(day),
    )

    return date.strftime("%Y-%m-%d")


def extract_dates(text):
    """
    Recherche une période du type :

    Du 26 septembre 2026 au 14 février 2027
    """

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

    if start is None or end is None:
        return None

    return start, end


def clean_title(line):
    """
    Nettoie un titre Markdown.
    """

    title = line.strip()

    if title.startswith("#####"):
        title = title[5:].strip()

    # [Titre](URL)
    match = re.match(
        r"\[([^\]]+)\]\([^)]+\)",
        title,
    )

    if match:
        title = match.group(1)

    title = title.replace("**", "")
    title = title.replace("__", "")

    return title.strip()


def find_exhibition_section(lines):
    """
    Cherche la section consacrée aux expositions.

    On accepte plusieurs formulations afin de ne pas dépendre
    d'une seule structure exacte.
    """

    possible_markers = [
        "Événements programmés en Expositions",
        "événements programmés en Expositions",
        "Événements programmés en expositions",
        "événements programmés en expositions",
    ]

    for index, line in enumerate(lines):
        for marker in possible_markers:
            if marker in line:
                return index + 1

    return None


def find_section_end(lines, start):
    """
    Cherche la prochaine grande section Markdown.
    """

    for index in range(start, len(lines)):
        line = lines[index].strip()

        if (
            line.startswith("## ")
            or line.startswith("# ")
        ):
            return index

    return len(lines)


def extract_exhibitions(markdown, venue):
    """
    Extrait les expositions programmées.

    Les collections permanentes sont explicitement exclues.
    """

    lines = markdown.splitlines()

    section_start = find_exhibition_section(lines)

    if section_start is None:
        raise RuntimeError(
            "Section expositions introuvable."
        )

    section_end = find_section_end(
        lines,
        section_start,
    )

    section = lines[
        section_start:section_end
    ]

    exhibitions = []

    for index, line in enumerate(section):

        stripped = line.strip()

        if not stripped.startswith("#####"):
            continue

        title = clean_title(stripped)

        if not title:
            continue

        # Collections permanentes = pas une exposition temporaire.
        if (
            "collections permanentes"
            in title.lower()
        ):
            continue

        # Les informations utiles se trouvent généralement
        # dans les lignes suivant le titre.
        context = "\n".join(
            section[index:index + 20]
        )

        dates = extract_dates(context)

        if dates is None:
            continue

        start, end = dates

        exhibitions.append({
            "title": title,
            "venue": venue,
            "start": start,
            "end": end,
        })

    return exhibitions


def scrape_venue(venue, url):
    print()
    print("=" * 80)
    print(venue)
    print(url)
    print("=" * 80)

    markdown = get_page(url)

    exhibitions = extract_exhibitions(
        markdown,
        venue,
    )

    if not exhibitions:
        print("ZERO — aucune exposition détectée")
        return []

    print(
        f"OK — {len(exhibitions)} exposition(s)"
    )

    for exhibition in exhibitions:
        print(
            f"  - {exhibition['title']} | "
            f"{exhibition['start']} → "
            f"{exhibition['end']}"
        )

    return exhibitions


def main():
    all_exhibitions = []

    errors = []
    zero_results = []

    print("=" * 80)
    print("TEST DU SCRAPER IMAGO — L'OFFICIEL")
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

            if not exhibitions:
                zero_results.append(venue)

            all_exhibitions.extend(
                exhibitions
            )

        except Exception as error:

            print()
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
        f"Lieux testés       : {len(VENUES)}"
    )

    print(
        f"Expositions trouvées : "
        f"{len(all_exhibitions)}"
    )

    print(
        f"Erreurs             : "
        f"{len(errors)}"
    )

    print(
        f"Résultats à zéro    : "
        f"{len(zero_results)}"
    )

    if zero_results:
        print()
        print("ZERO — À VÉRIFIER")
        print("-" * 80)

        for venue in zero_results:
            print(f"- {venue}")

    if errors:
        print()
        print("ERREURS — À VÉRIFIER")
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
