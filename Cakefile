child_process = require 'child_process'
{ marked } = require 'marked'
fs = require 'fs'

task 'compile', 'Compiles index.html', ->
    invoke 'update'

    changelog = fs.readFileSync('./node_modules/@coffeelint/cli/CHANGELOG.md').toString()
    template = fs.readFileSync('./scripts/template.html').toString()
    template = template.replace '{{{changelog}}}', marked changelog
    template = template.replace '{{{rules}}}', require './scripts/rules.coffee'

    fs.writeFileSync './index.html', template

task 'update', 'Update coffeelint.js and coffeescript.js and jquery.js', ->
    child_process.execSync "npm install @coffeelint/cli@#{process.COFFEELINT_VERSION ? 'latest'}"
    coffeelintPackage = require './node_modules/@coffeelint/cli/package.json'
    coffeescriptVersion = coffeelintPackage.dependencies.coffeescript
    child_process.execSync "npm install coffeescript@#{coffeescriptVersion}"
    child_process.execSync 'npm install jquery'

    coffeelintFile = './node_modules/@coffeelint/cli/lib/coffeelint.js'
    coffeescriptFile =
        './node_modules/coffeescript/lib/coffeescript-browser-compiler-legacy/coffeescript.js'
    jqueryFile = './node_modules/jquery/dist/jquery.min.js'

    fs.copyFileSync coffeelintFile, './js/coffeelint.js'
    fs.copyFileSync coffeescriptFile, './js/coffeescript.js'
    fs.copyFileSync jqueryFile, './js/jquery.min.js'
