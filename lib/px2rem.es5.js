'use strict';

function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

var css = require('css');

var extend = require('extend');

var defaultConfig = {
  mediaQuery: [{
    mediaType: '(max-width: 1280px)',
    ratio: 0.5
  }, {
    mediaType: '(min-width: 1281px) and (max-width: 1920px)',
    ratio: 1
  }, {
    mediaType: '(min-width: 1921px)',
    ratio: 1.5
  }],
  remUnit: 75,
  remPrecision: 6,
  forcePxComment: 'px',
  forceRemComment: 'rem',
  keepComment: 'no',
  autoDealPx: ['font-size'],
  autoDealNo: ['border-radius', 'border', 'box-shadow', 'min-width', 'min-height', 'max-width', 'max-height'],
  appendAutoDealPx: [],
  appendAutoDealNo: []
};
var pxRegExp = /\b(\d+(\.\d+)?)px\b/;

function Px2rem(options) {
  this.config = {};
  extend(this.config, defaultConfig, options);
  var _this$config = this.config,
      appendAutoDealPx = _this$config.appendAutoDealPx,
      autoDealPx = _this$config.autoDealPx,
      appendAutoDealNo = _this$config.appendAutoDealNo,
      autoDealNo = _this$config.autoDealNo;
  concat(autoDealPx, appendAutoDealPx);
  concat(autoDealNo, appendAutoDealNo);
}

function arrayCheckNull(arr) {
  return arr && Array.isArray(arr) && arr.length > 0;
}

function concat(arr1, arr2) {
  if (arrayCheckNull(arr1) && arrayCheckNull(arr2)) {
    var _iterator = _createForOfIteratorHelper(arr2),
        _step;

    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var val = _step.value;

        if (!arr1.includes(val)) {
          arr1.push(val);
        }
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
  }
}

function generateMediaRule(mediaRules, declaration, rule, self) {
  mediaRules.forEach(function (mediaRule) {
    var newDeclaration = {};
    extend(true, newDeclaration, declaration);
    newDeclaration.value = self._getCalcValue('px', newDeclaration.value, mediaRule.ratio);
    var haveSameSelectors = false;

    var _iterator2 = _createForOfIteratorHelper(mediaRule.rules),
        _step2;

    try {
      for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
        var rule1 = _step2.value;

        if (JSON.stringify(rule1.selectors) === JSON.stringify(rule.selectors)) {
          rule1.declarations.push(newDeclaration);
          haveSameSelectors = true;
        }
      }
    } catch (err) {
      _iterator2.e(err);
    } finally {
      _iterator2.f();
    }

    if (!haveSameSelectors) {
      var obj = {
        type: 'rule',
        selectors: rule.selectors,
        declarations: [newDeclaration]
      };
      mediaRule.rules.push(obj);
    }
  });
}

Px2rem.prototype.generateRem = function (cssText) {
  var self = this;
  var config = self.config;
  var astObj = css.parse(cssText);
  var mediaRules = config.mediaQuery.map(function (val) {
    return {
      type: 'media',
      media: val.mediaType,
      ratio: val.ratio,
      rules: []
    };
  });

  function processRules(rules, noDealPx) {
    for (var i = 0; i < rules.length; i++) {
      var rule = rules[i];

      if (rule.type === 'media') {
        processRules(rule.rules, true);
        continue;
      } else if (rule.type === 'keyframes') {
        processRules(rule.keyframes, true);
        continue;
      } else if (rule.type !== 'rule' && rule.type !== 'keyframe') {
        continue;
      }

      var declarations = rule.declarations;

      for (var j = 0; j < declarations.length; j++) {
        var declaration = declarations[j];

        if (declaration.type === 'declaration' && pxRegExp.test(declaration.value)) {
          var nextDeclaration = declarations[j + 1];

          if (nextDeclaration && nextDeclaration.type === 'comment') {
            if (nextDeclaration.comment.trim() === config.forcePxComment) {
              if (declaration.value === '0px') {
                declaration.value = '0';
                declarations.splice(j + 1, 1);
                continue;
              }

              if (!noDealPx) {
                generateMediaRule(mediaRules, declaration, rule, self);
                declarations.splice(j, 2);
                j--;
              } else {
                declaration.value = self._getCalcValue('rem', declaration.value);
                declarations.splice(j + 1, 1);
              }
            } else if (nextDeclaration.comment.trim() === config.keepComment) {
              declarations.splice(j + 1, 1);
            } else if (nextDeclaration.comment.trim() === config.forceRemComment) {
              declaration.value = self._getCalcValue('rem', declaration.value);
              declarations.splice(j + 1, 1);
            } else if (config.autoDealPx.includes(declaration.property)) {
              if (declaration.value === '0px') {
                declaration.value = '0';
                continue;
              }

              if (!noDealPx) {
                generateMediaRule(mediaRules, declaration, rule, self);
                declarations.splice(j, 1);
                j--;
              } else {
                declaration.value = self._getCalcValue('rem', declaration.value);
              }
            } else if (!config.autoDealNo.includes(declaration.property)) {
              declaration.value = self._getCalcValue('rem', declaration.value);
            }
          } else if (config.autoDealPx.includes(declaration.property)) {
            if (declaration.value === '0px') {
              declaration.value = '0';
              continue;
            }

            if (!noDealPx) {
              generateMediaRule(mediaRules, declaration, rule, self);
              declarations.splice(j, 1);
              j--;
            } else {
              declaration.value = self._getCalcValue('rem', declaration.value);
            }
          } else if (!config.autoDealNo.includes(declaration.property)) {
            declaration.value = self._getCalcValue('rem', declaration.value);
          }
        }
      }

      if (!rules[i].declarations.length) {
        rules.splice(i, 1);
        i--;
      }
    }

    if (!noDealPx) {
      var _iterator3 = _createForOfIteratorHelper(mediaRules),
          _step3;

      try {
        for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
          var mediaRule = _step3.value;

          if (mediaRule && arrayCheckNull(mediaRule.rules)) {
            rules.push(mediaRule);
          }
        }
      } catch (err) {
        _iterator3.e(err);
      } finally {
        _iterator3.f();
      }
    }
  }

  processRules(astObj.stylesheet.rules);
  return css.stringify(astObj);
};

Px2rem.prototype._getCalcValue = function (type, value, ratio) {
  var config = this.config;
  var pxGlobalRegExp = new RegExp(pxRegExp.source, 'g');

  function getValue(val) {
    val = parseFloat(val.toFixed(config.remPrecision));
    return val == 0 ? val : val + type;
  }

  return value.replace(pxGlobalRegExp, function ($0, $1) {
    return type === 'px' ? getValue($1 * ratio) : getValue($1 / config.remUnit);
  });
};

module.exports = Px2rem;