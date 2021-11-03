
CoffeeLint will automatically walk up the directory tree looking for a config file, or a "package.json", that has a `coffeelintConfig` property. If neither of those are found, or you're linting from STDIN, it will check your home directory.

Possible names for the config file:

- "coffeelint.json"
- ".coffeelintrc.json"

The configuration can be extended by the `extends` property.

```json
{
    "extends": "@dopustim/coffeelint-config"
}
```

You can also reassign any rule for your needs:

```json
{
    "extends": "@dopustim/coffeelint-config",
    "max_line_length": { "value": 100, "limitComments": true, "level": "warn" }
}
```

Levels:

- `ignore` — disable a rule;
- `warn` — enable a rule as warninig;
- `error` — enable a rule as error.

To disable a rule inline use the following:

```coffee
# coffeelint: disable=max_line_length
foo = "some/huge/line/string/with/embed/#{values}.that/surpasses/the/max/column/width"
# coffeelint: enable=max_line_length
```

You can also disable all checks for a single line by appending # noqa at the end of the line:

```coffee
throw "I should be an Error not a string but YOLO" # noqa
```
