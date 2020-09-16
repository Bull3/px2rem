'use strict';

var assert = require('assert');
var Px2rem = require('../lib/px2rem');
var path = require('path');
var fs = require('fs');

describe('should work with @2x origin css file', function () {
  var px2remIns = new Px2rem({/* remUnit: 75, baseDpr: 2, appendAutoDealNo: [ 'border', 'box-shadow'] */});
  var srcPath = path.join(__dirname, 'assets/test.css');
  var srcText = fs.readFileSync(srcPath, {encoding: 'utf8'});

  it('[default] should output right rem file', function () {
    var expectedPath = path.join(__dirname, 'output/test.result.css');
    var outputText = px2remIns.generateRem(srcText);
    fs.writeFile(expectedPath, outputText,  function(err) {});
  });
})
