const currentList = document.getElementById("current-list");
const upcomingList = document.getElementById("upcoming-list");

const detail = document.getElementById("detail");
const detailContent = document.getElementById("detail-content");
const detailClose = document.getElementById("detail-close");

let exhibitions = [];


/* -------------------------
   DATE FORMATTING
------------------------- */

function formatDate(dateString) {
  if (!dateString) return "";

  const date = new Date(`${dateString}T00:00:00`);

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}


/* -------------------------
   EXHIBITION RENDERING
------------------------- */

function createExhibitionElement(exhibition) {
  const article = document.createElement("article");

  article.className = "exhibition";
  article.tabIndex = 0;

  const text = document.createElement("div");

  const title = document.createElement("h3");
  title.className = "exhibition-title";
  title.textContent = exhibition.title;

  const venue = document.createElement("div");
  venue.className = "exhibition-venue";
  venue.textContent = exhibition.venue;

  text.appendChild(title);
  text.appendChild(venue);

  const date = document.createElement("div");
  date.className = "exhibition-date";

  if (exhibition.status === "current") {
    date.textContent = `Jusqu'au ${formatDate(exhibition.end)}`;
  } else {
    date.textContent = `À partir du ${formatDate(exhibition.start)}`;
  }

  article.appendChild(text);
  article.appendChild(date);

  article.addEventListener("click", () => {
    openDetail(exhibition);
  });

  article.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openDetail(exhibition);
    }
  });

  return article;
}


function renderList(listElement, items) {
  listElement.innerHTML = "";

  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "Aucune exposition";
    listElement.appendChild(empty);
    return;
  }

  items.forEach((exhibition) => {
    listElement.appendChild(
      createExhibitionElement(exhibition)
    );
  });
}


/* -------------------------
   DETAIL
------------------------- */

function openDetail(exhibition) {
  detailContent.innerHTML = "";

  const title = document.createElement("h1");
  title.className = "detail-title";
  title.textContent = exhibition.title;

  const meta = document.createElement("div");
  meta.className = "detail-meta";

  const venue = document.createElement("div");
  venue.textContent = exhibition.venue;

  const dates = document.createElement("div");
  dates.textContent =
    `${formatDate(exhibition.start)} → ${formatDate(exhibition.end)}`;

  meta.appendChild(venue);
  meta.appendChild(dates);

  detailContent.appendChild(title);
  detailContent.appendChild(meta);

  if (exhibition.description) {
    const description = document.createElement("div");
    description.className = "detail-description";
    description.textContent = exhibition.description;

    detailContent.appendChild(description);
  }

  if (exhibition.url) {
    const source = document.createElement("a");
    source.className = "detail-source";
    source.href = exhibition.url;
    source.target = "_blank";
    source.rel = "noopener noreferrer";
    source.textContent = "Voir la source";

    detailContent.appendChild(source);
  }

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
  if (event.key === "Escape" && detail.classList.contains("open")) {
    closeDetail();
  }
});


/* -------------------------
   NAVIGATION
------------------------- */

const sectionLinks = document.querySelectorAll(".section-link");

sectionLinks.forEach((link) => {
  link.addEventListener("click", () => {
    sectionLinks.forEach((item) => {
      item.classList.remove("active");
    });

    link.classList.add("active");
  });
});


/* -------------------------
   LOAD DATA
------------------------- */

async function loadExhibitions() {
  try {
    const response = await fetch("exhibitions.json", {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    /*
     * exhibitions.json peut être :
     * - directement un tableau
     * - un objet contenant le tableau dans "exhibitions"
     */
    if (Array.isArray(data)) {
      exhibitions = data;
    } else if (Array.isArray(data.exhibitions)) {
      exhibitions = data.exhibitions;
    } else {
      throw new Error("Format inattendu de exhibitions.json");
    }

    const current = exhibitions.filter(
      (exhibition) => exhibition.status === "current"
    );

    const upcoming = exhibitions.filter(
      (exhibition) => exhibition.status === "upcoming"
    );

    renderList(currentList, current);
    renderList(upcomingList, upcoming);

  } catch (error) {
    console.error("Impossible de charger les expositions :", error);

    currentList.innerHTML =
      '<p class="empty">Impossible de charger les expositions.</p>';

    upcomingList.innerHTML = "";
  }
}


loadExhibitions();
