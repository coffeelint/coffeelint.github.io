/* global CoffeeScript, coffeelint */
;(function() {

    document.addEventListener("DOMContentLoaded", () => {

        if (typeof CoffeeScript === "undefined" || typeof coffeelint === "undefined")
            return false
        // console.log(`CoffeeScript ${CoffeeScript.VERSION} & CoffeeLint ${coffeelint.VERSION}`)

        const version = document.querySelector("#version")

        if (version)
            version.textContent = coffeelint.VERSION

        const year = document.querySelector("#year")

        if (year)
            year.textContent = new Date().getUTCFullYear()

        const rules = document.querySelector("#rules-table")

        if (rules) {
            rules.innerHTML+= "<tr><td>Rule name<td>Rule message"

            const coffeelintRules = JSON.parse(JSON.stringify(coffeelint.getRules()))

            for (const ruleName in coffeelintRules) {
                const rule = coffeelintRules[ruleName]
                rules.innerHTML+= `<tr><td>${rule.name}<td>${rule.message}`
            }
        }
        return true
    })

})()
