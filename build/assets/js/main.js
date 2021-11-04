/* global CoffeeScript, coffeelint */
;(function() {

    document.addEventListener("DOMContentLoaded", () => {

        if (typeof CoffeeScript === "undefined" || typeof coffeelint === "undefined")
            return false
        // console.log(`CoffeeScript ${CoffeeScript.VERSION} & CoffeeLint ${coffeelint.VERSION}`)

        document.querySelector("#version").textContent = coffeelint.VERSION
        document.querySelector("#year").textContent = new Date().getUTCFullYear()

        return true
    })

})()
