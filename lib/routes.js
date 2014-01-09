var argv = require('optimist').argv;
var url = require('url');
var request = require('request');

module.exports = function(req, res) {
  try {
    if (req.url.toLowerCase().indexOf('/query') === 0) {
      var query = argv.es + '/_search?' + url.parse(req.url).query;
      console.log('http search!', query);
      res.setHeader('Access-Control-Allow-Origin', '*');
    
      var r = request.get(query);
      r.pipe(res);
      r.on('error', function(e) {
        console.log("http search ERROR:", e);
      });

      r.on('end', function() {
        console.log("http search OK");
      });
      return true;
    }

    res.writeHead(404);
    res.end('');

    console.log('unhandled request', req.url);
  } catch (e) {
    console.log(e.stack);
    res.writeHead(500);
    res.end('');
  }
}