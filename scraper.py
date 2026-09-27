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


MONTHS = (
    "janvier|février|mars|avril|mai|juin|juillet|août|"
    "septembre|octobre|novembre|décembre"
)


DATE_RANGE_RE = re.compile(
    rf"""
    Du\s+
    (\d{{1,2}})\s+({MONTHS})\s+(\d{{4}})
    \s+au\s+
    (\d{{1,2}})\s+({MONTHS})\s+(\d{{4}})
    """,
    re.IGNORECASE | re.VERBOSE,
)


UNTIL_RE = re.compile(
    rf"""
    Jusqu['’]au\s+
    (\d{{1,2}})\s+({MONTHS})\s+(\d{{4}})
    """,
    re.IGNORECASE | re.VERBOSE,
)


def fetch_page(url):
    response = requests.get(
        JINA_PREFIX + url,
        timeout=30,
        headers={"User-Agent": "Mozilla/5.0"},
    )
    response.raise_for_status()
    return response.text


def normalize_text(text):
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = text.replace("\u00a0", " ")
    return text


def find_programmed_section(text):
    """
    Find the part of the page containing current/upcoming exhibitions.

    We deliberately stop at the next major Markdown heading so that
    historical exhibitions are never considered.
    """

    text = normalize_text(text)

    patterns = [
        r"Événements programmés en Expositions",
        r"Événement programmé en Expositions",
    ]

    match = None

    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            break

    if not match:
        return None

    start = match.start()

    # Find the next level-2 Markdown heading.
    next_heading = re.search(
        r"(?m)^##\s+",
        text[match.end():],
    )

    if next_heading:
        end = match.end() + next_heading.start()
        return text[start:end]

    return text[start:]


def extract_dates(text):
    match = DATE_RANGE_RE.search(text)

    if match:
        start = " ".join(match.group(i) for i in (1, 2, 3))
        end = " ".join(match.group(i) for i in (4, 5, 6))
        return start, end

    match = UNTIL_RE.search(text)

    if match:
        end = " ".join(match.group(i) for i in (1, 2, 3))
        return None, end

    return None, None


def is_probable_title(line):
    """
    Detect likely exhibition-title lines without depending on
    one exact Markdown heading level.
    """

    line = line.strip()

    if not line:
        return False

    if line.startswith("#"):
        line = re.sub(r"^#+\s*", "", line)

    if not line:
        return False

    lower = line.lower()

    excluded = [
        "actuellement",
        "prochainement",
        "collections permanentes",
        "visite des collections",
        "fermé",
        "fermeture",
        "horaires",
        "tarifs",
    ]

    if any(x in lower for x in excluded):
        return False

    # A title generally isn't a date line or a category/navigation line.
    if DATE_RANGE_RE.search(line) or UNTIL_RE.search(line):
        return False

    if line.startswith("[") and "](" in line:
        return True

    # Markdown headings are strong title candidates.
    if re.match(r"^#+\s+", line):
        return True

    return False


def clean_title(line):
    line = line.strip()
    line = re.sub(r"^#+\s*", "", line)

    match = re.search(r"\[([^\]]+)\]\([^)]+\)", line)

    if match:
        return match.group(1).strip()

    return line.strip()


def extract_url(line):
    match = re.search(
        r"\[[^\]]+\]\(([^)]+)\)",
        line,
    )

    if not match:
        return None

    return urljoin(
        "https://www.offi.fr/",
        match.group(1).strip(),
    )


def parse_section(section):
    """
    Parse the programming section.

    Instead of assuming a particular heading level, we use each
    date occurrence to identify an exhibition block and search
    backwards for its nearest plausible title.
    """

    lines = section.splitlines()

    results = []

    current_status = None

    # Track all plausible title lines.
    title_candidates = []

    for index, raw_line in enumerate(lines):
        line = raw_line.strip()

        if re.fullmatch(r"Actuellement", line, re.IGNORECASE):
            current_status = "currently"
            continue

        if re.fullmatch(r"Prochainement", line, re.IGNORECASE):
            current_status = "upcoming"
            continue

        if is_probable_title(line):
            title_candidates.append(
                (index, clean_title(line), extract_url(line))
            )

    # Every date range belongs to the closest preceding title.
    date_lines = []

    for index, raw_line in enumerate(lines):
        start, end = extract_dates(raw_line)

        if end:
            date_lines.append(
                (index, start, end)
            )

    for date_index, start, end in date_lines:
        candidates = [
            item
            for item in title_candidates
            if item[0] < date_index
        ]

        if not candidates:
            continue

        title_index, title, url = candidates[-1]

        if "collections permanentes" in title.lower():
            continue

        if any(
            existing["title"] == title
            and existing["start"] == start
            and existing["end"] == end
            for existing in results
        ):
            continue

        # Determine status from the text between the title and date.
        status = None

        for line in lines[title_index:date_index]:
            if re.fullmatch(r"Actuellement", line.strip(), re.IGNORECASE):
                status = "currently"
            elif re.fullmatch(r"Prochainement", line.strip(), re.IGNORECASE):
                status = "upcoming"

        results.append(
            {
                "title": title,
                "start": start,
                "end": end,
                "status": status,
                "url": url,
            }
        )

    return results


def scrape_venue(name, url):
    text = fetch_page(url)

    section = find_programmed_section(text)

    if section is None:
        # Lafayette can legitimately have no events listed.
        if "Nous ne référençons actuellement aucun événement culturel" in text:
            return []

        raise RuntimeError("Section des expositions introuvable")

    return parse_section(section)


def main():
    total = 0
    errors = 0

    print("=" * 60)
    print("IMAGO — TEST DU SCRAPER V4")
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
