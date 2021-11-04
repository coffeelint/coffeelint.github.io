
# Getting started

CoffeeLint is a configurable linter tool, that helps you avoid bugs and enforce conventions in your [CoffeeScript](https://coffeescript.org/) code. It makes your code more clean and consistent. It can be tuned to fit your preferred coding style.

You can install CoffeeLint for your current project by using npm (requires an official [Node.js](https://nodejs.org/en/) distribution):

```sh
npm install @coffeelint/cli --save-dev
```

Or install it globally:

```sh
npm install @coffeelint/cli --global
```

Then you can generate a new configuration file:

```sh
coffeelint --makeconfig > .coffeelintrc.json
```

To lint your code, run:

```sh
coffeelint app.coffee
```

To specify your own configuration file, do:

```sh
coffeelint app.coffee --file path/to/your/.coffeelintrc.json
```

If you have a bug report, or any ideas, reach out on the [issues page](https://github.com/coffeelint/coffeelint/issues).
