fs = require 'fs'

task 'compile', 'Compiles index.html', ->
    invoke 'update'

    top = fs.readFileSync('./scripts/index-top.html').toString()
    rules = require('./scripts/rules.coffee')
    bottom = fs.readFileSync('./scripts/index-bottom.html').toString()

    fs.writeFileSync './index.html', top + rules + bottom

task 'update', 'Update coffeelint.js and coffeescript.js', ->
    coffeelintFile = './node_modules/@coffeelint/cli/lib/coffeelint.js'
    coffeescriptFile = './node_modules/@coffeelint/cli/' +
        'node_modules/coffeescript/lib/coffeescript-browser-compiler-legacy/coffeescript.js'
    fs.copyFileSync coffeelintFile, './js/coffeelint.js'
    fs.copyFileSync coffeescriptFile, './js/coffeescript.js'
