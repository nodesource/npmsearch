var argv = require('optimist').argv;
var skateboard = require('skateboard');
var routes = require('./routes');
var request = require('request');
var net = require('net');
var split = require('split');


var PERPAGE = 20;

var runSearch = function(client, term, start, rows, fn) {
  var url =  argv.es + '/_search?pretty=false&size=' + rows + '&from=' + start;
  console.log('runsearch', term, start, rows, url);
  request.get({
    url: url,
    json: {
      fields: ['name','description','keywords','author','modified','homepage','version','license'],
      query: {
        multi_match : {
          query : term,
          fields: ['name^4','description'],
        },
      },
      sort: ['_score'],
      highlight: {
        fields: {
          description : {}
        }
      }
    }
  }, function(e, r, json) {

    if (e || !json) {
      console.log('WTF: runsearch', e, json);
      fn && fn(e);
      return;
    }

    var out = {
      response: {
        numFound: json.hits.total,
        start: start,
        docs : json.hits.hits.map(function(hit) {
          hit.fields.highlight = hit.highlight;
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

var processKeywords = function(currentSearch) {
  var keywordMatches = currentSearch.match(/(keywords:([a-z0-9, ]+))/i);

  if (keywordMatches) {
    var keywords = keywordMatches[2].split(',').map(function(word) {
      return 'keywords:'+ word
    });
    currentSearch = currentSearch.replace(
      keywordMatches[1],
      keywords.join(' AND ')
    );
  }
  return currentSearch
};

var handleClient = function(client) {
  var currentSearch = 0, currentLoc = 0, currentMax = 0;
  client.pipe(split()).on('data', function(d) {
    try {
      var obj = JSON.parse(d);
    } catch (e) {
      console.log(e);
      client.writable && client.write('{}\n');
      return;
    }
    currentSearch = processKeywords(obj.value || '');
    console.log('search!', d);
    runSearch(client, currentSearch, obj.start || 0, obj.perpage || PERPAGE, function(e, json) {
      if (!e && json.response) {
        currentMax = json.response.numFound;
        currentLoc = 0;
      }
    });
  });
};

skateboard({
  dir: __dirname + '/public',
  port: argv.port || 8080,
  requestHandler : routes
}, handleClient);

net.createServer(handleClient).listen(1337);