'use strict'

var assert = require('assert')
var Px2rem = require('../lib/px2rem.min')
var path = require('path')
var fs = require('fs')
var UglifyJS = require('uglify-js')

describe('should output test.result.css and px2rem.min.js', function () {
  var px2remIns = new Px2rem({
    /* remUnit: 75, baseDpr: 2, appendAutoDealNo: [ 'border', 'box-shadow'] */
  })
  var srcPath = path.join(__dirname, 'assets/test.css')
  var srcText = fs.readFileSync(srcPath, 'utf8')

  it('[generate] generate test.css to test.result.css', function () {
    var expectedPath = path.join(__dirname, 'output/test.result.css')
    var outputText = px2remIns.generateRem(srcText)
    fs.writeFile(expectedPath, outputText, function (err) {})
  })

//   it('[compress] compress px2rem.js to px2rem.min.js', function () {
//     var srcPath = path.join(__dirname, '../lib/px2rem.es5.js')
//     var code = fs.readFileSync(srcPath, 'utf8')
//     var result = UglifyJS.minify(code, { mangle: { toplevel: true } }).code
//     var resultPath = path.join(__dirname, '../lib/px2rem.min.js')
//     fs.writeFile(resultPath, result, function (err) {})
//   })
})
