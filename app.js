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

const venueDetailBack =
  document.getElementById("venue-detail-back");

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


  /* ----------------------------------------------
     SWIPE DROIT = FAVORI
     ---------------------------------------------- */

  let startX = 0;
  let startY = 0;

  let horizontal = false;
  let active = false;

  let currentX = 0;
  let suppressClick = false;

  element.addEventListener(
    "pointerdown",
    (event) => {

      if (
        event.pointerType === "mouse"
      ) {
        return;
      }

      startX = event.clientX;
      startY = event.clientY;

      horizontal = false;
      active = true;
      currentX = 0;
      suppressClick = false;

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

        element.classList.add(
          "swiping"
        );

      }

      if (!horizontal) {
        return;
      }

      /*
        Only rightward movement has an effect.
      */

      currentX =
        Math.max(0, dx);

      element.style.transform =
        `translate3d(${Math.min(
          currentX,
          120
        )}px, 0, 0)`;

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

      element.style.transform = "";

      currentX = 0;
      horizontal = false;

    }
  );


  element.addEventListener(
    "pointercancel",
    () => {

      active = false;
      horizontal = false;
      currentX = 0;

      element.classList.remove(
        "swiping"
      );

      element.style.transform = "";

    }
  );


  /* ----------------------------------------------
     CLICK = DETAIL
     ---------------------------------------------- */

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

    empty.className = "empty";
    empty.textContent =
      "Aucune exposition";

    container.appendChild(empty);

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


function closeVenue() {

  currentVenue = null;

  showPage("venues");

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

  item.setAttribute(
    "aria-label",
    `Voir les expositions à ${venueName}`
  );

  item.addEventListener(
    "click",
    (event) => {

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

      openVenue(venueName);

    }
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


  /*
    Every row starts at a different point in
    the venue sequence.
  */

  const offset =
    rowIndex %
    venueNames.length;

  const sequence = [
    ...venueNames.slice(offset),
    ...venueNames.slice(0, offset)
  ];


  /*
    We create FOUR copies.

    The loop itself is mathematical:
    the visible position is always normalized
    against one complete sequence width.

    The extra copies simply guarantee that there
    is always content on both sides of the viewport.
  */

  for (
    let repetition = 0;
    repetition < 4;
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

    dragStartPosition: 0,

    moved: false,

    horizontalDecision: false,

    verticalGesture: false,

    lastTime:
      performance.now()

  };


  marqueeRows.push(state);

  setupMarqueePointer(state);

  return state;

}


/* ==================================================
   MEASURE
   ================================================== */

function measureMarqueeRow(
  state
) {

  const children =
    Array.from(
      state.track.children
    );

  if (!children.length) {
    return;
  }

  const itemsPerSequence =
    venueNames.length;

  if (
    children.length <
    itemsPerSequence * 2
  ) {
    return;
  }

  /*
    The first item of copy 1 and the first
    item of copy 2 are exactly one cycle apart.
  */

  const first =
    children[0];

  const secondCopyFirst =
    children[
      itemsPerSequence
    ];

  const cycleWidth =
    secondCopyFirst.offsetLeft -
    first.offsetLeft;

  if (
    cycleWidth > 0
  ) {

    state.cycleWidth =
      cycleWidth;

  }

}


/* ==================================================
   NORMALIZE LOOP POSITION
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

  /*
    Always normalize to [ -cycleWidth, 0 ).
  */

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
   RENDER
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
   MARQUEE POINTER GESTURE
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

      state.dragStartPosition =
        state.position;

      state.dragging = true;

      state.moved = false;

      state.horizontalDecision =
        false;

      state.verticalGesture =
        false;

      row.dataset.dragged =
        "false";

      row.classList.add(
        "is-dragging"
      );

      /*
        Capture guarantees that the row continues
        receiving pointer events even when the finger
        leaves the exact row during the drag.
      */

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
        event.pointerId !== state.pointerId
      ) {
        return;
      }

      const dx =
        event.clientX -
        state.dragStartX;

      const dy =
        event.clientY -
        (
          state.dragStartY ||
          event.clientY
        );


      /*
        Store initial Y lazily because the pointer
        object itself is enough for horizontal dragging.
      */

      if (
        !state.horizontalDecision
      ) {

        /*
          A vertical gesture belongs to page navigation.
          A horizontal gesture belongs to this row.
        */

        const startY =
          state._startY ??
          event.clientY;

        if (
          state._startY === undefined
        ) {

          state._startY =
            event.clientY;

        }

        const verticalDistance =
          event.clientY -
          state._startY;

        if (
          Math.abs(dx) < 8 &&
          Math.abs(verticalDistance) < 8
        ) {

          return;

        }

        if (
          Math.abs(verticalDistance) >
          Math.abs(dx)
        ) {

          state.verticalGesture =
            true;

          state.dragging = false;

          state.horizontalDecision =
            true;

          row.classList.remove(
            "is-dragging"
          );

          return;

        }

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


      /*
        This row now owns the horizontal gesture.
      */

      event.preventDefault();

      state.position =
        state.dragStartPosition +
        dx;

      renderMarqueeRow(state);

    },
    {
      passive: false
    }
  );


  row.addEventListener(
    "pointerup",
    (event) => {

      if (
        event.pointerId !== state.pointerId
      ) {
        return;
      }

      finishMarqueePointer(state);

    }
  );


  row.addEventListener(
    "pointercancel",
    (event) => {

      if (
        event.pointerId !== state.pointerId
      ) {
        return;
      }

      cancelMarqueePointer(state);

    }
  );


  row.addEventListener(
    "lostpointercapture",
    () => {

      if (
        state.dragging
      ) {

        finishMarqueePointer(state);

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

  state._startY =
    undefined;

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

  state._startY =
    undefined;

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

  marqueeRows.length = 0;

  venuesMarquee.innerHTML = "";

  if (!venueNames.length) {
    return;
  }


  for (
    let index = 0;
    index < MARQUEE_ROW_COUNT;
    index++
  ) {

    buildMarqueeRow(index);

  }


  requestAnimationFrame(
    () => {

      marqueeRows.forEach(
        (state, index) => {

          measureMarqueeRow(state);

          if (
            !state.cycleWidth
          ) {
            return;
          }

          /*
            Different starting positions prevent the
            rows from looking like a rigid table.
          */

          const initialOffset =
            (
              0.11 +
              index * 0.043
            ) *
            state.cycleWidth;

          /*
            Right-moving rows start slightly further
            into the negative range, so content is
            immediately visible on both sides.
          */

          state.position =
            -initialOffset;

          renderMarqueeRow(state);

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

let marqueeAnimationFrame = null;


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


      /*
        direction = -1 : left
        direction = +1 : right
      */

      state.position +=
        (
          state.speed *
          state.direction *
          elapsed
        ) / 1000;

      /*
        True continuous loop.
        No endpoint exists.
      */

      renderMarqueeRow(state);

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

    document.body.style.overflow = "";

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

/*
  HOME
    swipe left
      ↓
  VENUES

  VENUES
    swipe up OR down
      ↓
  HOME

  VENUE DETAIL
    swipe left
      ↓
  VENUES

  On VENUES, horizontal gestures are owned
  exclusively by the rows.
*/

function navigateHomeToVenues() {

  if (
    currentPage === "home"
  ) {

    showPage("venues");

  }

}


function navigateVenuesToHome() {

  if (
    currentPage === "venues"
  ) {

    showPage("home");

  }

}


function navigateVenueToVenues() {

  if (
    currentPage === "venue-detail"
  ) {

    showPage("venues");

  }

}


/* ==================================================
   GLOBAL PAGE GESTURES
   ================================================== */

let pageGesture = {
  active: false,
  startX: 0,
  startY: 0,
  blocked: false
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
      Exhibition gestures have priority.
    */

    if (
      event.target.closest(".exhibition")
    ) {

      pageGesture.blocked = true;
      pageGesture.active = false;

      return;

    }


    /*
      Marquee rows have complete priority over
      horizontal gestures on the Venues page.
    */

    if (
      event.target.closest(
        ".venue-marquee-row"
      )
    ) {

      pageGesture.blocked = true;
      pageGesture.active = false;

      return;

    }


    pageGesture.blocked = false;

    pageGesture.active = true;

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
      !pageGesture.active ||
      pageGesture.blocked
    ) {

      pageGesture.active = false;
      pageGesture.blocked = false;

      return;

    }


    const dx =
      event.clientX -
      pageGesture.startX;

    const dy =
      event.clientY -
      pageGesture.startY;


    pageGesture.active = false;


    /*
      HOME:
      left = Venues
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
      VENUES:
      vertical gesture = Home

      Both directions are deliberately accepted.
      Horizontal gestures never reach this block
      when they start on a row.
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
      VENUE DETAIL:
      left = Venues

      Vertical gestures remain normal page
      scrolling and therefore do nothing here.
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


  links.appendChild(source);
  links.appendChild(official);


  detailContent.appendChild(title);
  detailContent.appendChild(meta);

  if (venueInfo) {

    detailContent.appendChild(hours);

  }

  detailContent.appendChild(description);
  detailContent.appendChild(links);


  detail.classList.add("open");

  detail.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.style.overflow =
    "hidden";

}


function closeDetail() {

  detail.classList.remove("open");

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
      Object.keys(venues);


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

    console.error(error);

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