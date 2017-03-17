var argv = require('optimist').argv;
var url = require('url');
var request = require('request');
var qs = require('querystring');
var async = require('async');

module.exports = function(req, res) {
  try {
    if (req.url.toLowerCase().indexOf('/query') === 0) {

      var params = qs.parse(url.parse(req.url).query);

      if (params) {
        if (params.sort) {
          params.sort = params.sort.replace(/[ \+]/g, ':');
        }

        if (params.fl) {
          params.fields = params.fl;
          delete params.fl;
        }

        if (typeof params.rows !== 'undefined') {
          params.size = parseInt(params.rows, 10);
        }

        params.from = params.from || params.start || 0;
      }

      var query = argv.es + '/_search?' + qs.stringify(params);
      console.log('http search!', query);
      res.setHeader('Access-Control-Allow-Origin', '*');

      var r = request.get({
        url: query,
        json: true
      }, function(e, r, o) {
        if (e) {
          console.log('ERROR:', e);
          res.writeHead(500);
          return res.end('Could not connect to elasticsearch');
        }

        var out = { results : [], total : 0 };
        if (o && o.hits && o.hits.hits.length) {
          var l = o.hits.hits.length, hits = o.hits.hits;
          for (var i = 0; i<l; i++) {
            out.results.push(hits[i]._source);
          }
          out.total = o.hits.total;
          out.size = params.size;
          out.from = params.from;
        }

        res.writeHead(200);
        res.end(JSON.stringify(out, null, (params.pretty) ? '  ' : ''));
      });
      return true;
    } else if (req.url.toLowerCase().indexOf('/exists') === 0) {
      var params = qs.parse(url.parse(req.url).query);
      var baseUrl = argv.es + '/package/';
      var packages = (params.packages || '').split(',');

      async.map(packages, function(pkg, cb) {
        request(baseUrl + pkg.trim() + '?fields=id', function(e, r) {
          var exists = !e && r && r.statusCode === 200;
          cb(null, exists ? 1 : 0);
        });
      }, function(e, array) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.writeHead(200, {
          'content-type' : 'application/json'
        });
        res.end(JSON.stringify(array));
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
};
