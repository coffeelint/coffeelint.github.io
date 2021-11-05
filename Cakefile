path = require 'node:path'
fs = require 'node:fs'
coffeelint = require '@coffeelint/cli'
marked = require 'marked'
syncDirectory = require 'sync-directory'
config = require './config.json'

compileTemplate = (source, data) ->
    return source.replace /\{\{[ ]?(\w*)[ ]?\}\}/gm, (m, v) ->
        if not data[v]
            throw new Error "Cannot find #{v}"
        return data[v]

task 'clean', 'Clean target directory', ->

    fs.rmSync "#{config.dist}", { recursive: true, force: true }
    fs.mkdirSync "#{config.dist}/rules", { recursive: true, mode: 0o755 }

task 'update', 'Update dependencies', ->

    child_process = require 'node:child_process'
    child_process.execSync "npm install @coffeelint/cli@#{process.COFFEELINT_VERSION ? 'latest'}"
    coffeelintPackage = require './node_modules/@coffeelint/cli/package.json'
    child_process.execSync "npm install coffeescript@#{coffeelintPackage.dependencies.coffeescript}"

task 'create:assets', 'Create assets directory', ->

    syncDirectory(
        path.resolve("#{config.src}/assets"),
        path.resolve("#{config.dist}/assets"))

    fs.copyFileSync(
        './node_modules/coffeescript/lib/coffeescript-browser-compiler-legacy/coffeescript.js',
        "#{config.dist}/assets/js/coffeescript.js")

    fs.copyFileSync(
        './node_modules/@coffeelint/cli/lib/coffeelint.js',
        "#{config.dist}/assets/js/coffeelint.js")

task 'create:html', 'Create HTML files', ->

    baseTemplateHTML = fs.readFileSync "#{config.src}/templates/base.html", 'utf8'

    for pageName of config.pages
        page = config.pages[pageName]
        # Skip unsuitable
        if not page.title
            continue
        # Create an HTML file
        pageHTML = compileTemplate baseTemplateHTML, {
            homepage: '.'
            title: page.title
            content: marked(fs.readFileSync "#{config.src}/pages/#{pageName}.md", 'utf8')
        }
        fs.writeFileSync "#{config.dist}/#{pageName}.html", pageHTML

    for ruleName of coffeelint.RULES
        rule = coffeelint.RULES[ruleName]
        # Skip unsuitable
        if not rule.name or not rule.level or not rule.message or not rule.description
            continue
        # Create an HTML file
        ruleHTML = compileTemplate baseTemplateHTML, {
            homepage: '..'
            title: "Rule \"#{rule.name}\" | CoffeeLint"
            content: """
            <h1>Rule "#{rule.name}"</h1>
            <p>#{rule.message}</p>
            <p><em>default level:</em> <code class="bg-#{rule.level}">#{rule.level}</code></p>
            #{marked rule.description}
            """
        }
        fs.writeFileSync "#{config.dist}/rules/#{rule.name}.html", ruleHTML
