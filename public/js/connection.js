var PERPAGE = 20;
var MAX_DESCRIPTION_CHARS = 255;

/*
 * JavaScript Pretty Date
 * Copyright (c) 2011 John Resig (ejohn.org)
 * Licensed under the MIT and GPL licenses.
 */

function prettyDate(date_str) {
    var seconds = (new Date - new Date(date_str)) / 1000;
    var token = 'ago',
        list_choice = 1;
    if (seconds < 0) {
        seconds = Math.abs(seconds);
        token = 'from now';
        list_choice = 2;
    }
    var i = 0,
        format;
    while (format = time_formats[i++]) if (seconds < format[0]) {
        if (typeof format[2] == 'string') return format[list_choice];
        else return Math.floor(seconds / format[2]) + ' ' + format[1] + ' ' + token;
    }

    return time;
};

var time_formats = [
    [60, 'seconds', 1], // 60
    [120, '1 minute ago', '1 minute from now'], // 60*2
    [3600, 'minutes', 60], // 60*60, 60
    [7200, '1 hour ago', '1 hour from now'], // 60*60*2
    [86400, 'hours', 3600], // 60*60*24, 60*60
    [172800, '1 day ago', 'tomorrow'], // 60*60*24*2
    [604800, 'days', 86400], // 60*60*24*7, 60*60*24
    [1209600, '1 week ago', 'next week'], // 60*60*24*7*4*2
    [2419200, 'weeks', 604800], // 60*60*24*7*4, 60*60*24*7
    [4838400, '1 month ago', 'next month'], // 60*60*24*7*4*2
    [29030400, 'months', 2419200], // 60*60*24*7*4*12, 60*60*24*7*4
    [58060800, '1 year ago', 'next year'], // 60*60*24*7*4*12*2
    [2903040000, 'years', 29030400], // 60*60*24*7*4*12*100, 60*60*24*7*4*12
    [5806080000, '1 century ago', 'next century'], // 60*60*24*7*4*12*100*2
    [58060800000, 'centuries', 2903040000] // 60*60*24*7*4*12*100*20, 60*60*24*7*4*12*100
];


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

      if (k === 'rating') {
        ratingColor(e.parentNode, parseFloat(v));
      }

      if (k === 'modified') {
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
            e.innerHTML = v;
          break;
        }

      } else if (v!==false) {
        
        if (k === 'name' || k === 'keyword' || isNumber(k)) {
          while (where.children[0]) {
            where = where.children[0];
          }
        }
        where.innerHTML = v;
      } else {
        e.style.display = 'none';
      }
      if (k === 'description') {
        v = safe_tags_replace(v.replace(/<(.?)em>/ig, "[$1em]"));
        where.innerHTML = v.replace(/\[(.?)em\]/gi, "<$1em>");
      }

      return false;
    },
    alias : {
      modified : 'timestamp',
      rating   : 'num',
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
  document.getElementById('result-container').style.display = 'none';

  if (window.location.search) {
    var matches = window.location.search.match(/\?q=([^#]+)/);
    if (matches) {
      input.value = unescape(matches[1].replace(/%20|\+/g,' '));
      window.title = 'NPMSearch - ' + input.value;
      document.getElementById('intro').style.display = 'none';
      document.getElementById('result-container').style.display = 'block';
    } else {
      input.value = '';
    }
  } else {
    input.value = '';
  }
};

applyQtoInput();

skateboard(function(stream) {
  var searching = false;
  var search = function(skip) {

    var val = input.value.trim(),
    found = false,
    newVal = '',
    i = 0;

    ga('set', 'page', '/?q=' + val);
    ga('send', 'pageview');

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
      document.getElementById('result-container').style.display = 'none';
    } else {

      document.getElementById('intro').style.display = 'none';
      document.getElementById('result-container').style.display = 'block';
    }

    if (searching || val === last || !val) {
      return;
    }

    !skip && history.pushState({ search : val }, 'Search:' + val, '/?q=' + val);


    classy.add(document.body, 'searching');

    last = val;

    var data = JSON.stringify({
        type: 'search',
        value: val,
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

      var results = [];
      obj.response.docs.forEach(function(doc) {
        if (typeof doc.rating === 'undefined') {
          doc.rating = 0.0;
        }

        if (isNaN(doc.rating) || typeof doc.description === 'undefined') {
        
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

        doc.modified = +(new Date(doc.modified));
        doc.license = doc.license || '??';
        doc.homepage = doc.homepage || 'http://npmjs.com/package/' + doc.name;

        if (doc.homepage.join) {
          doc.homepage = doc.homepage.join('');
        }

        doc.homepage = doc.homepage.replace(/git@github.com:?/, 'https://github.com/');

        if (isNaN(doc.rating)) {
          //return;
        } else if (doc.rating >= 9.95) {
          doc.rating = '10';
        } else {
          doc.rating = Number(doc.rating).toFixed(1);
        }
        results.push(doc);
      });

      templateResults(results);
    } else if (!obj.response || !obj.response.numFound) {
      classy.remove(document.body, 'searching');
      document.getElementById('intro').style.display = 'block';
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
        value: input.value,
        start: position,
        rows: PERPAGE
      }) + '\n');

      loading = true;
      position += PERPAGE;
    }
  };
});
