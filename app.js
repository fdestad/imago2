const currentList = document.getElementById("current-list");
const upcomingList = document.getElementById("upcoming-list");

const detail = document.getElementById("detail");
const detailContent = document.getElementById("detail-content");
const detailClose = document.getElementById("detail-close");

let exhibitions = [];

const FAVORITES_KEY = "imago2-favorites";

/* =========================
   DATE
   ========================= */

function formatDate(dateString) {
  if (!dateString) return "";

  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

/* =========================
   FAVORITES
   ========================= */

function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
  } catch {
    return [];
  }
}

function saveFavorites(favorites) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

function getExhibitionId(exhibition) {
  return [
    exhibition.title,
    exhibition.venue,
    exhibition.start || "",
    exhibition.end || ""
  ].join("|");
}

function isFavorite(exhibition) {
  return getFavorites().includes(getExhibitionId(exhibition));
}

function toggleFavorite(exhibition, element) {
  const id = getExhibitionId(exhibition);
  const favorites = getFavorites();

  const index = favorites.indexOf(id);

  if (index === -1) {
    favorites.push(id);
  } else {
    favorites.splice(index, 1);
  }

  saveFavorites(favorites);

  element.classList.toggle("favorite", index === -1);
}

/* =========================
   EXHIBITION ELEMENT
   ========================= */

function createExhibitionElement(exhibition) {
  const element = document.createElement("article");

  element.className = "exhibition";

  if (isFavorite(exhibition)) {
    element.classList.add("favorite");
  }

  const title = document.createElement("h3");
  title.className = "exhibition-title";
  title.textContent = exhibition.title;

  const venue = document.createElement("div");
  venue.className = "exhibition-venue";
  venue.textContent = exhibition.venue;

  const date = document.createElement("div");
  date.className = "exhibition-date";

  if (exhibition.status === "upcoming") {
    date.textContent = `À partir du ${formatDate(exhibition.start)}`;
  } else {
    date.textContent = `Jusqu'au ${formatDate(exhibition.end)}`;
  }

  const information = document.createElement("div");

  information.appendChild(title);
  information.appendChild(venue);

  element.appendChild(information);
  element.appendChild(date);

  /* =========================
     OPEN DETAIL
     ========================= */

  element.addEventListener("click", () => {
    if (Math.abs(swipeDistance) > 10) return;

    openDetail(exhibition);
  });

  /* =========================
     SWIPE RIGHT → FAVORITE
     ========================= */

  let startX = 0;
  let startY = 0;
  let swipeDistance = 0;
  let isSwiping = false;

  element.addEventListener(
    "touchstart",
    (event) => {
      if (event.touches.length !== 1) return;

      startX = event.touches[0].clientX;
      startY = event.touches[0].clientY;
      swipeDistance = 0;
      isSwiping = false;

      element.classList.add("swiping");
    },
    { passive: true }
  );

  element.addEventListener(
    "touchmove",
    (event) => {
      if (event.touches.length !== 1) return;

      const currentX = event.touches[0].clientX;
      const currentY = event.touches[0].clientY;

      const deltaX = currentX - startX;
      const deltaY = currentY - startY;

      /*
        Only interpret the gesture as a horizontal swipe
        when the horizontal movement clearly dominates.
      */
      if (!isSwiping) {
        if (Math.abs(deltaX) < 8) return;

        if (Math.abs(deltaY) > Math.abs(deltaX)) {
          return;
        }

        isSwiping = true;
      }

      if (!isSwiping) return;

      /*
        Only allow movement to the right.
      */
      swipeDistance = Math.max(0, deltaX);

      /*
        Limit movement so the item does not disappear.
      */
      const visualDistance = Math.min(swipeDistance, 120);

      element.style.transform = `translateX(${visualDistance}px)`;
    },
    { passive: true }
  );

  element.addEventListener(
    "touchend",
    () => {
      element.classList.remove("swiping");

      /*
        Roughly 70px is enough to validate the gesture.
      */
      if (swipeDistance >= 70) {
        toggleFavorite(exhibition, element);
      }

      element.style.transform = "";
      swipeDistance = 0;
      isSwiping = false;
    },
    { passive: true }
  );

  element.addEventListener(
    "touchcancel",
    () => {
      element.classList.remove("swiping");
      element.style.transform = "";
      swipeDistance = 0;
      isSwiping = false;
    },
    { passive: true }
  );

  return element;
}

/* =========================
   RENDER
   ========================= */

function renderList(container, items) {
  container.innerHTML = "";

  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "Aucune exposition";
    container.appendChild(empty);
    return;
  }

  items.forEach((exhibition) => {
    container.appendChild(
      createExhibitionElement(exhibition)
    );
  });
}

/* =========================
   DETAIL
   ========================= */

function openDetail(exhibition) {
  detailContent.innerHTML = "";

  const title = document.createElement("h1");
  title.className = "detail-title";
  title.textContent = exhibition.title;

  const meta = document.createElement("div");
  meta.className = "detail-meta";

  if (exhibition.status === "upcoming") {
    meta.textContent =
      `${exhibition.venue} · À partir du ${formatDate(exhibition.start)}`;
  } else {
    meta.textContent =
      `${exhibition.venue} · Jusqu'au ${formatDate(exhibition.end)}`;
  }

  const description = document.createElement("p");
  description.className = "detail-description";
  description.textContent =
    exhibition.description || "Description non disponible.";

  const source = document.createElement("a");
  source.className = "detail-source";
  source.href = exhibition.url;
  source.target = "_blank";
  source.rel = "noopener noreferrer";
  source.textContent = "Voir la source";

  detailContent.appendChild(title);
  detailContent.appendChild(meta);
  detailContent.appendChild(description);
  detailContent.appendChild(source);

  detail.classList.add("open");
  detail.setAttribute("aria-hidden", "false");

  document.body.style.overflow = "hidden";
}

function closeDetail() {
  detail.classList.remove("open");
  detail.setAttribute("aria-hidden", "true");

  document.body.style.overflow = "";
}

detailClose.addEventListener("click", closeDetail);

detail.addEventListener("click", (event) => {
  if (event.target === detail) {
    closeDetail();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeDetail();
  }
});

/* =========================
   LOAD DATA
   ========================= */

async function loadExhibitions() {
  try {
    const response = await fetch(
      "exhibitions.json",
      { cache: "no-store" }
    );

    if (!response.ok) {
      throw new Error("Impossible de charger les données.");
    }

    const data = await response.json();

    exhibitions = [
      ...(data.current || []),
      ...(data.upcoming || [])
    ];

    const current = data.current || [];
    const upcoming = data.upcoming || [];

    renderList(currentList, current);
    renderList(upcomingList, upcoming);

  } catch (error) {
    console.error(error);

    currentList.innerHTML =
      '<p class="empty">Données indisponibles.</p>';

    upcomingList.innerHTML =
      '<p class="empty">Données indisponibles.</p>';
  }
}

loadExhibitions();
