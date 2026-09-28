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