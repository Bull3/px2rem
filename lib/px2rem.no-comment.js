'use strict';

var css = require('css');
var extend = require('extend');

var defaultConfig = {
  mediaQuery: [
    {
      mediaType: '(max-width: 1280px)',
      ratio: 0.5
    },
    {
      mediaType: '(min-width: 1281px) and (max-width: 1920px)',
      ratio: 1
    },
    {
      mediaType: '(min-width: 1921px)',
      ratio: 1.5
    }
  ],
  remUnit: 75,
  remPrecision: 6,
  forcePxComment: 'px',
  forceRemComment: 'rem',
  keepComment: 'no',

  autoDealPx: ['font-size'],

  autoDealNo: ['border', 'shadow', 'min', 'max'],
  appendAutoDealPx: [],
  appendAutoDealNo: []
};

var pxRegExp = /\b(\d+(\.\d+)?)px\b/;

function Px2rem(options) {
  this.config = {};
  extend(this.config, defaultConfig, options);
  let {
    appendAutoDealPx,
    autoDealPx,
    appendAutoDealNo,
    autoDealNo
  } = this.config;
  concat(autoDealPx, appendAutoDealPx);
  concat(autoDealNo, appendAutoDealNo);
}

function arrayCheckNull(arr) {
  return arr && Array.isArray(arr) && arr.length > 0;
}

function concat(arr1, arr2) {
  if (arrayCheckNull(arr1) && arrayCheckNull(arr2)) {
    for (const val of arr2) {
      if (!arr1.includes(val)) {
        arr1.push(val);
      }
    }
  }
}

function generateMediaRule(mediaRules, declaration, rule, self) {
  mediaRules.forEach((mediaRule) => {
    let newDeclaration = {};
    extend(true, newDeclaration, declaration);
    newDeclaration.value = self._getCalcValue(
      'px',
      newDeclaration.value,
      mediaRule.ratio
    );
    let haveSameSelectors = false;
    for (const rule1 of mediaRule.rules) {
      if (JSON.stringify(rule1.selectors) === JSON.stringify(rule.selectors)) {
        rule1.declarations.push(newDeclaration);
        haveSameSelectors = true;
      }
    }
    if (!haveSameSelectors) {
      let obj = {
        type: 'rule',
        selectors: rule.selectors,
        declarations: [newDeclaration]
      };
      mediaRule.rules.push(obj);
    }
  });
}

function propIncludeAutoDealKey(autoDealType, property, self) {
  return self.config[autoDealType].some((val) => property.includes(val));
}

Px2rem.prototype.generateRem = function (cssText) {
  var self = this;
  var config = self.config;
  var astObj = css.parse(cssText);
  var mediaRules = config.mediaQuery.map((val) => {
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

        if (
          declaration.type === 'declaration' &&
          pxRegExp.test(declaration.value)
        ) {
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
                declaration.value = self._getCalcValue(
                  'rem',
                  declaration.value
                );
                declarations.splice(j + 1, 1);
              }
            } else if (nextDeclaration.comment.trim() === config.keepComment) {
              declarations.splice(j + 1, 1);
            } else if (
              nextDeclaration.comment.trim() === config.forceRemComment
            ) {
              declaration.value = self._getCalcValue('rem', declaration.value);
              declarations.splice(j + 1, 1);
            } else if (
              propIncludeAutoDealKey('autoDealPx', declaration.property, self)
            ) {
              if (declaration.value === '0px') {
                declaration.value = '0';
                continue;
              }
              if (!noDealPx) {
                generateMediaRule(mediaRules, declaration, rule, self);
                declarations.splice(j, 1);
                j--;
              } else {
                declaration.value = self._getCalcValue(
                  'rem',
                  declaration.value
                );
              }
            } else if (
              !propIncludeAutoDealKey('autoDealNo', declaration.property, self)
            ) {
              declaration.value = self._getCalcValue('rem', declaration.value);
            }
          } else if (
            propIncludeAutoDealKey('autoDealPx', declaration.property, self)
          ) {
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
          } else if (
            !propIncludeAutoDealKey('autoDealNo', declaration.property, self)
          ) {
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
      for (const mediaRule of mediaRules) {
        if (mediaRule && arrayCheckNull(mediaRule.rules)) {
          rules.push(mediaRule);
        }
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
