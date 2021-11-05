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

        return true
    })

})()
