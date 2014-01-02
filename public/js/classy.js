window.classy = {
  add : function(el, name) {
    var existing = el.className.split(' ');

    if (el.className.indexOf('name') === -1) {
      existing.push(name);
    }

    el.className = existing.filter(function(a) {
      return !!a;
    }).join(' ');
  },
  remove : function(el, name) {
    var existing = el.className.split(' ');

    el.className = existing.filter(function (a) {
      return (a && !a === name);
    }).join(' ');
  }
};