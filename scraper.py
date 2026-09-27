import re
import requests
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


JINA_PREFIX = "https://r.jina.ai/"


def fetch_page(url):
    response = requests.get(
        JINA_PREFIX + url,
        timeout=30,
        headers={"User-Agent": "Mozilla/5.0"},
    )
    response.raise_for_status()
    return response.text


def extract_exhibition_section(text):
    """
    Extract only the section:
    'Événements programmés en Expositions'

    It ends at the next top-level Markdown heading.
    """
    match = re.search(
        r"(?im)^##\s+\d+\s+Événements programmés en Expositions\b.*$",
        text,
    )

    if not match:
        # Some pages may use singular/plural or slightly different formatting.
        match = re.search(
            r"(?im)^##\s+.*Événement[s]? programmé[s]? en Expositions\b.*$",
            text,
        )

    if not match:
        return None

    start = match.start()

    next_heading = re.search(
        r"(?m)^##\s+",
        text[match.end():],
    )

    if next_heading:
        end = match.end() + next_heading.start()
        return text[start:end]

    return text[start:]


def extract_title_and_url(heading):
    """
    Extract a Markdown link from a ##### heading.

    Example:
    ##### [Zurbarán 1598-1664](https://www.offi.fr/...)
    """
    match = re.search(
        r"\[([^\]]+)\]\(([^)]+)\)",
        heading,
    )

    if match:
        title = match.group(1).strip()
        url = urljoin("https://www.offi.fr/", match.group(2).strip())
        return title, url

    # Fallback if Jina gives the heading without Markdown link.
    title = re.sub(r"^#+\s*", "", heading).strip()
    return title, None


def parse_dates(block):
    """
    Parse the date range inside one exhibition block.

    Supports:
    - Du 7 octobre 2026 au 25 janvier 2027
    - Jusqu'au 27 septembre 2026
    """

    match = re.search(
        r"Du\s+(\d{1,2})\s+([A-Za-zÀ-ÿ]+)\s+(\d{4})"
        r"\s+au\s+(\d{1,2})\s+([A-Za-zÀ-ÿ]+)\s+(\d{4})",
        block,
        re.IGNORECASE,
    )

    if match:
        start = " ".join(match.group(i) for i in (1, 2, 3))
        end = " ".join(match.group(i) for i in (4, 5, 6))
        return start, end

    match = re.search(
        r"Jusqu['’]au\s+(\d{1,2})\s+([A-Za-zÀ-ÿ]+)\s+(\d{4})",
        block,
        re.IGNORECASE,
    )

    if match:
        end = " ".join(match.group(i) for i in (1, 2, 3))
        return None, end

    return None, None


def parse_exhibitions(section):
    """
    Parse each ##### exhibition block inside the dedicated section.
    """

    headings = list(re.finditer(r"(?m)^#####\s+.*$", section))

    exhibitions = []
    status = None

    for i, heading_match in enumerate(headings):
        heading = heading_match.group(0).strip()

        # Everything until the next ##### belongs to this exhibition.
        block_start = heading_match.start()
        block_end = (
            headings[i + 1].start()
            if i + 1 < len(headings)
            else len(section)
        )

        block = section[block_start:block_end]

        # Status can appear before the exhibition heading.
        before = section[:heading_match.start()]
        status_matches = list(
            re.finditer(
                r"(?im)^(Actuellement|Prochainement)\s*$",
                before,
            )
        )

        if status_matches:
            status = status_matches[-1].group(1).lower()

        title, url = extract_title_and_url(heading)

        # Permanent collections are explicitly excluded.
        if "collections permanentes" in title.lower():
            continue

        start_date, end_date = parse_dates(block)

        # An actual exhibition should have dates.
        if not end_date:
            continue

        exhibitions.append(
            {
                "title": title,
                "start": start_date,
                "end": end_date,
                "status": status,
                "url": url,
            }
        )

    return exhibitions


def scrape_venue(name, url):
    text = fetch_page(url)

    section = extract_exhibition_section(text)

    # A venue can legitimately have no exhibition section/current event.
    if section is None:
        if "Nous ne référençons actuellement aucun événement culturel" in text:
            return []

        raise RuntimeError("Section expositions introuvable")

    return parse_exhibitions(section)


def main():
    total = 0
    errors = 0

    print("=" * 60)
    print("IMAGO — TEST DU SCRAPER V3")
    print("=" * 60)

    for name, url in VENUES:
        print(f"\n{name}")

        try:
            exhibitions = scrape_venue(name, url)

            print(f"  {len(exhibitions)} exposition(s) détectée(s)")

            for exhibition in exhibitions:
                print(
                    f"  - {exhibition['title']} | "
                    f"{exhibition['start']} → {exhibition['end']} | "
                    f"{exhibition['status']}"
                )

            total += len(exhibitions)

        except Exception as e:
            errors += 1
            print(f"  ERREUR: {e}")

    print("\n" + "=" * 60)
    print(f"TOTAL : {total} exposition(s)")
    print(f"ERREURS : {errors}")
    print("=" * 60)


if __name__ == "__main__":
    main()
