var argv = require('optimist').argv;
var skateboard = require('skateboard');
var routes = require(__dirname + '/../lib/routes');
var request = require('request');
var net = require('net');
var split = require('split');

var PERPAGE = 20;
var ES = argv.es || process.env.ES
function arrayToString(value) {
  if (Array.isArray(value)) {
    return value.toString();
  }
}

var runSearch = function(client, search, start, rows, fn) {
  var url =  ES + '/_search?pretty=false&size=' + rows + '&from=' + start;

  console.log('runsearch', search, start, rows, url);

  var terms = [];
  var body = {
    fields: ['name','description','keywords','author','modified','homepage','version','license','rating'],
    query: search,
    sort: [{'rating' : "desc"}],
    highlight: {
      fields: {
        description : {}
      }
    }
  };

  request.get({
    url: url,
    json: body
  }, function(e, r, json) {
    if (e || !json || !json.hits) {
      console.log('WTF: runsearch', e, json);
      fn && fn(e || {});
      return;
    }

    var out = {
      response: {
        numFound: json.hits.total,
        start: start,
        docs : json.hits.hits.map(function(hit) {
          hit.fields.highlight = hit.highlight;
          var fields = hit.fields;
          for (var key in fields) {
            if (Array.isArray(fields[key]) && key !== 'keywords') {
              fields[key] = fields[key].toString()
            }
          }

          return hit.fields;
        })
      }
    };

    out.type = "results";
    client.writable && client.write(JSON.stringify(out)+'\n');
    fn && fn(null, out);
  });

  fn && fn({});
};

var handleClient = function(client) {
  var currentSearch = 0, currentLoc = 0, currentMax = 0;
  client.pipe(split()).on('data', function(d) {
    try {
      var obj = JSON.parse(d);
    } catch (e) {
      // console.log(e);
      client.writable && client.write('{}\n');
      return;
    }
    currentSearch = obj.value || '';

    runSearch(client, currentSearch, obj.start || 0, obj.perpage || PERPAGE, function(e, json) {
      if (!e && json.response) {
        currentMax = json.response.numFound;
        currentLoc = 0;
      }
    });
  });
};

skateboard({
  dir: __dirname + '/../public',
  port: argv.port || 8080,
  requestHandler : routes
}, handleClient);

// net.createServer(handleClient).listen(1337);
