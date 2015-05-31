var test = require('tape');
var terms = require('../lib/terms');

test('basic keywords', function(t) {

  var r = terms('keywords:abc');
  var e = [['keywords', ['abc']]];

  t.deepEqual(r, e, 'found abc keyword');

  t.end();
});

test('multiple keywords', function(t) {

  var r = terms('keywords:abc, 123\t,  456');
  var e = [['keywords', ['abc', '123', '456']]];

  t.deepEqual(r, e, 'found multiple keywords');
  t.end();
});

test('multiple keywords groups', function(t) {

  var r = terms('keywords:abc, 123\t,  456 keywords:or-query');
  var e = [['keywords', ['abc', '123', '456']], ['keywords', ['or-query']]];

  t.deepEqual(r, e, 'found multiple keyword blocks');
  t.end();
});

test('keywords with colons', function(t) {
  var r = terms('keywords:some:keyword keywords:or:%%%qu:e_r-y$,\t\t\t ____another____');
  var e = [['keywords', ['some:keyword']], ['keywords', ['or:%%%qu:e_r-y$', '____another____']]];

  t.deepEqual(r, e, 'found multiple keyword blocks');
  t.end();
});

test('keywords mixed with query', function(t) {
  var r = terms('(keywords:ecosystem:cordova keywords:cordova) && chrome');
  var e = [['keywords', ['ecosystem:cordova']], ['keywords', ['cordova']]];

  t.deepEqual(r, e, 'found multiple keyword blocks');
  t.end();
});
