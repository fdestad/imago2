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
  document.getElementById("maintenant-heading");

const bientotHeading =
  document.getElementById("bientot-heading");

const venuesMarquee =
  document.getElementById("venues-marquee");

const venueDetailTitle =
  document.getElementById("venue-detail-title");

const venueDetailList =
  document.getElementById("venue-detail-list");

const detail =
  document.getElementById("detail");

const detailContent =
  document.getElementById("detail-content");

const detailClose =
  document.getElementById("detail-close");


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
   STICKY HEADERS
   ================================================== */

function updateStickyHeaders() {

  if (currentPage !== "home") {
    return;
  }

  const maintenantOffset =
    maintenantHeading.dataset.offset
      ? Number(maintenantHeading.dataset.offset)
      : maintenantHeading.offsetTop;

  const bientotOffset =
    bientotHeading.dataset.offset
      ? Number(bientotHeading.dataset.offset)
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


/* ==================================================
   RESIZE
   ================================================== */

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
   SECTION NAVIGATION
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

  window.scrollTo({
    top:
      bientotOffset -
      headerHeight,
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
   KEYBOARD
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
   EXHIBITION
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

  element.appendChild(information);
  element.appendChild(date);


  let startX = 0;
  let startY = 0;

  let active = false;
  let horizontal = false;

  let signedX = 0;

  let suppressClick = false;


  element.addEventListener(
    "pointerdown",
    (event) => {

      if (
        event.pointerType === "mouse"
      ) {
        return;
      }

      startX =
        event.clientX;

      startY =
        event.clientY;

      active = true;
      horizontal = false;

      signedX = 0;

      suppressClick = false;

      try {

        element.setPointerCapture(
          event.pointerId
        );

      } catch {
        /* ignored */
      }

    }
  );


  element.addEventListener(
    "pointermove",
    (event) => {

      if (
        !active ||
        event.pointerType === "mouse"
      ) {
        return;
      }

      const dx =
        event.clientX -
        startX;

      const dy =
        event.clientY -
        startY;


      if (!horizontal) {

        if (
          Math.abs(dx) < 10 &&
          Math.abs(dy) < 10
        ) {

          return;

        }


        if (
          Math.abs(dy) >
          Math.abs(dx)
        ) {

          active = false;

          return;

        }


        horizontal = true;

      }


      if (!horizontal) {
        return;
      }


      event.preventDefault();


      signedX =
        dx;


      const currentX =
        Math.max(
          0,
          dx
        );


      element.classList.add(
        "swiping"
      );


      element.style.transform =
        `translate3d(${Math.min(
          currentX,
          120
        )}px, 0, 0)`;

    },
    {
      passive: false
    }
  );


  element.addEventListener(
    "pointerup",
    () => {

      if (!active) {
        return;
      }

      active = false;


      if (
        horizontal &&
        signedX >= 70
      ) {

        toggleFavorite(
          exhibition,
          element
        );

        suppressClick = true;

      }


      else if (
        horizontal &&
        signedX <= -70
      ) {

        suppressClick = true;


        if (
          currentPage === "home"
        ) {

          navigateHomeToVenues();

        } else if (
          currentPage === "venue-detail"
        ) {

          navigateVenueToVenues();

        }

      }


      element.classList.remove(
        "swiping"
      );

      element.style.transform =
        "";

      signedX = 0;
      horizontal = false;

    }
  );


  element.addEventListener(
    "pointercancel",
    () => {

      active = false;
      horizontal = false;

      signedX = 0;

      element.classList.remove(
        "swiping"
      );

      element.style.transform =
        "";

    }
  );


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
   VENUE DATA
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

  if (
    !venues[venueName]
  ) {

    return;

  }

  currentVenue =
    venueName;

  venueDetailTitle.textContent =
    venueName;

  renderList(
    venueDetailList,
    getVenueExhibitions(
      venueName
    )
  );

  showPage(
    "venue-detail"
  );

  window.scrollTo({
    top: 0,
    behavior: "auto"
  });

}


}


venueDetailBack.addEventListener(
  "click",
  closeVenue
);


/* ==================================================
   MARQUEE
   ================================================== */

const marqueeRows = [];

let venueNames = [];

const MARQUEE_ROW_COUNT = 10;

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


/* ==================================================
   VENUE ITEM
   ================================================== */

function createVenueItem(
  venueName
) {

  const item =
    document.createElement("button");

  item.type = "button";

  item.className =
    "venue-marquee-item";

  item.textContent =
    venueName;

  item.dataset.venue =
    venueName;

  item.setAttribute(
    "aria-label",
    `Voir les expositions à ${venueName}`
  );

  return item;

}


/* ==================================================
   MARQUEE ROW
   ================================================== */

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


  const offset =
    rowIndex %
    venueNames.length;


  const sequence = [
    ...venueNames.slice(offset),
    ...venueNames.slice(0, offset)
  ];


  /*
    On crée un groupe suffisamment long pour
    dépasser largement la largeur de l'écran.

    Puis on duplique exactement ce groupe.
    La largeur du premier groupe constitue
    la période exacte de la boucle.
  */

  const group =
    document.createElement("div");

  group.className =
    "venue-marquee-group";


  let repetition = 0;

  while (
    group.getBoundingClientRect().width <
      window.innerWidth * 1.5 &&
    repetition < 10
  ) {

    sequence.forEach(
      (venueName) => {

        group.appendChild(
          createVenueItem(
            venueName
          )
        );

      }
    );

    repetition++;

  }


  const groupClone =
    group.cloneNode(true);

  groupClone.setAttribute(
    "aria-hidden",
    "true"
  );


  track.appendChild(group);
  track.appendChild(groupClone);

  row.appendChild(track);
  venuesMarquee.appendChild(row);


  const state = {

    row,
    track,

    position: 0,

    speed:
      MARQUEE_SPEEDS[
        rowIndex %
        MARQUEE_SPEEDS.length
      ],

    direction:
      rowIndex % 2 === 0
        ? -1
        : 1,

    cycleWidth: 0,

    dragging: false,

    pointerId: null,

    dragStartX: 0,

    dragStartY: 0,

    dragStartPosition: 0,

    moved: false,

    horizontalDecision: false,

    verticalGesture: false,

    lastTime:
      performance.now()

  };


  marqueeRows.push(state);

  setupMarqueePointer(state);


  row.addEventListener(
    "click",
    (event) => {

      const item =
        event.target.closest(
          ".venue-marquee-item"
        );

      if (
        !item ||
        !row.contains(item)
      ) {

        return;

      }


      if (
        row.dataset.dragged === "true"
      ) {

        row.dataset.dragged =
          "false";

        return;

      }


      const venueName =
        item.dataset.venue;

      if (venueName) {

        openVenue(
          venueName
        );

      }

    }
  );


  return state;

}


/* ==================================================
   MEASURE
   ================================================== */

function measureMarqueeRow(
  state
) {

  const firstGroup =
    state.track.querySelector(
      ".venue-marquee-group"
    );

  if (!firstGroup) {
    return;
  }


  const cycleWidth =
    firstGroup.getBoundingClientRect().width;


  if (cycleWidth > 0) {

    state.cycleWidth =
      cycleWidth;

  }

}


/* ==================================================
   NORMALIZE LOOP
   ================================================== */

function normalizePosition(
  position,
  cycleWidth
) {

  if (
    !cycleWidth
  ) {

    return position;

  }


  position =
    position %
    cycleWidth;


  if (
    position > 0
  ) {

    position -=
      cycleWidth;

  }


  return position;

}


/* ==================================================
   RENDER MARQUEE
   ================================================== */

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
   MARQUEE POINTER
   ================================================== */

function setupMarqueePointer(
  state
) {

  const row =
    state.row;


  row.addEventListener(
    "pointerdown",
    (event) => {

      if (
        event.pointerType === "mouse"
      ) {

        return;

      }


      if (
        event.isPrimary === false
      ) {

        return;

      }


      state.pointerId =
        event.pointerId;

      state.dragStartX =
        event.clientX;

      state.dragStartY =
        event.clientY;

      state.dragStartPosition =
        state.position;

      state.dragging =
        true;

      state.moved =
        false;

      state.horizontalDecision =
        false;

      state.verticalGesture =
        false;


      row.dataset.dragged =
        "false";


      row.classList.add(
        "is-dragging"
      );


      try {

        row.setPointerCapture(
          event.pointerId
        );

      } catch {
        /* ignored */
      }

    }
  );


  row.addEventListener(
    "pointermove",
    (event) => {

      if (
        !state.dragging ||
        event.pointerId !==
        state.pointerId
      ) {

        return;

      }


      const dx =
        event.clientX -
        state.dragStartX;

      const dy =
        event.clientY -
        state.dragStartY;


      if (
        !state.horizontalDecision
      ) {

        if (
          Math.abs(dx) < 8 &&
          Math.abs(dy) < 8
        ) {

          return;

        }


        /*
          Vertical gesture:
          the row immediately gives the gesture
          to page navigation.
        */

        if (
          Math.abs(dy) >
          Math.abs(dx)
        ) {

          state.verticalGesture =
            true;

          state.dragging =
            false;

          state.horizontalDecision =
            true;

          row.classList.remove(
            "is-dragging"
          );


          /*
            Sur Venues :
            swipe haut OU bas = accueil.
          */

          navigateVenuesToHome();


          try {

            row.releasePointerCapture(
              event.pointerId
            );

          } catch {
            /* ignored */
          }


          return;

        }


        /*
          Horizontal gesture:
          this row owns it.
        */

        state.horizontalDecision =
          true;

        state.moved =
          true;

        row.dataset.dragged =
          "true";

      }


      if (
        state.verticalGesture
      ) {

        return;

      }


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
    "pointerup",
    (event) => {

      if (
        event.pointerId !==
        state.pointerId
      ) {

        return;

      }

      finishMarqueePointer(
        state
      );

    }
  );


  row.addEventListener(
    "pointercancel",
    (event) => {

      if (
        event.pointerId !==
        state.pointerId
      ) {

        return;

      }

      cancelMarqueePointer(
        state
      );

    }
  );


  row.addEventListener(
    "lostpointercapture",
    () => {

      if (
        state.dragging
      ) {

        finishMarqueePointer(
          state
        );

      }

    }
  );

}


function finishMarqueePointer(
  state
) {

  const row =
    state.row;


  state.dragging =
    false;


  row.classList.remove(
    "is-dragging"
  );


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
      100
    );

  }


  state.pointerId =
    null;

  state.moved =
    false;

  state.horizontalDecision =
    false;

  state.verticalGesture =
    false;

}


function cancelMarqueePointer(
  state
) {

  const row =
    state.row;


  state.dragging =
    false;

  state.moved =
    false;

  state.horizontalDecision =
    false;

  state.verticalGesture =
    false;

  state.pointerId =
    null;


  row.classList.remove(
    "is-dragging"
  );

  row.dataset.dragged =
    "false";

}


/* ==================================================
   BUILD MARQUEE
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


  requestAnimationFrame(
    () => {

      marqueeRows.forEach(
        (state, index) => {

          measureMarqueeRow(
            state
          );


          if (
            !state.cycleWidth
          ) {

            return;

          }


          const initialOffset =
            (
              0.11 +
              index * 0.043
            ) *
            state.cycleWidth;


          state.position =
            -initialOffset;


          renderMarqueeRow(
            state
          );


          state.lastTime =
            performance.now();

        }
      );

    }
  );

}


/* ==================================================
   MARQUEE ANIMATION
   ================================================== */

let marqueeAnimationFrame =
  null;


function animateMarquee(
  timestamp
) {

  const reducedMotion =
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;


  marqueeRows.forEach(
    (state) => {

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


      if (
        reducedMotion
      ) {

        return;

      }


      state.position +=
        (
          state.speed *
          state.direction *
          elapsed
        ) / 1000;


      renderMarqueeRow(
        state
      );

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
   PAGE VISIBILITY
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


    requestAnimationFrame(
      () => {

        measureSectionHeaders();

      }
    );


    return;

  }


  if (
    pageName === "venues"
  ) {

    document.body.style.overflow =
      "hidden";


    if (
      !marqueeRows.length
    ) {

      rebuildVenueMarquee();

    }


    return;

  }


  if (
    pageName === "venue-detail"
  ) {

    document.body.style.overflow =
      "";


    window.scrollTo({
      top: 0,
      behavior: "auto"
    });

  }

}


/* ==================================================
   PAGE NAVIGATION
   ================================================== */

function navigateHomeToVenues() {

  if (
    currentPage === "home"
  ) {

    showPage(
      "venues"
    );

  }

}


function navigateVenuesToHome() {

  if (
    currentPage === "venues"
  ) {

    showPage(
      "home"
    );

  }

}


function navigateVenueToVenues() {

  if (
    currentPage === "venue-detail"
  ) {

    showPage(
      "venues"
    );

  }

}


/* ==================================================
   GLOBAL PAGE GESTURES
   ================================================== */

let pageGesture = {

  active: false,

  startX: 0,

  startY: 0

};


document.addEventListener(
  "pointerdown",
  (event) => {

    if (
      event.pointerType === "mouse"
    ) {

      return;

    }


    /*
      Les cartes et les lignes ont leurs propres
      gestionnaires de gestes.
    */

    if (
      event.target.closest(
        ".exhibition"
      )
    ) {

      pageGesture.active =
        false;

      return;

    }


    if (
      event.target.closest(
        ".venue-marquee-row"
      )
    ) {

      pageGesture.active =
        false;

      return;

    }


    pageGesture.active =
      true;

    pageGesture.startX =
      event.clientX;

    pageGesture.startY =
      event.clientY;

  }
);


document.addEventListener(
  "pointerup",
  (event) => {

    if (
      !pageGesture.active
    ) {

      return;

    }


    const dx =
      event.clientX -
      pageGesture.startX;

    const dy =
      event.clientY -
      pageGesture.startY;


    pageGesture.active =
      false;


    /*
      HOME
      Swipe gauche → Venues
    */

    if (
      currentPage === "home" &&
      dx <= -70 &&
      Math.abs(dx) >
      Math.abs(dy)
    ) {

      navigateHomeToVenues();

      return;

    }


    /*
      VENUES
      Swipe haut OU bas → Home
    */

    if (
      currentPage === "venues" &&
      Math.abs(dy) >= 70 &&
      Math.abs(dy) >
      Math.abs(dx)
    ) {

      navigateVenuesToHome();

      return;

    }


    /*
      VENUE DETAIL
      Swipe gauche → Venues
    */

    if (
      currentPage === "venue-detail" &&
      dx <= -70 &&
      Math.abs(dx) >
      Math.abs(dy)
    ) {

      navigateVenueToVenues();

    }

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


  const venueInfo =
    venues[
      exhibition.venue
    ];


  const hours =
    document.createElement("div");

  hours.className =
    "detail-hours";

  hours.textContent =
    venueInfo?.hours || "";


  const description =
    document.createElement("p");

  description.className =
    "detail-description";

  description.textContent =
    exhibition.description ||
    "Description non disponible.";


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


  detailContent.appendChild(
    title
  );

  detailContent.appendChild(
    meta
  );


  if (venueInfo) {

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
      event.key === "Escape" &&
      detail.classList.contains("open")
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


    renderList(
      currentList,
      data.current || []
    );


    renderList(
      upcomingList,
      data.upcoming || []
    );


    rebuildVenueMarquee();

    startMarqueeAnimation();


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
