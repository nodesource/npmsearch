var classy = require('./classy');
var prettyDate = require('./pretty-date');
var weld = require('weld').weld;
var skateboard = require('skateboard');
var scoreColor = require('./score-color');
var escapeHTML = require('escape-html');
var searchParser = require('lucene-query-parser').parse;
var PERPAGE = 20;
var MAX_DESCRIPTION_CHARS = 255;

var last = '';
var input = document.querySelector('#search [name=search]');
var button = document.querySelector('#search button')
var resultsEl = document.getElementById('results')
var container = document.createElement('ul');
var first = resultsEl.children.item(0).cloneNode(true);
resultsEl.removeChild(results.children.item(0));
container.appendChild(first);
resultsEl.innerHTML = "";
var loading = false;
var max = 0, position = 0;

var tagsToReplace = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;'
};

var xssConfig = {
  whiteList:          ['em'],        // empty, means filter out all tags
  // stripIgnoreTag:     true,      // filter out all HTML not in the whilelist
  //stripIgnoreTagBody: ['script'] // the script tag is a special case, we need
                                 // to filter out its content
}

var andexp = /&&?| and /ig;
function findAnd(term) {
  return term.replace(andexp, ' AND ').replace(/  /g, ' ').trim()
};

function replaceTag(tag) {
    return tagsToReplace[tag] || tag;
}

function safe_tags_replace(str) {
    return str.replace(/[&<>]/g, replaceTag);
}

function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

var templateResults = function(results) {
  var containerClone = container.cloneNode(true);
  weld(containerClone, {result : results}, {
    map : function(p, e, k, v) {
      var where = e;

      if (k === 'score') {
        scoreColor(e.parentNode, parseFloat(v));
      }

      if (k === 'times.published') {
        if (!isNaN(v)) {
          v = prettyDate(v) || v;
        } else {
          v = 'some time ago'
        }
      }

      if (e.tagName === 'A') {
        switch (k) {
          case 'homepage':
            e.href = v;
          break;

          case 'author':
            e.href="?q=author:" + v;
            e.textContent = v;
          break;
        }

      } else if (v!==false) {

        if (k === 'name' || k === 'keyword' || isNumber(k)) {

          if (isNumber(k) && v.indexOf('<') > -1) {
            return false;
          }

          while (where.children[0]) {
            where = where.children[0];
          }
        }
        where.textContent = v;
      } else if (k === 'keywords') {
        e.innerHTML = "<li class='keyword'>No Tags</li>"
      } else {
        e.style.display = 'none'
      }
      if (k === 'description') {
        v = safe_tags_replace(v.replace(/<(.?)em>/ig, "[$1em]"));
        where.innerHTML = v.replace(/\[(.?)em\]/gi, "<$1em>");
      }

      return false;
    },
    alias : {
      'times.published' : 'timestamp',
      score : 'num',
      devDependencies: false,
      maintainers: false,
      users: false
    }
  });

  while(containerClone.children.length) {
    resultsEl.appendChild(containerClone.children.item(0))
  }
  classy.remove(document.body, 'searching');
  loading = false;
};


var applyQtoInput = function() {
  document.getElementById('intro').style.display = 'block';
  document.getElementById('search-header').style.height = '35px';
  document.getElementById('search-box').style.marginBottom = '25px';
  document.getElementById('result-container').style.display = 'none';

  if (window.location.search) {
    var matches = window.location.search.match(/\?q=([^#]+)/);
    if (matches) {
      input.value = unescape(matches[1].replace(/%20|\+/g,' '));
      window.title = 'NPMSearch - ' + input.value;
      document.getElementById('intro').style.display = 'none';
      document.getElementById('search-header').style.height = '0';
      document.getElementById('search-box').style.marginBottom = '25px';
      document.getElementById('result-container').style.display = 'block';
    } else {
      input.value = '';
    }
  } else {
    input.value = '';
  }
};

applyQtoInput();


var termCleanupExp = /\s*,\s*/g;


function addTerm(obj) {
  var term = obj.term;
  term = term.replace(termCleanupExp, ',')
             .replace(/__COLON__/g, ':')

  if (obj.field && obj.field !== '<implicit>') {
    return terms = term.split('__COMMA__').map(function(t) {
      var v = t.replace(/__DASH__/g, '-');
      var k = obj.field;
      var tmpObj = {};
      tmpObj[k] = v
      return {term: tmpObj};
    });

  } else {
    return {
      query_string : {
        query : JSON.stringify(term.replace(/__DASH__/g, '-')),
        default_field: 'name',
        analyze_wildcard: true,
        fields: ['name^4', 'description'],
      }
    };
  }
}

function addBoolean(ast) {

  var ret = {};
  var b = {};
  ret.bool = b;

  if (!ast.operator) {
    // add terms to bool query if they are the only term
    b['must'] = [];
    b['must'].push(addTerm(ast));
  } else {

    var type = ast.operator === 'AND' ? 'must' : 'should'

    var right = ast.right;
    var left = ast.left;

    b[type] = [];

    if (right.operator) {
      b[type].push(addBoolean(right));
    } else {
      b[type].push(addTerm(right))
    }

    if (left.operator) {
      b[type].push(addBoolean(left));
    } else {
      b[type].push(addTerm(left));
    }
  }

  return ret;
}

skateboard(function(stream) {
  var searching = false;
  var query;
  function search(skip) {

    var val = findAnd(input.value.trim());
    var v = val.replace(/([\w\*])-([\w\*])/g, '$1__DASH__$2');
    v = v.replace(/([:,])(\w*):(\w*)/g, '$1$2__COLON__$3')
    v = v.replace(/([:,])(\w*),(\w*)/g, '$1$2__COMMA__$3')

    found = false,
    newVal = '',
    i = 0;

    try {
      query = null;
      var parsed = searchParser(v);

      if (parsed.operator) {
        query = addBoolean(parsed);
      } else if (parsed.left) {
        query = addBoolean(parsed.left);
      } else {
        val = '';
      }
    } catch (e) {
      val = '';
    };

    ga && ga('set', 'page', '/?q=' + val);
    ga && ga('send', 'pageview');

    // clean input to detect true changes
    for (i = 0; i < val.length; i++){
      if (val.charAt(i) == " ") {
        if (!found) {
          newVal += val.charAt(i);
        }
        found = true;
      } else {
        newVal += val.charAt(i);
        found = false;
      }
    }

    val = newVal;

    if (!val) {
      document.getElementById('results').innerHTML = '';
      searching = false;
      last = '';

      document.getElementById('intro').style.display = 'block';
      document.getElementById('search-header').style.height = '35px';
      document.getElementById('search-box').style.marginBottom = '50px';
      document.getElementById('result-container').style.display = 'none';
    } else {

      document.getElementById('intro').style.display = 'none';
      document.getElementById('search-header').style.height = '0';
      document.getElementById('search-box').style.marginBottom = '25px';
      document.getElementById('result-container').style.display = 'block';
    }

    if (searching || val === last || !val) {
      return;
    }

    !skip && history.pushState({ search : val }, 'Search:' + val, '/?q=' + val);


    classy.add(document.body, 'searching');

    last = val;

    // make it easier to use this thing
    val = val.split(' ').map(function(word) {
      if (word.indexOf('-') > -1) {
        return '"' + word + '"'
      }
      return word;
    }).filter(Boolean).join(' ');

    var data = JSON.stringify({
        type: 'search',
        value: query,
        start: 0,
        perpage: PERPAGE
      });


    document.getElementById('results').innerHTML = '';
    position = 0;

    stream.write(data + '\n');
  };

  document.addEventListener('click', function(ev) {
    if (ev.target.tagName === 'A' && ev.target.className.indexOf('text') > -1) {

      var keywords = [];
      var matches = input.value.match(/(keywords:([a-z0-9, ]+))/i);
      if (matches) {
        keywords = matches[2].split(',');
        keywords.push(ev.target.textContent);
        input.value = input.value.replace(matches[1], 'keywords:' + keywords.join(','))
      } else {
        input.value += ' AND keywords:' + ev.target.textContent;
      }

      ev.preventDefault();
      search();
      return false;
    }
  });

  window.onpopstate = function(event) {
    applyQtoInput();
    search(true);
  };

  input.focus();
  if (input.value) {
    search();
  }

  stream.on('data', function(d) {
    searching = false;

    var obj = JSON.parse(d);

    if (obj.response && obj.response.docs.length) {

      max = obj.response.numFound;
      position = obj.response.start+PERPAGE;

      document.getElementById('total-results').innerHTML = max

      var results = [];
      obj.response.docs.forEach(function(doc) {
        if (typeof doc.score === 'undefined') {
          doc.score = 0.0;
        }

        if (isNaN(doc.score) || typeof doc.description === 'undefined') {

          //return;
        }

        if (doc.highlight) {
          var parts = doc.highlight.description;
          var description = doc.description;
          if (parts) {
            parts.forEach(function(line) {
              var clean = line.replace(/<\/?em>/gi, '');
              description = description.replace(clean, parts)
            });
          }

          description = description || doc.description

         if (description.length > MAX_DESCRIPTION_CHARS) {
            description = description.substring(0, MAX_DESCRIPTION_CHARS) + '...';
          }

          doc.description = description;
        }

        if (!doc.keywords || !doc.keywords.length) {
          doc.keywords = false;
        }

        doc['times.published'] = +(new Date(doc['times.published']));
        doc.license = doc.license || '??';
        doc.homepage = doc.homepage || 'http://npmjs.com/package/' + doc.name;

        if (doc.homepage.join) {
          doc.homepage = doc.homepage.join('');
        }

        doc.homepage = doc.homepage.replace(/git@github.com:?/, 'https://github.com/');

        if (isNaN(doc.score)) {
          //return;
        } else if (doc.score >= 99.9) {
          doc.score = '10';
        } else {
          doc.score = Number(doc.score/10).toFixed(1);
        }
        results.push(doc);
      });

      templateResults(results);
    } else if (!obj.response || !obj.response.numFound) {
      classy.remove(document.body, 'searching');
      document.getElementById('intro').style.display = 'block';
      document.getElementById('search-header').style.height = '35px';
      document.getElementById('search-box').style.marginBottom = '50px';
      document.getElementById('result-container').style.display = 'none';
      resultsEl.innerHTML = "";
    }
  });

  var upTimer = null;

  input.addEventListener('keyup', function(ev) {
    clearTimeout(upTimer);
    upTimer = setTimeout(search, 250);
  }, false);

  window.onscroll =  function(e) {
    if (document.body.clientHeight - 150*(PERPAGE/2) < window.pageYOffset && input.value.length) {
      if (loading || position >= max) {
        return;
      }

      ga && ga('send', 'event', 'scroll (q=' + input.value + ')', position);

      stream.write(JSON.stringify({
        type: 'search',
        value: query,
        start: position,
        rows: PERPAGE
      }) + '\n');

      loading = true;
      position += PERPAGE;
    }
  };
});
