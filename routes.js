var request = require('request');
var argv = require('optimist').argv;

module.exports = function(req, res) {

  if (req.url.toLowerCase().indexOf('/query') === 0) {
    console.log('http search!', req.url);
    res.setHeader('Access-Control-Allow-Origin', '*');
    var r = request.get(argv.solr + req.url)
    r.pipe(res);
    r.on('error', function(e) {
      console.log("http search ERROR:", e);
    });

    r.on('end', function() {
      console.log("http search OK");
    });
    return true;
  }

  console.log('unhandled request', req.url);
}