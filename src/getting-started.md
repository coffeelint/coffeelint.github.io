
You can install CoffeeLint for your current project by using npm (requires an official [Node.js](https://nodejs.org/en/) distribution):

```sh
npm install @coffeelint/cli --save-dev
```

Or install it globally:

```sh
npm install @coffeelint/cli --global
```

Once you have CoffeeLint installed, you can generate a new configuration file:

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

CoffeeLint will automatically walk up the directory tree looking for a config file, or a "package.json", that has a "coffeelintConfig" object. If neither of those are found, or you're linting from STDIN, it will check your home dir.
