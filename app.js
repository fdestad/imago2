const homePage =
  document.getElementById("home-page");

const venuesPage =
  document.getElementById("venues-page");

const venueDetailPage =
  document.getElementById("venue-detail-page");


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


const venuesMarquee =
  document.getElementById(
    "venues-marquee"
  );


const venueDetailBack =
  document.getElementById(
    "venue-detail-back"
  );

const venueDetailTitle =
  document.getElementById(
    "venue-detail-title"
  );

const venueDetailList =
  document.getElementById(
    "venue-detail-list"
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

let venues = {};

let currentPage = "home";

let currentVenue = null;


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
    new Date(
      `${dateString}T00:00:00`
    );

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


function saveFavorites(
  favorites
) {

  localStorage.setItem(
    FAVORITES_KEY,
    JSON.stringify(favorites)
  );

}


function getExhibitionId(
  exhibition
) {

  return [
    exhibition.title,
    exhibition.venue,
    exhibition.start || "",
    exhibition.end || ""
  ].join("|");

}


function isFavorite(
  exhibition
) {

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

    favorites.splice(
      index,
      1
    );

  }


  saveFavorites(
    favorites
  );


  element.classList.toggle(
    "favorite",
    index === -1
  );

}


/* ==================================================
   STICKY SECTION HEADERS
   ================================================== */

function updateStickyHeaders() {

  if (
    currentPage !== "home"
  ) {
    return;
  }


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


  const bientotThreshold =
    bientotOffset -
    headerHeight;


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


function measureSectionHeaders() {

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
  () => {

    measureSectionHeaders();

    if (
      currentPage === "venues"
    ) {

      rebuildVenueMarquee();

    }

  }
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
    bientotOffset -
    headerHeight;


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


  information.appendChild(
    title
  );

  information.appendChild(
    venue
  );


  /* ----------------------------------------------
     DATE
     ---------------------------------------------- */

  const date =
    document.createElement("div");


  date.className =
    "exhibition-date";


  if (
    exhibition.status ===
    "upcoming"
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
     EXHIBITION SWIPE
     DROITE = FAVORI
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
        touch.clientX -
        startX;


      const deltaY =
        touch.clientY -
        startY;


      if (
        !horizontalSwipe
      ) {

        if (
          Math.abs(deltaX) < 10
        ) {
          return;
        }


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
        Seul le mouvement vers la droite
        est utilisé pour le favori.
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


      openDetail(
        exhibition
      );

    }
  );


  return element;

}


/* ==================================================
   RENDER LIST
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
   VENUE SORTING
   ================================================== */

function getVenueExhibitions(
  venueName
) {

  return exhibitions
    .filter(
      (exhibition) =>
        exhibition.venue === venueName
    )
    .sort(
      (a, b) => {

        /*
          Les expositions actuellement ouvertes
          apparaissent avant les futures.
        */

        if (
          a.status !== b.status
        ) {

          return a.status === "current"
            ? -1
            : 1;

        }


        if (
          a.status === "current"
        ) {

          return String(
            a.end || ""
          ).localeCompare(
            String(
              b.end || ""
            )
          );

        }


        return String(
          a.start || ""
        ).localeCompare(
          String(
            b.start || ""
          )
        );

      }
    );

}


/* ==================================================
   VENUE DETAIL
   ================================================== */

function openVenue(
  venueName
) {

  currentVenue =
    venueName;


  venueDetailTitle.textContent =
    venueName;


  const items =
    getVenueExhibitions(
      venueName
    );


  renderList(
    venueDetailList,
    items
  );


  showPage(
    "venue-detail"
  );


  window.scrollTo({
    top: 0,
    behavior: "auto"
  });

}


function closeVenue() {

  currentVenue = null;

  showPage(
    "venues"
  );

}


venueDetailBack.addEventListener(
  "click",
  closeVenue
);


/* ==================================================
   VENUE MARQUEE
   ================================================== */

const marqueeRows = [];

let venueNames = [];


/*
  Nombre de lignes souhaité.
  Sur petit écran 9-10 lignes donnent
  un mur dense sans écraser l'écran.
*/

const MARQUEE_ROW_COUNT = 10;


/*
  Vitesses en pixels/seconde.

  Elles sont volontairement différentes
  pour éviter un mouvement mécanique.
*/

const MARQUEE_SPEEDS = [
  30,
  39,
  27,
  44,
  34,
  25,
  42,
  31,
  37,
  28
];


function createVenueItem(
  venueName
) {

  const item =
    document.createElement("button");


  item.type =
    "button";


  item.className =
    "venue-marquee-item";


  item.textContent =
    venueName;


  item.setAttribute(
    "aria-label",
    `Voir les expositions à ${venueName}`
  );


  item.addEventListener(
    "click",
    (event) => {

      /*
        Si l'utilisateur vient de faire
        glisser la ligne, le click sera
        neutralisé par la ligne.
      */

      const row =
        event.currentTarget.closest(
          ".venue-marquee-row"
        );


      if (
        row?.dataset.dragged === "true"
      ) {

        row.dataset.dragged =
          "false";

        return;

      }


      openVenue(
        venueName
      );

    }
  );


  return item;

}


/*
  Pour chaque ligne, on crée une séquence
  suffisamment longue puis on la duplique.

  Le doublage permet une boucle parfaitement
  continue.
*/

function buildMarqueeRow(
  rowIndex
) {

  const row =
    document.createElement("div");


  row.className =
    "venue-marquee-row";


  row.dataset.rowIndex =
    String(rowIndex);


  const track =
    document.createElement("div");


  track.className =
    "venue-marquee-track";


  /*
    On décale l'ordre des lieux d'une ligne
    à l'autre afin d'éviter un effet de tableau
    parfaitement aligné.
  */

  const offset =
    rowIndex %
    venueNames.length;


  const sequence = [
    ...venueNames.slice(offset),
    ...venueNames.slice(0, offset)
  ];


  /*
    Trois répétitions donnent suffisamment
    de matière pour les écrans larges.
  */

  for (
    let repetition = 0;
    repetition < 3;
    repetition++
  ) {

    sequence.forEach(
      (venueName) => {

        track.appendChild(
          createVenueItem(
            venueName
          )
        );

      }
    );

  }


  row.appendChild(
    track
  );

  venuesMarquee.appendChild(
    row
  );


  const state = {

    row,
    track,

    position: 0,

    speed:
      MARQUEE_SPEEDS[
        rowIndex %
        MARQUEE_SPEEDS.length
      ],

    cycleWidth: 0,

    dragging: false,

    dragStartX: 0,

    dragStartPosition: 0,

    moved: false,

    pointerId: null,

    lastTime: performance.now()

  };


  marqueeRows.push(
    state
  );


  /*
    Une ligne sur deux part dans l'autre sens.
  */

  if (
    rowIndex % 2 === 1
  ) {

    state.speed *= -1;

  }


  setupMarqueeTouch(
    state
  );


  return state;

}


/*
  Mesure la largeur d'une répétition.
*/

function measureMarqueeRow(
  state
) {

  const children =
    Array.from(
      state.track.children
    );


  if (
    !children.length
  ) {
    return;
  }


  const totalItems =
    children.length;


  const itemsPerSequence =
    venueNames.length;


  if (
    totalItems <
    itemsPerSequence * 2
  ) {
    return;
  }


  const first =
    children[0];

  const repeated =
    children[
      itemsPerSequence
    ];


  /*
    Les deux éléments correspondants
    sont séparés exactement par la largeur
    d'une séquence complète.
  */

  const cycleWidth =
    repeated.offsetLeft -
    first.offsetLeft;


  if (
    cycleWidth > 0
  ) {

    state.cycleWidth =
      cycleWidth;

  }

}


/*
  Ramène une position dans la zone
  [-cycleWidth, 0].

  Cela permet de tourner indéfiniment
  sans laisser le nombre devenir énorme.
*/

function normalizePosition(
  position,
  cycleWidth
) {

  if (
    !cycleWidth
  ) {
    return position;
  }


  while (
    position > 0
  ) {

    position -=
      cycleWidth;

  }


  while (
    position <=
    -cycleWidth
  ) {

    position +=
      cycleWidth;

  }


  return position;

}


/*
  Applique la position réelle au track.
*/

function renderMarqueeRow(
  state
) {

  state.position =
    normalizePosition(
      state.position,
      state.cycleWidth
    );


  state.track.style.transform =
    `translate3d(${state.position}px, 0, 0)`;

}


/* ==================================================
   MARQUEE TOUCH
   ================================================== */

function setupMarqueeTouch(
  state
) {

  const row =
    state.row;


  let startY = 0;

  let horizontal =
    false;

  let touchActive =
    false;


  row.addEventListener(
    "touchstart",
    (event) => {

      if (
        event.touches.length !== 1
      ) {
        return;
      }


      const touch =
        event.touches[0];


      state.dragging =
        true;


      state.moved =
        false;


      state.dragStartX =
        touch.clientX;


      state.dragStartPosition =
        state.position;


      startY =
        touch.clientY;


      horizontal =
        false;


      touchActive =
        true;


      row.dataset.dragged =
        "false";


      row.classList.add(
        "is-dragging"
      );

    },
    {
      passive: true
    }
  );


  row.addEventListener(
    "touchmove",
    (event) => {

      if (
        !state.dragging ||
        !touchActive
      ) {
        return;
      }


      const touch =
        event.touches[0];


      const dx =
        touch.clientX -
        state.dragStartX;


      const dy =
        touch.clientY -
        startY;


      /*
        On attend quelques pixels avant
        de décider que le geste est horizontal.
      */

      if (
        !horizontal &&
        Math.abs(dx) < 8
      ) {
        return;
      }


      if (
        !horizontal
      ) {

        /*
          Si le geste est vertical,
          on rend immédiatement la main
          au scroll de la page.
        */

        if (
          Math.abs(dy) >
          Math.abs(dx)
        ) {

          state.dragging =
            false;

          row.classList.remove(
            "is-dragging"
          );

          return;

        }


        horizontal =
          true;

        state.moved =
          true;

        row.dataset.dragged =
          "true";

      }


      if (
        !horizontal
      ) {
        return;
      }


      /*
        À partir du moment où le geste est
        clairement horizontal, cette ligne
        prend le contrôle du toucher.

        Cela empêche le swipe global
        de changer de page.
      */

      event.preventDefault();


      state.position =
        state.dragStartPosition +
        dx;


      renderMarqueeRow(
        state
      );

    },
    {
      passive: false
    }
  );


  row.addEventListener(
    "touchend",
    () => {

      if (
        !touchActive
      ) {
        return;
      }


      touchActive =
        false;


      state.dragging =
        false;


      row.classList.remove(
        "is-dragging"
      );


      /*
        Un vrai drag est marqué pendant
        quelques instants afin que le click
        sur le bouton ne soit pas interprété
        comme une sélection.
      */

      if (
        state.moved
      ) {

        row.dataset.dragged =
          "true";


        window.setTimeout(
          () => {

            row.dataset.dragged =
              "false";

          },
          80
        );

      }

    },
    {
      passive: true
    }
  );


  row.addEventListener(
    "touchcancel",
    () => {

      touchActive =
        false;

      state.dragging =
        false;

      state.moved =
        false;

      row.classList.remove(
        "is-dragging"
      );

      row.dataset.dragged =
        "false";

    },
    {
      passive: true
    }
  );

}


/* ==================================================
   MARQUEE BUILD
   ================================================== */

function rebuildVenueMarquee() {

  marqueeRows.length =
    0;


  venuesMarquee.innerHTML =
    "";


  if (
    !venueNames.length
  ) {
    return;
  }


  for (
    let index = 0;
    index < MARQUEE_ROW_COUNT;
    index++
  ) {

    buildMarqueeRow(
      index
    );

  }


  /*
    Les éléments doivent être rendus
    avant de mesurer leurs dimensions.
  */

  requestAnimationFrame(
    () => {

      marqueeRows.forEach(
        (state) => {

          measureMarqueeRow(
            state
          );


          /*
            Les lignes commencent avec
            des positions légèrement différentes.
          */

          state.position =
            -(
              state.cycleWidth *
              (
                0.12 +
                (
                  state.row.dataset.rowIndex *
                  0.037
                )
              )
            );


          renderMarqueeRow(
            state
          );

        }
      );

    }
  );

}


/* ==================================================
   MARQUEE ANIMATION LOOP
   ================================================== */

let marqueeAnimationFrame =
  null;


function animateMarquee(
  timestamp
) {

  marqueeRows.forEach(
    (state) => {

      /*
        Une ligne touchée est complètement
        contrôlée par l'utilisateur.
      */

      if (
        state.dragging
      ) {

        state.lastTime =
          timestamp;

        return;

      }


      const elapsed =
        Math.min(
          timestamp -
          state.lastTime,
          50
        );


      state.lastTime =
        timestamp;


      /*
        Respect de prefers-reduced-motion.
        Dans ce cas, les lignes restent fixes.
      */

      const reducedMotion =
        window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches;


      if (
        !reducedMotion
      ) {

        state.position +=
          (
            state.speed *
            elapsed
          ) / 1000;


        renderMarqueeRow(
          state
        );

      }

    }
  );


  marqueeAnimationFrame =
    requestAnimationFrame(
      animateMarquee
    );

}


function startMarqueeAnimation() {

  if (
    marqueeAnimationFrame
  ) {
    cancelAnimationFrame(
      marqueeAnimationFrame
    );
  }


  marqueeAnimationFrame =
    requestAnimationFrame(
      animateMarquee
    );

}


/* ==================================================
   PAGE NAVIGATION
   ================================================== */

function setPageVisibility(
  page,
  visible
) {

  page.classList.toggle(
    "is-active",
    visible
  );


  page.setAttribute(
    "aria-hidden",
    visible
      ? "false"
      : "true"
  );

}


function showPage(
  pageName
) {

  currentPage =
    pageName;


  setPageVisibility(
    homePage,
    pageName === "home"
  );

  setPageVisibility(
    venuesPage,
    pageName === "venues"
  );

  setPageVisibility(
    venueDetailPage,
    pageName === "venue-detail"
  );


  if (
    pageName === "home"
  ) {

    document.body.style.overflow =
      "";

    /*
      On revient à la position précédente
      de la page Home.
    */

    requestAnimationFrame(
      () => {

        measureSectionHeaders();

      }
    );

  } else if (
    pageName === "venues"
  ) {

    document.body.style.overflow =
      "hidden";


    if (
      !marqueeRows.length
    ) {

      rebuildVenueMarquee();

    }

  } else if (
    pageName === "venue-detail"
  ) {

    document.body.style.overflow =
      "";

  }

}


/*
  Navigation demandée :

  HOME
    ←
  VENUES
    ←
  HOME
    ←
  VENUES
    ...

  Le geste droit global n'est PAS utilisé
  pour naviguer : il reste réservé au favori
  des expositions.
*/

function navigateLeft() {

  if (
    currentPage === "home"
  ) {

    showPage(
      "venues"
    );

    return;

  }


  if (
    currentPage === "venues"
  ) {

    showPage(
      "home"
    );

    return;

  }


  if (
    currentPage === "venue-detail"
  ) {

    showPage(
      "venues"
    );

  }

}


/* ==================================================
   GLOBAL LEFT SWIPE
   ================================================== */

let globalTouchStartX = 0;
let globalTouchStartY = 0;

let globalTouchActive =
  false;

let globalTouchBlocked =
  false;


document.addEventListener(
  "touchstart",
  (event) => {

    /*
      Une ligne du mur gère elle-même
      son toucher.

      Une exposition gère elle-même
      son swipe droit.

      Le navigateur ne doit donc pas
      utiliser ces gestes pour la navigation
      globale.
    */

    if (
      event.target.closest(
        ".venue-marquee-row"
      )
    ) {

      globalTouchBlocked =
        true;

      return;

    }


    if (
      event.target.closest(
        ".exhibition"
      )
    ) {

      /*
        On laisse l'exposition gérer
        son propre geste.

        Un swipe gauche sur une exposition
        ne déclenche donc PAS le changement
        de page : seule la zone extérieure
        sert à la navigation globale.
      */

      globalTouchBlocked =
        true;

      return;

    }


    globalTouchBlocked =
      false;


    if (
      event.touches.length !== 1
    ) {
      return;
    }


    const touch =
      event.touches[0];


    globalTouchStartX =
      touch.clientX;

    globalTouchStartY =
      touch.clientY;


    globalTouchActive =
      true;

  },
  {
    passive: true
  }
);


document.addEventListener(
  "touchend",
  (event) => {

    if (
      globalTouchBlocked ||
      !globalTouchActive
    ) {

      globalTouchActive =
        false;

      globalTouchBlocked =
        false;

      return;

    }


    const touch =
      event.changedTouches[0];


    const deltaX =
      touch.clientX -
      globalTouchStartX;


    const deltaY =
      touch.clientY -
      globalTouchStartY;


    globalTouchActive =
      false;


    /*
      Navigation uniquement si :

      - geste suffisamment long
      - clairement horizontal
      - vers la gauche
    */

    if (
      deltaX <= -70 &&
      Math.abs(deltaX) >
      Math.abs(deltaY)
    ) {

      navigateLeft();

    }

  },
  {
    passive: true
  }
);


/* ==================================================
   EXHIBITION DETAIL
   ================================================== */

function openDetail(
  exhibition
) {

  detailContent.innerHTML =
    "";


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
    exhibition.status ===
    "upcoming"
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


  const venueInfo =
    venues[
      exhibition.venue
    ];


  /* ----------------------------------------------
     HORAIRES
     ---------------------------------------------- */

  const hours =
    document.createElement("div");


  hours.className =
    "detail-hours";


  hours.textContent =
    venueInfo?.hours || "";


  /* ----------------------------------------------
     DESCRIPTION
     ---------------------------------------------- */

  const description =
    document.createElement("p");


  description.className =
    "detail-description";


  description.textContent =
    exhibition.description ||
    "Description non disponible.";


  /* ----------------------------------------------
     LIENS
     ---------------------------------------------- */

  const links =
    document.createElement("div");


  links.className =
    "detail-links";


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
    "Source";


  const official =
    document.createElement("a");


  official.className =
    "detail-official";


  official.href =
    venueInfo?.official_url ||
    "#";


  official.target =
    "_blank";


  official.rel =
    "noopener noreferrer";


  official.textContent =
    "Site officiel";


  links.appendChild(
    source
  );

  links.appendChild(
    official
  );


  /* ----------------------------------------------
     ORDRE
     ---------------------------------------------- */

  detailContent.appendChild(
    title
  );

  detailContent.appendChild(
    meta
  );


  if (
    venueInfo
  ) {

    detailContent.appendChild(
      hours
    );

  }


  detailContent.appendChild(
    description
  );

  detailContent.appendChild(
    links
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


  /*
    On remet l'overflow correspondant
    à la page actuellement affichée.
  */

  if (
    currentPage === "venues"
  ) {

    document.body.style.overflow =
      "hidden";

  } else {

    document.body.style.overflow =
      "";

  }

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

      if (
        detail.classList.contains(
          "open"
        )
      ) {

        closeDetail();

      }

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


    venues =
      data.venues || {};


    exhibitions = [

      ...(data.current || []),

      ...(data.upcoming || [])

    ];


    venueNames =
      Object.keys(
        venues
      );


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
      Le mur est construit une fois que
      les noms des lieux sont disponibles.
    */

    rebuildVenueMarquee();

    startMarqueeAnimation();


    /*
      Les listes sont maintenant rendues :
      les positions naturelles des headers
      peuvent être mesurées.
    */

    requestAnimationFrame(
      measureSectionHeaders
    );


  } catch (error) {

    console.error(
      error
    );


    currentList.innerHTML =
      '<p class="empty">Données indisponibles.</p>';


    upcomingList.innerHTML =
      '<p class="empty">Données indisponibles.</p>';

  }

}


loadExhibitions();


/* ==================================================
   SERVICE WORKER
   ================================================== */

if (
  "serviceWorker" in navigator
) {

  window.addEventListener(
    "load",
    () => {

      navigator.serviceWorker.register(
        "./sw.js"
      );

    }
  );

}