<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#000000">
  <title>Expositions</title>
  <link rel="stylesheet" href="style.css">
</head>

<body>

  <main class="app">

    <header id="maintenant-heading" class="section-heading section-heading-now">
      <button type="button" id="maintenant-button">MAINTENANT</button>
    </header>

    <section id="current-section" class="exhibition-section">
      <div id="current-list" class="exhibition-list"></div>
    </section>

    <header id="bientot-heading" class="section-heading section-heading-upcoming">
      <button type="button" id="bientot-button">BIENTÔT</button>
    </header>

    <section id="upcoming-section" class="exhibition-section">
      <div id="upcoming-list" class="exhibition-list"></div>
    </section>

  </main>

  <div id="detail-view" class="detail-view" aria-hidden="true">
    <button id="detail-close" class="detail-close" type="button">×</button>

    <div class="detail-content">
      <div id="detail-venue" class="detail-venue"></div>
      <h1 id="detail-title"></h1>
      <div id="detail-date" class="detail-date"></div>
      <div id="detail-description" class="detail-description"></div>
      <a id="detail-source" class="detail-source" href="#" target="_blank" rel="noopener">
        SOURCE
      </a>
    </div>
  </div>

  <script src="app.js"></script>
</body>
</html>
