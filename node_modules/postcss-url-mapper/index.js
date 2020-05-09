'use strict';

var URL_REGEX = /url\(\s*['"]?(?!['"]?data:)(.*?)['"]?\s*\)/g;
var PROP_REGEX = /^(-(webkit|moz|o|ms)-)?(?=--|cue|play|mask|background|content|src|cursor|list-style)/;

module.exports = require('postcss').plugin('postcss-url-mapper', function (map) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : { atRules: false };

  var replacer = function replacer(value, name) {
    return value.replace(URL_REGEX, function (match, url) {
      return 'url("' + map(url, name) + '")';
    });
  };

  return function (css) {
    if (typeof map !== 'function') return;

    css.walkDecls(PROP_REGEX, function (decl) {
      decl.value = replacer(decl.value, decl.prop);
    });

    if (options.atRules) {
      css.walkAtRules('import', function (rule) {
        rule.params = replacer(rule.params, rule.name);
      });
    }
  };
});
