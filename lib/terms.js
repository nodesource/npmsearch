module.exports = extractTerms;

var splitExp = /\s?\w+:[^ \t]+/g;
var keywordSplit = /(\w+):([^\(\)]+)/;
var valueSplit = /\s*,\s*/;

function extractTerms(s) {
  var ret = null;

  s = s.replace(/\s*,\s*/g, ',');

  var parts = s.match(splitExp);

  if (parts.length) {
    parts.forEach(function(part) {
      var matches =  part.trim().match(keywordSplit);

      if (matches) {
        if (!ret) {
          ret = [];
        }

        var term = matches[1];
        var values = matches[2].split(valueSplit);
        ret.push([term, values]);
      }
    });
  }

  return ret;
}
