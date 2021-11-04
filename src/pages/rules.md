
# Rules

There are over 40 rules built into CoffeeLint. Also `coffeescript_error` means an error while source parsing.

### Possible errors

Rule name | Rule message
---- | -----------
[cyclomatic_complexity](./rules/cyclomatic_complexity.html) | The cyclomatic complexity is too damn high
[duplicate_key](./rules/duplicate_key.html) | Duplicate key defined in object or class
[indentation](./rules/indentation.html) | Line contains inconsistent indentation
[line_endings](./rules/line_endings.html) | Line contains incorrect line endings
[missing_fat_arrows](./rules/missing_fat_arrows.html) | Used `this` in a function without a fat arrow `=>`
[missing_parseint_radix](./rules/missing_parseint_radix.html) | `parseInt()` is missing the radix argument
[no_backticks](./rules/no_backticks.html) | Backticks are forbidden
[no_debugger](./rules/no_debugger.html) | Found debugging code
[no_empty_functions](./rules/no_empty_functions.html) | Empty function
[no_interpolation_in_single_quotes](./rules/no_interpolation_in_single_quotes.html) | Interpolation in single quoted strings is forbidden
[no_nested_string_interpolation](./rules/no_nested_string_interpolation.html) | Nested string interpolation is forbidden
[no_throwing_strings](./rules/no_throwing_strings.html) | Throwing strings is forbidden

### Stylistic issues

Rule name | Rule message
---- | -----------
[arrow_spacing](./rules/arrow_spacing.html) | Function arrows (`->` and `=>`) must be spaced properly
[braces_spacing](./rules/braces_spacing.html) | Curly braces `{}` must have the proper spacing
[bracket_spacing](./rules/bracket_spacing.html) | Square brackets `[]` must have the proper spacing
[camel_case_classes](./rules/camel_case_classes.html) | Class name should be in `PascalCase` style
[colon_assignment_spacing](./rules/colon_assignment_spacing.html) | Colon `:` assignment without proper spacing
[empty_constructor_needs_parens](./rules/empty_constructor_needs_parens.html) | Invoking a constructor without parens `()` and without arguments
[ensure_comprehensions](./rules/ensure_comprehensions.html) | Comprehensions must have parentheses `()` around them
[eol_last](./rules/eol_last.html) | File does not end with a single newline
[max_line_length](./rules/max_line_length.html) | Line exceeds maximum allowed length
[newlines_after_classes](./rules/newlines_after_classes.html) | Wrong count of blank lines between a class and other code
[no_empty_param_list](./rules/no_empty_param_list.html) | Empty parameter list is forbidden
[no_implicit_braces](./rules/no_implicit_braces.html) | Implicit braces `{}` are forbidden
[no_implicit_parens](./rules/no_implicit_parens.html) | Implicit parens `()` are forbidden
[no_plusplus](./rules/no_plusplus.html) | The increment `++` and decrement `--` operators are forbidden
[no_private_function_fat_arrows](./rules/no_private_function_fat_arrows.html) | Used the fat arrow `=>` for a private function
[no_spaces](./rules/no_spaces.html) | Line contains space indentation
[no_stand_alone_at](./rules/no_stand_alone_at.html) | `@` must not be used stand alone
[no_tabs](./rules/no_tabs.html) | Line contains tab indentation
[no_this](./rules/no_this.html) | Use `@` instead of `this`
[no_trailing_semicolons](./rules/no_trailing_semicolons.html) | Line contains a trailing semicolon `;`
[no_trailing_whitespace](./rules/no_trailing_whitespace.html) | Line ends with trailing whitespace
[no_unnecessary_double_quotes](./rules/no_unnecessary_double_quotes.html) | Unnecessary double quotes `""` are forbidden
[no_unnecessary_fat_arrows](./rules/no_unnecessary_fat_arrows.html) | Unnecessary fat arrow `=>`
[non_empty_constructor_needs_parens](./rules/non_empty_constructor_needs_parens.html) | Invoking a constructor without parens `()` and with arguments
[object_shorthand](./rules/object_shorthand.html) | Use property-value shorthand when using explicit braces `{}`
[prefer_english_operator](./rules/prefer_english_operator.html) | Don't use `&&`, `\|\|`, `==`, `!=`, or `!`
[prefer_fat_arrows_in_methods](./rules/prefer_fat_arrows_in_methods.html) | Require fat arrows `=>` inside method bodies
[prefer_logical_operator](./rules/prefer_logical_operator.html) | Don't use `is`, `isnt`, `not`, `and`, `or`, `yes`, `on`, `no`, `off`
[space_operators](./rules/space_operators.html) | Operators must be spaced properly
[spacing_after_comma](./rules/spacing_after_comma.html) | a space is required after commas `,`
[transform_messes_up_line_numbers](./rules/transform_messes_up_line_numbers.html) | Transforming source messes up line numbers
