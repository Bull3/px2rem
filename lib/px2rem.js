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
  remUnit: 75,            // rem unit value (default: 75)
  remPrecision: 6,        // rem value precision (default: 6)
  forcePxComment: 'px',   // force px comment (default: `px`)
  forceRemComment: 'rem',   // force rem comment (default: `rem`)
  keepComment: 'no',       // no transform value comment (default: `no`)
  //comment have higher priority than below array
  autoDealPx: ['font-size'],
  autoDealNo: ['border-radius', 'border', 'box-shadow', 'min-width', 'min-height', 'max-width', 'max-height'],
  appendAutoDealPx: [],
  appendAutoDealNo: []
};

var pxRegExp = /\b(\d+(\.\d+)?)px\b/;

function Px2rem(options) {
  this.config = {};
  extend(this.config, defaultConfig, options);
  let { appendAutoDealPx, autoDealPx, appendAutoDealNo, autoDealNo } = this.config
  concat(autoDealPx, appendAutoDealPx)
  concat(autoDealNo, appendAutoDealNo)
}

function arrayCheckNull(arr) {
  return arr && Array.isArray(arr) && arr.length > 0
}

function concat(arr1, arr2) {
  if (arrayCheckNull(arr1) && arrayCheckNull(arr2)) {
    for (const val of arr2) {
      if (!arr1.includes(val)) {
        arr1.push(val)
      }
    }
  }
}

function generateMediaRule(mediaRules, declaration, rule, self) {
  mediaRules.forEach((mediaRule) => {
    let newDeclaration = {};
    extend(true, newDeclaration, declaration);
    newDeclaration.value = self._getCalcValue('px', newDeclaration.value, mediaRule.ratio);
    let haveSameSelectors = false
    for (const rule1 of mediaRule.rules) {
      if (JSON.stringify(rule1.selectors) === JSON.stringify(rule.selectors)) {
        rule1.declarations.push(newDeclaration)
        haveSameSelectors = true
      }
    }
    if (!haveSameSelectors) {
      let obj = {
        type: 'rule',
        selectors: rule.selectors,
        declarations: [newDeclaration]
      }
      mediaRule.rules.push(obj)
    }
  })
}

Px2rem.prototype.generateRem = function (cssText) {
  var self = this;
  var config = self.config;
  var astObj = css.parse(cssText);
  var mediaRules = config.mediaQuery.map(val => {
    return {
      type: 'media',
      media: val.mediaType,
      ratio: val.ratio,
      rules: []
    }
  })

  function processRules(rules, noDealPx) { //keyframes and media do not support `force px` comment and autoDealPx

    for (var i = 0; i < rules.length; i++) {
      var rule = rules[i];
      if (rule.type === 'media') {
        processRules(rule.rules, true); // recursive invocation while dealing with media queries
        continue;
      } else if (rule.type === 'keyframes') {
        processRules(rule.keyframes, true); // recursive invocation while dealing with keyframes
        continue;
      } else if (rule.type !== 'rule' && rule.type !== 'keyframe') {
        continue;
      }



      var declarations = rule.declarations;
      for (var j = 0; j < declarations.length; j++) {
        var declaration = declarations[j];
        // need transform: declaration && has 'px'
        if (declaration.type === 'declaration' && pxRegExp.test(declaration.value)) {
          var nextDeclaration = declarations[j + 1];
          if ((nextDeclaration && nextDeclaration.type === 'comment')) { // next next declaration is comment
            if (nextDeclaration.comment.trim() === config.forcePxComment) { // force px
              // do not transform `0px`
              if (declaration.value === '0px') {
                declaration.value = '0';
                declarations.splice(j + 1, 1); // delete corresponding comment
                continue;
              }
              if (!noDealPx) {
                generateMediaRule(mediaRules, declaration, rule, self)
                declarations.splice(j, 2); // delete this rule and corresponding comment
                j--;
              } else { // FIXME: keyframes do not support `force px` comment
                declaration.value = self._getCalcValue('rem', declaration.value); // common transform
                declarations.splice(j + 1, 1); // delete corresponding comment
              }
            } else if (nextDeclaration.comment.trim() === config.keepComment) { // no transform
              declarations.splice(j + 1, 1); // delete corresponding comment
            } else if (nextDeclaration.comment.trim() === config.forceRemComment) { // no transform
              declaration.value = self._getCalcValue('rem', declaration.value); // common transform
              declarations.splice(j + 1, 1); // delete corresponding comment
            } else if (config.autoDealPx.includes(declaration.property)) {
              if (declaration.value === '0px') {
                declaration.value = '0';
                continue;
              }
              if (!noDealPx) {
                generateMediaRule(mediaRules, declaration, rule, self)
                declarations.splice(j, 1); // delete this rule
                j--;
              } else {
                declaration.value = self._getCalcValue('rem', declaration.value); // common transform
              }
            } else if (!config.autoDealNo.includes(declaration.property)) {
              declaration.value = self._getCalcValue('rem', declaration.value); // common transform
            }
          } else if (config.autoDealPx.includes(declaration.property)) {
            if (declaration.value === '0px') {
              declaration.value = '0';
              continue;
            }
            if (!noDealPx) {
              generateMediaRule(mediaRules, declaration, rule, self)
              declarations.splice(j, 1); // delete this rule
              j--;
            } else {
              declaration.value = self._getCalcValue('rem', declaration.value); // common transform
            }
          } else if (!config.autoDealNo.includes(declaration.property)) {
            declaration.value = self._getCalcValue('rem', declaration.value); // common transform
          }
        }
      }

      // if the origin rule has no declarations, delete it
      if (!rules[i].declarations.length) {
        rules.splice(i, 1);
        i--;
      }

    }
    if (!noDealPx) {
      for (const mediaRule of mediaRules) {
        if (mediaRule && arrayCheckNull(mediaRule.rules)) {
          rules.push(mediaRule)
        }
      }
    }

  }

  processRules(astObj.stylesheet.rules);

  return css.stringify(astObj);
};

// get calculated value of px or rem
Px2rem.prototype._getCalcValue = function (type, value, ratio) {
  var config = this.config;
  var pxGlobalRegExp = new RegExp(pxRegExp.source, 'g');

  function getValue(val) {
    val = parseFloat(val.toFixed(config.remPrecision)); // control decimal precision of the calculated value
    return val == 0 ? val : val + type;
  }

  return value.replace(pxGlobalRegExp, function ($0, $1) {
    return type === 'px' ? getValue($1 * ratio) : getValue($1 / config.remUnit);
  });
};

module.exports = Px2rem;
