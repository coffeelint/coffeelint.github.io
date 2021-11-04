/* global CoffeeScript, coffeelint */
;(function() {

    function getInitialSourceCode() {
        return `# Try CoffeeLint here!
class Animal
  constructor: (@name) ->
  move: (meters) ->
    console.log "#{@name} moved #{meters}m."`
    }

    function getInitialConfigJson() {
        const config = JSON.parse(JSON.stringify(coffeelint.getRules())) // deep clone object
        for (const rule in config) {
            delete config[rule].name
            delete config[rule].message
            delete config[rule].description
        }
        return JSON.stringify(config, null, "    ")
    }

    function parseConfigFromJson(str) {
        try {
            return JSON.parse(str)
        } catch {
            throw new Error("Invalid configuration: Must be valid JSON")
        }
    }

    document.addEventListener("DOMContentLoaded", () => {

        const demo = document.querySelector(".demo")
        if (!demo || typeof CoffeeScript === "undefined" || typeof coffeelint === "undefined")
            return false
        // console.log(`CoffeeScript ${CoffeeScript.VERSION} & CoffeeLint ${coffeelint.VERSION}`)
        const source = demo.querySelector(".source")
        const config = demo.querySelector(".config")
        const report = demo.querySelector(".report")
        const action = demo.querySelector(".action")

        source.value = getInitialSourceCode()
        config.value = getInitialConfigJson()

        source.addEventListener("keyup", runLinter)
        config.addEventListener("keyup", runLinter)
        action.addEventListener("click", runLinter)

        function runLinter() {
            const reportList = []
            try {
                const errors = coffeelint.lint(source.value, parseConfigFromJson(config.value))
                for (const err of errors) {
                    const props = [ "name", "level", "message", "lineNumber", "columnNumber" ]
                    if (props.every((prop) => prop in err))
                        reportList.push(`
                            <div class="report__message">
                                <span class="fg-ignore">${err.lineNumber}:${err.columnNumber}</span>
                                <span class="fg-${err.level}">${err.level}</span>
                                ${err.message}
                                <span class="fg-ignore">coffeelint/${err.name}</span>
                            </div>`)
                    else if ("message" in err)
                        reportList.push(`
                            <div class="report__message fg-error">${err.message}</div>`)
                }
            } catch (err) {
                reportList.push(`
                    <div class="report__message fg-error">${err.message}</div>`)
            }
            printReportList(reportList)
        }

        function printReportList(reportList) {
            report.innerHTML = !reportList.length
                ? "<div class=\"report__message fg-success\">No errors &#x1F44D</div>"
                : ""
            for (const msg of reportList) report.innerHTML+= msg
        }
        return true
    })

})()
