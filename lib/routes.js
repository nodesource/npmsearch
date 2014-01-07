module.exports = function(req, res) {
  try {
    if (req.url.toLowerCase().indexOf('/query') === 0) {
      console.log('http search!', req.url);
      res.setHeader('Access-Control-Allow-Origin', '*');
    
      var r = request.get(argv.es + '_search?' + url.parse(req.url).query)
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
    res.writeHead(500);
    res.end('');
  }
}