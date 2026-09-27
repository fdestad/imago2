let exhibitions = [];
let favorites = new Set();

const maintenantHeading = document.getElementById("maintenant-heading");
const bientotHeading = document.getElementById("bientot-heading");

const maintenantButton = document.getElementById("maintenant-button");
const bientotButton = document.getElementById("bientot-button");

const currentList = document.getElementById("current-list");
const upcomingList = document.getElementById("upcoming-list");

const detailView = document.getElementById("detail-view");
const detailClose = document.getElementById("detail-close");
const detailVenue = document.getElementById("detail-venue");
const detailTitle = document.getElementById("detail-title");
const detailDate = document.getElementById("detail-date");
const detailDescription = document.getElementById("detail-description");
const detailSource = document.getElementById("detail-source");

let currentSectionTop = 0;
let upcomingSectionTop = 0;


/* --------------------------------------------------
   FAVORITES
-------------------------------------------------- */

function loadFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem("imago-favorites") || "[]");
    favorites = new Set(saved);
  } catch {
    favorites = new Set();
  }
}

function saveFavorites() {
  localStorage.setItem(
    "imago-favorites",
    JSON.stringify([...favorites])
  );
}

function getFavoriteId(exhibition) {
  return [
    exhibition.title,
    exhibition.venue,
    exhibition.start,
    exhibition.end
  ].join("|");
}


/* --------------------------------------------------
   DATA
-------------------------------------------------- */

async function loadData() {
  try {
    const response = await fetch("exhibitions.json", {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("Impossible de charger exhibitions.json");
    }

    const data = await response.json();

    exhibitions = [
      ...(data.current || []),
      ...(data.upcoming || [])
    ];

    renderList(
      data.current || [],
      currentList
    );

    renderList(
      data.upcoming || [],
      upcomingList
    );

    /*
      We measure after rendering because the actual height
      of the current section determines when the transition
      to BIENTÔT happens.
    */
    requestAnimationFrame(() => {
      measureSections();
      updateLayout();
    });

  } catch (error) {
    console.error(error);

    currentList.innerHTML = `
      <div class="exhibition">
        <p class="exhibition-title">
          Impossible de charger les expositions.
        </p>
      </div>
    `;

    upcomingList.innerHTML = "";
  }
}


/* --------------------------------------------------
   RENDERING
-------------------------------------------------- */

function renderList(list, container) {
  container.innerHTML = "";

  list.forEach((exhibition) => {
    const element = createExhibitionElement(exhibition);
    container.appendChild(element);
  });
}

function createExhibitionElement(exhibition) {
  const element = document.createElement("article");

  element.className = "exhibition";

  const favoriteId = getFavoriteId(exhibition);

  if (favorites.has(favoriteId)) {
    element.classList.add("is-favorite");
  }

  const title = document.createElement("h2");
  title.className = "exhibition-title";
  title.textContent = exhibition.title;

  const venue = document.createElement("div");
  venue.className = "exhibition-venue";
  venue.textContent = exhibition.venue;

  const date = document.createElement("div");
  date.className = "exhibition-date";

  if (exhibition.status === "current") {
    date.textContent = `JUSQU'AU ${formatDate(exhibition.end)}`;
  } else {
    date.textContent = `À PARTIR DU ${formatDate(exhibition.start)}`;
  }

  element.appendChild(title);
  element.appendChild(venue);
  element.appendChild(date);

  /*
    Opening the detail view must not interfere with
    the horizontal swipe gesture.
  */
  element.addEventListener("click", () => {
    if (!element.dataset.wasSwiping) {
      openDetail(exhibition);
    }

    delete element.dataset.wasSwiping;
  });

  setupSwipe(element, exhibition);

  return element;
}

function formatDate(dateString) {
  const date = new Date(`${dateString}T12:00:00`);

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}


/* --------------------------------------------------
   SWIPE TO FAVORITE
   KEEP THIS BEHAVIOR INTACT
-------------------------------------------------- */

function setupSwipe(element, exhibition) {
  let startX = 0;
  let startY = 0;

  let currentX = 0;

  let dragging = false;
  let swiping = false;

  const threshold = 70;

  element.addEventListener("pointerdown", (event) => {
    /*
      Only the primary pointer is relevant.
    */
    if (event.pointerType !== "touch" && event.pointerType !== "pen") {
      return;
    }

    startX = event.clientX;
    startY = event.clientY;

    currentX = 0;
    dragging = true;
    swiping = false;

    element.dataset.wasSwiping = "false";
  });

  element.addEventListener("pointermove", (event) => {
    if (!dragging) {
      return;
    }

    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;

    /*
      If the gesture is clearly vertical, let the browser
      handle normal page scrolling.
    */
    if (!swiping && Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 8) {
      dragging = false;
      element.style.transform = "";
      return;
    }

    /*
      We only allow a rightward swipe.
    */
    if (deltaX <= 0) {
      return;
    }

    if (deltaX > 8) {
      swiping = true;
      element.classList.add("is-swiping");
    }

    currentX = deltaX;

    /*
      Slight resistance makes the gesture feel natural.
    */
    const translatedX = Math.min(currentX * 0.9, 120);

    element.style.transform = `translateX(${translatedX}px)`;
  });

  element.addEventListener("pointerup", () => {
    if (!dragging) {
      return;
    }

    dragging = false;

    if (swiping) {
      element.dataset.wasSwiping = "true";

      if (currentX >= threshold) {
        const favoriteId = getFavoriteId(exhibition);

        if (favorites.has(favoriteId)) {
          favorites.delete(favoriteId);
          element.classList.remove("is-favorite");
        } else {
          favorites.add(favoriteId);
          element.classList.add("is-favorite");
        }

        saveFavorites();
      }
    }

    /*
      Return to the original position.
    */
    element.style.transform = "";

    /*
      Wait for the transition before allowing a click
      to be interpreted as a normal tap.
    */
    setTimeout(() => {
      element.classList.remove("is-swiping");
    }, 20);
  });

  element.addEventListener("pointercancel", () => {
    dragging = false;
    swiping = false;

    element.style.transform = "";
    element.classList.remove("is-swiping");
  });
}


/* --------------------------------------------------
   DETAIL
-------------------------------------------------- */

function openDetail(exhibition) {
  detailVenue.textContent = exhibition.venue;
  detailTitle.textContent = exhibition.title;

  if (exhibition.status === "current") {
    detailDate.textContent =
      `JUSQU'AU ${formatDate(exhibition.end)}`;
  } else {
    detailDate.textContent =
      `À PARTIR DU ${formatDate(exhibition.start)}`;
  }

  detailDescription.textContent =
    exhibition.description || "";

  detailSource.href = exhibition.url;

  detailView.classList.add("is-open");
  detailView.setAttribute("aria-hidden", "false");

  document.body.style.overflow = "hidden";
}

function closeDetail() {
  detailView.classList.remove("is-open");
  detailView.setAttribute("aria-hidden", "true");

  document.body.style.overflow = "";
}

detailClose.addEventListener("click", closeDetail);

detailView.addEventListener("click", (event) => {
  if (event.target === detailView) {
    closeDetail();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeDetail();
  }
});


/* --------------------------------------------------
   TWO-HEADER SCROLL LOGIC
-------------------------------------------------- */

/*
  The key idea:

  MAINTENANT is permanently fixed at the top.

  BIENTÔT is permanently fixed at the bottom while
  the user is inside the MAINTENANT section.

  Once the user reaches the end of the current exhibitions,
  the normal document position of BIENTÔT becomes visible
  immediately below MAINTENANT.

  Clicking BIENTÔT simply scrolls to that transition point.
*/

function measureSections() {
  /*
    The current section starts immediately after the
    MAINTENANT header.

    The upcoming section's natural position tells us
    where the second state begins.
  */

  const currentRect = document
    .getElementById("current-section")
    .getBoundingClientRect();

  const upcomingRect = document
    .getElementById("upcoming-section")
    .getBoundingClientRect();

  currentSectionTop =
    currentRect.top + window.scrollY;

  upcomingSectionTop =
    upcomingRect.top + window.scrollY;
}


/*
  When the user reaches the beginning of the upcoming
  section, we want:

      MAINTENANT
      BIENTÔT
      upcoming exhibitions

  rather than BIENTÔT remaining at the bottom.
*/
function updateLayout() {
  const viewportHeight = window.innerHeight;

  const upcomingHeadingHeight =
    bientotHeading.offsetHeight;

  /*
    The natural beginning of the upcoming section is
    immediately below the BIENTÔT heading.

    We transition when the bottom-fixed BIENTÔT would
    otherwise collide with its natural document position.
  */
  const transitionPoint =
    upcomingSectionTop -
    viewportHeight +
    upcomingHeadingHeight;

  if (window.scrollY >= transitionPoint) {
    enterUpcomingState();
  } else {
    enterCurrentState();
  }
}

function enterCurrentState() {
  maintenantHeading.classList.add("is-current-fixed");
  bientotHeading.classList.remove("is-transitioned");
}

function enterUpcomingState() {
  maintenantHeading.classList.add("is-current-fixed");
  bientotHeading.classList.add("is-transitioned");
}


/* --------------------------------------------------
   NAVIGATION
-------------------------------------------------- */

maintenantButton.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
});

bientotButton.addEventListener("click", () => {
  /*
    Place the upcoming section directly underneath
    the MAINTENANT header.
  */

  const target =
    upcomingSectionTop -
    maintenantHeading.offsetHeight;

  window.scrollTo({
    top: Math.max(0, target),
    behavior: "smooth"
  });
});


/* --------------------------------------------------
   SCROLL
-------------------------------------------------- */

let scrollTicking = false;

window.addEventListener("scroll", () => {
  if (scrollTicking) {
    return;
  }

  scrollTicking = true;

  requestAnimationFrame(() => {
    updateLayout();
    scrollTicking = false;
  });
});


/* --------------------------------------------------
   RESIZE
-------------------------------------------------- */

window.addEventListener("resize", () => {
  measureSections();
  updateLayout();
});


/* --------------------------------------------------
   INIT
-------------------------------------------------- */

loadFavorites();
loadData();
