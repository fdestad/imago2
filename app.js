const currentList =
  document.getElementById("current-list");

const upcomingList =
  document.getElementById("upcoming-list");


const maintenantHeading =
  document.getElementById(
    "maintenant-heading"
  );

const bientotHeading =
  document.getElementById(
    "bientot-heading"
  );


const detail =
  document.getElementById("detail");

const detailContent =
  document.getElementById(
    "detail-content"
  );

const detailClose =
  document.getElementById(
    "detail-close"
  );


let exhibitions = [];


const FAVORITES_KEY =
  "imago2-favorites";


/* ==================================================
   DATE
   ================================================== */

function formatDate(dateString) {

  if (!dateString) {
    return "";
  }

  const date =
    new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString(
    "fr-FR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }
  );
}


/* ==================================================
   FAVORITES
   ================================================== */

function getFavorites() {

  try {

    return JSON.parse(
      localStorage.getItem(
        FAVORITES_KEY
      )
    ) || [];

  } catch {

    return [];

  }
}


function saveFavorites(favorites) {

  localStorage.setItem(
    FAVORITES_KEY,
    JSON.stringify(favorites)
  );

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

  return getFavorites().includes(
    getExhibitionId(exhibition)
  );

}


function toggleFavorite(
  exhibition,
  element
) {

  const id =
    getExhibitionId(exhibition);

  const favorites =
    getFavorites();

  const index =
    favorites.indexOf(id);


  if (index === -1) {

    favorites.push(id);

  } else {

    favorites.splice(index, 1);

  }


  saveFavorites(favorites);


  element.classList.toggle(
    "favorite",
    index === -1
  );

}


/* ==================================================
   STICKY SECTION HEADERS
   ================================================== */

function updateStickyHeaders() {

  /*
    On utilise la position réelle des éléments
    dans le document plutôt que getBoundingClientRect()
    pour éviter les problèmes lorsque l'un des
    headers devient fixed.
  */

  const maintenantOffset =
    maintenantHeading.dataset.offset
      ? Number(
          maintenantHeading.dataset.offset
        )
      : maintenantHeading.offsetTop;


  const bientotOffset =
    bientotHeading.dataset.offset
      ? Number(
          bientotHeading.dataset.offset
        )
      : bientotHeading.offsetTop;


  const headerHeight =
    maintenantHeading.offsetHeight;


  /*
    MAINTENANT
  */

  if (
    window.scrollY >=
    maintenantOffset
  ) {

    maintenantHeading.classList.add(
      "is-fixed"
    );

  } else {

    maintenantHeading.classList.remove(
      "is-fixed"
    );

  }


  /*
    BIENTÔT.
    Il devient fixe lorsqu'il atteint
    le dessous de MAINTENANT.
  */

  const bientotThreshold =
    bientotOffset - headerHeight;


  if (
    window.scrollY >=
    bientotThreshold
  ) {

    bientotHeading.classList.add(
      "is-fixed"
    );

  } else {

    bientotHeading.classList.remove(
      "is-fixed"
    );

  }

}


/*
  Recalcule les positions naturelles
  des headers.

  On le fait avant d'activer le système
  sticky/fixed.
*/

function measureSectionHeaders() {

  /*
    On retire temporairement les classes fixed
    pour mesurer leur position naturelle.
  */

  maintenantHeading.classList.remove(
    "is-fixed"
  );

  bientotHeading.classList.remove(
    "is-fixed"
  );


  maintenantHeading.dataset.offset =
    maintenantHeading.offsetTop;


  bientotHeading.dataset.offset =
    bientotHeading.offsetTop;


  updateStickyHeaders();

}


window.addEventListener(
  "scroll",
  updateStickyHeaders,
  {
    passive: true
  }
);


window.addEventListener(
  "resize",
  measureSectionHeaders
);


/* ==================================================
   SECTION HEADER NAVIGATION
   ================================================== */

function goToMaintenant() {

  const target =
    Number(
      maintenantHeading.dataset.offset
    );


  window.scrollTo({

    top: target,

    behavior: "smooth"

  });

}


function goToBientot() {

  const bientotOffset =
    Number(
      bientotHeading.dataset.offset
    );


  const headerHeight =
    maintenantHeading.offsetHeight;


  const target =
    bientotOffset - headerHeight;


  window.scrollTo({

    top: target,

    behavior: "smooth"

  });

}


maintenantHeading.addEventListener(
  "click",
  goToMaintenant
);


bientotHeading.addEventListener(
  "click",
  goToBientot
);


/* ==================================================
   KEYBOARD ACCESSIBILITY
   ================================================== */

maintenantHeading.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key === "Enter" ||
      event.key === " "
    ) {

      event.preventDefault();

      goToMaintenant();

    }

  }
);


bientotHeading.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key === "Enter" ||
      event.key === " "
    ) {

      event.preventDefault();

      goToBientot();

    }

  }
);


/* ==================================================
   EXHIBITION ELEMENT
   ================================================== */

function createExhibitionElement(
  exhibition
) {

  const element =
    document.createElement("article");


  element.className =
    "exhibition";


  if (
    isFavorite(exhibition)
  ) {

    element.classList.add(
      "favorite"
    );

  }


  /* ----------------------------------------------
     TEXT
     ---------------------------------------------- */

  const information =
    document.createElement("div");


  const title =
    document.createElement("h3");


  title.className =
    "exhibition-title";


  title.textContent =
    exhibition.title;


  const venue =
    document.createElement("div");


  venue.className =
    "exhibition-venue";


  venue.textContent =
    exhibition.venue;


  information.appendChild(title);

  information.appendChild(venue);


  /* ----------------------------------------------
     DATE
     ---------------------------------------------- */

  const date =
    document.createElement("div");


  date.className =
    "exhibition-date";


  if (
    exhibition.status === "upcoming"
  ) {

    date.textContent =
      `À partir du ${formatDate(
        exhibition.start
      )}`;

  } else {

    date.textContent =
      `Jusqu'au ${formatDate(
        exhibition.end
      )}`;

  }


  element.appendChild(
    information
  );

  element.appendChild(
    date
  );


  /* ==================================================
     SWIPE
     ================================================== */

  let startX = 0;
  let startY = 0;

  let currentX = 0;

  let dragging = false;
  let horizontalSwipe = false;

  let suppressClick = false;


  element.addEventListener(
    "touchstart",
    (event) => {

      if (
        event.touches.length !== 1
      ) {
        return;
      }


      startX =
        event.touches[0].clientX;

      startY =
        event.touches[0].clientY;


      currentX = 0;

      dragging = true;

      horizontalSwipe = false;

      suppressClick = false;

    },
    {
      passive: true
    }
  );


  element.addEventListener(
    "touchmove",
    (event) => {

      if (!dragging) {
        return;
      }


      const touch =
        event.touches[0];


      const deltaX =
        touch.clientX - startX;


      const deltaY =
        touch.clientY - startY;


      /*
        On attend que le geste soit suffisamment
        marqué pour déterminer sa direction.
      */

      if (
        !horizontalSwipe
      ) {

        if (
          Math.abs(deltaX) < 10
        ) {
          return;
        }


        /*
          Si le mouvement est surtout vertical,
          on laisse le navigateur faire défiler.
        */

        if (
          Math.abs(deltaY) >
          Math.abs(deltaX)
        ) {

          return;

        }


        horizontalSwipe = true;

        element.classList.add(
          "swiping"
        );

      }


      if (
        !horizontalSwipe
      ) {
        return;
      }


      /*
        Seulement vers la droite.
      */

      currentX =
        Math.max(
          0,
          deltaX
        );


      const movement =
        Math.min(
          currentX,
          120
        );


      element.style.transform =
        `translate3d(${movement}px, 0, 0)`;

    },
    {
      passive: true
    }
  );


  element.addEventListener(
    "touchend",
    () => {

      if (!dragging) {
        return;
      }


      dragging = false;


      /*
        70 px vers la droite =
        favori.
      */

      if (
        horizontalSwipe &&
        currentX >= 70
      ) {

        toggleFavorite(
          exhibition,
          element
        );


        suppressClick = true;

      }


      element.classList.remove(
        "swiping"
      );


      element.style.transform =
        "";


      currentX = 0;

      horizontalSwipe = false;

    },
    {
      passive: true
    }
  );


  element.addEventListener(
    "touchcancel",
    () => {

      dragging = false;

      horizontalSwipe = false;

      currentX = 0;


      element.classList.remove(
        "swiping"
      );


      element.style.transform =
        "";

    },
    {
      passive: true
    }
  );


  /* ==================================================
     CLICK → DETAIL
     ================================================== */

  element.addEventListener(
    "click",
    () => {

      if (suppressClick) {

        suppressClick = false;

        return;

      }


      openDetail(exhibition);

    }
  );


  return element;
}


/* ==================================================
   RENDER
   ================================================== */

function renderList(
  container,
  items
) {

  container.innerHTML = "";


  if (!items.length) {

    const empty =
      document.createElement("p");


    empty.className =
      "empty";


    empty.textContent =
      "Aucune exposition";


    container.appendChild(
      empty
    );


    return;

  }


  items.forEach(
    (exhibition) => {

      container.appendChild(
        createExhibitionElement(
          exhibition
        )
      );

    }
  );

}


/* ==================================================
   DETAIL
   ================================================== */

function openDetail(
  exhibition
) {

  detailContent.innerHTML = "";


  const title =
    document.createElement("h1");


  title.className =
    "detail-title";


  title.textContent =
    exhibition.title;


  const meta =
    document.createElement("div");


  meta.className =
    "detail-meta";


  if (
    exhibition.status === "upcoming"
  ) {

    meta.textContent =
      `${exhibition.venue} · À partir du ${formatDate(
        exhibition.start
      )}`;

  } else {

    meta.textContent =
      `${exhibition.venue} · Jusqu'au ${formatDate(
        exhibition.end
      )}`;

  }


  const description =
    document.createElement("p");


  description.className =
    "detail-description";


  description.textContent =
    exhibition.description ||
    "Description non disponible.";


  const source =
    document.createElement("a");


  source.className =
    "detail-source";


  source.href =
    exhibition.url;


  source.target =
    "_blank";


  source.rel =
    "noopener noreferrer";


  source.textContent =
    "Voir la source";


  detailContent.appendChild(
    title
  );

  detailContent.appendChild(
    meta
  );

  detailContent.appendChild(
    description
  );

  detailContent.appendChild(
    source
  );


  detail.classList.add(
    "open"
  );


  detail.setAttribute(
    "aria-hidden",
    "false"
  );


  document.body.style.overflow =
    "hidden";

}


function closeDetail() {

  detail.classList.remove(
    "open"
  );


  detail.setAttribute(
    "aria-hidden",
    "true"
  );


  document.body.style.overflow =
    "";

}


detailClose.addEventListener(
  "click",
  closeDetail
);


detail.addEventListener(
  "click",
  (event) => {

    if (
      event.target === detail
    ) {

      closeDetail();

    }

  }
);


document.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key === "Escape"
    ) {

      closeDetail();

    }

  }
);


/* ==================================================
   LOAD DATA
   ================================================== */

async function loadExhibitions() {

  try {

    const response =
      await fetch(
        "exhibitions.json",
        {
          cache: "no-store"
        }
      );


    if (!response.ok) {

      throw new Error(
        "Impossible de charger les données."
      );

    }


    const data =
      await response.json();


    exhibitions = [

      ...(data.current || []),

      ...(data.upcoming || [])

    ];


    const current =
      data.current || [];


    const upcoming =
      data.upcoming || [];


    renderList(
      currentList,
      current
    );


    renderList(
      upcomingList,
      upcoming
    );


    /*
      Les listes sont maintenant rendues,
      donc les positions naturelles des headers
      peuvent être mesurées correctement.
    */

    requestAnimationFrame(
      measureSectionHeaders
    );


  } catch (error) {

    console.error(error);


    currentList.innerHTML =
      '<p class="empty">Données indisponibles.</p>';


    upcomingList.innerHTML =
      '<p class="empty">Données indisponibles.</p>';

  }

}

loadExhibitions();
