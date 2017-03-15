module.exports = renderAbout

function renderAbout () {
  const criteria = {
    readme: 'Package has a README file',
    sourceControl: 'Package\'s source code is in public source control',
    license: 'Package and its dependency tree are open-source licensed with any of: Apache, BSD, ISC, or MIT',
    usage: 'Disk usage after npm install is < 25 MB',
    // tests and coverage currently excluded from displayed info as they arent yet included
    tests: 'Package has passing tests',
    coverage: 'Package has at least 70% test coverage',
    vulnerabilities: 'There are no known security vulnerabilities in the package or its dependency tree'
  }

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
        <div class="main-content about">
          <header>
            <section id="heading">
              <a href="/"><h1>npm</h1></a>
              <div class="right">
                <div class="nav">
                  <a href="/about">About</a>
                </div>
                <div class="nav">
                  <a href="https://github.com/nodesource/npmsearch" target="_blank">
                    <img src="images/github-icon.svg" />
                  </a>
                </div>
                <div class="nav">
                  <a href="https://twitter.com/nodesource" target="_blank">
                    <img src="images/twitter-icon.svg" />
                  </a>
                </div>
              </div>
            </section>
          </header>
          <hr />

          <section id="main-copy">
            <h1>About</h1>
            <h2>Nodesource Certification Score</h2>
            <p>
              npmsearch uses The <a href="https://nodesource.com/" target="_blank">NodeSource</a>
              Certification Process, an extensive suite of tests based on attributes that are valuable
              to customers. We are attempting to capture the best signals that determine the quality,
              security and overall health of any given package in the npm ecosystem.
            </p>
            <br />
            <p>
              We expect the calculation of this score to change over time as we incorporate 
              feedback about additional signals that are important to professional users of 
              Node.js.
            </p>
            <h2>Scoring Criteria</h2>
            <p>The current scoring criteria used are:</p>
            <ul>
              <li><span>${criteria.readme}</span></li>
              <li><span>${criteria.sourceControl}</span></li>
              <li><span>${criteria.license}</span></li>
              <li><span>${criteria.usage}</span></li>
              <li><span>${criteria.vulnerabilities}</span></li>
            </ul>
            <h2>Credits</h2>
            <p>
              npmsearch is made possible by <a href="https://nodesource.com/" target="_blank">NodeSource</a>,
              The Node Company&trade;. NodeSource is the Node Company, offering N|Solid
              - the most secure platform for running Node.js in production. 
              Trusted by MasterCard, GoPro, Cond&eacute; Nast and many others, N|Solid
              secures your applications and provides surgical insight into your Node.js
              processes to help you identify problems before they happen. With a commitment
              to the Node.js community, NodeSource is dedicated to helping build an open,
              stable, long-lasting ecosystem for Node.js.
            </p>

          </section>

          <footer>
            <span id="copyright">
              <p class="powered-by">
                <span>Powered By</span> <a href="https://nodesource.com/" target="_blank"><img src="/images/white-logo.svg"></a>
              </p>
            </span>
         </footer>
        </div>
      </body>
    </html>
    `
}