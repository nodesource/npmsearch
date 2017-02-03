module.exports = renderAbout

function renderAbout () {
  return `
    <html>
      <head>
        <title>npmsearch - node.js Package Search Utility</title>
        <link rel="search" type="application/opensearchdescription+xml" href="/opensearch.xml" title="npm" />
        <script type="text/javascript" src="/js/prefixfree.min.js"></script>
        <link href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:200,300,300i,400,600|Source+Code+Pro" rel="stylesheet">
        <link type="text/css" rel="stylesheet" media="all" href="core.css" />
      </head>
      <body>
        <div class="main-content">
          <header>
            <section id="heading">
              <h1>npm</h1>
              <div class="right">
                <div class="nav">
                  <a href="/about">About</a>
                </div>
                <div class="nav">
                  <a href="https://github.com/nodesource/npmsearch">
                    <img src="images/github-icon.svg" />
                  </a>
                </div>
                <div class="nav">
                  <a href="https://twitter.com/nodesource">
                    <img src="images/twitter-icon.svg" />
                  </a>
                </div>
              </div>
            </section>
          </header>

          <section id="main-copy">
          <hr style="margin:0" />

          </section>

          <footer>
            <span id="copyright">
              <p class="powered-by">
                <span>Powered By</span> <img src="/images/white-logo.svg">
              </p>
            </span>
         </footer>
        </div>
      </body>
    </html>
    `
}