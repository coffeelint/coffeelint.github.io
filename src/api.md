
If you'd like to run CoffeeScript in the browser or any other Javascript runtime, include [coffee-script.js](https://coffeescript.org/browser-compiler-legacy/coffeescript.js) and [coffeelint.js](https://coffeelint.github.io/js/coffeelint.js). Then you can call CoffeeLint directly with the following API:

`coffeelint.lint(source, configuration)`

Lints the CoffeeScript source with the given configuration and returns an array of lint errors and warnings. If the array is empty, all is well. Compile time errors will be thrown. An error is a Javascript object with the following properties:

- `rule` — name of the violated rule;
- `lineNumber` — number of the line that caused the violation;
- `level` — the severity level of the violated rule;
- `message` — information about the violated rule;
- `context` — optional details about why the rule was violated.

`coffeelint.registerRule(RuleConstructor)`

Registers a custom rule that may be run by CoffeeLint. If the rule is ignored by default it will still require overriding it's level just like the default rules. They have actually all be re-implemented as pluggable rules that come bundled in CoffeeLint.
