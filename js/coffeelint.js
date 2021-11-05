(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.coffeelint = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
module.exports={
  "name": "@coffeelint/cli",
  "description": "Lint your CoffeeScript",
  "version": "5.1.1",
  "homepage": "https://coffeelint.github.io/",
  "keywords": [
    "lint",
    "coffeescript",
    "coffee-script"
  ],
  "author": "Tony Brix <Tony@Brix.ninja> (https://Tony.Brix.ninja)",
  "main": "./lib/coffeelint.js",
  "engines": {
    "node": ">=12.x"
  },
  "repository": {
    "type": "git",
    "url": "git://github.com/coffeelint/coffeelint.git"
  },
  "bin": {
    "coffeelint": "./bin/coffeelint"
  },
  "dependencies": {
    "coffeescript": "2.6.1",
    "glob": "^7.1.6",
    "ignore": "^5.1.8",
    "resolve": "^1.20.0",
    "strip-json-comments": "^3.1.1",
    "yargs": "^17.0.1"
  },
  "devDependencies": {
    "@semantic-release/changelog": "^6.0.0",
    "@semantic-release/commit-analyzer": "^9.0.1",
    "@semantic-release/git": "^10.0.0",
    "@semantic-release/github": "^8.0.0",
    "@semantic-release/npm": "^8.0.0",
    "@semantic-release/release-notes-generator": "^10.0.2",
    "browserify": "^17.0.0",
    "coffeeify": "^3.0.1",
    "semantic-release": "^18.0.0",
    "underscore": "^1.13.1",
    "vows": "^0.8.3"
  },
  "license": "MIT",
  "scripts": {
    "test": "npm run compile && node ./vowsrunner.js --dot-matrix test/*.coffee test/*.litcoffee",
    "testrule": "npm run compile && node ./vowsrunner.js --spec",
    "lint": "npm run compile && node ./bin/coffeelint .",
    "lint-csv": "npm run compile && node ./bin/coffeelint --reporter csv .",
    "lint-jslint": "npm run compile && node ./bin/coffeelint --reporter jslint .",
    "compile": "cake compile",
    "prepublishOnly": "npm run compile"
  }
}

},{}],2:[function(require,module,exports){
var ASTApi, ASTLinter, BaseLinter, hasChildren, node_children,
  hasProp = {}.hasOwnProperty;

BaseLinter = require('./base_linter.coffee');

node_children = {
  Class: ['variable', 'parent', 'body'],
  Code: ['params', 'body'],
  For: ['body', 'source', 'guard', 'step'],
  If: ['condition', 'body', 'elseBody'],
  Obj: ['properties'],
  Op: ['first', 'second'],
  Switch: ['subject', 'cases', 'otherwise'],
  Try: ['attempt', 'recovery', 'ensure'],
  Value: ['base', 'properties'],
  While: ['condition', 'guard', 'body']
};

hasChildren = function(node, children) {
  var ref;
  return (node != null ? (ref = node.children) != null ? ref.length : void 0 : void 0) === children.length && (node != null ? node.children.every(function(elem, i) {
    return elem === children[i];
  }) : void 0);
};

ASTApi = class ASTApi {
  constructor(config1) {
    this.config = config1;
  }

  getNodeName(node) {
    var children, name, ref;
    name = node != null ? (ref = node.constructor) != null ? ref.name : void 0 : void 0;
    if (node_children[name]) {
      return name;
    } else {
      for (name in node_children) {
        if (!hasProp.call(node_children, name)) continue;
        children = node_children[name];
        if (hasChildren(node, children)) {
          return name;
        }
      }
    }
  }

};

// A class that performs static analysis of the abstract
// syntax tree.
module.exports = ASTLinter = class ASTLinter extends BaseLinter {
  constructor(source, config, rules, CoffeeScript) {
    super(source, config, rules);
    this.CoffeeScript = CoffeeScript;
    this.astApi = new ASTApi(this.config);
  }

  // This uses lintAST instead of lintNode because I think it makes it a bit
  // more clear that the rule needs to walk the AST on its own.
  acceptRule(rule) {
    return typeof rule.lintAST === 'function';
  }

  lint() {
    var coffeeError, err, errors, j, len, ref, rule, v;
    errors = [];
    try {
      this.node = this.CoffeeScript.nodes(this.source);
    } catch (error) {
      coffeeError = error;
      // If for some reason you shut off the 'coffeescript_error' rule err
      // will be null and should NOT be added to errors
      err = this._parseCoffeeScriptError(coffeeError);
      if (err != null) {
        errors.push(err);
      }
      return errors;
    }
    ref = this.rules;
    for (j = 0, len = ref.length; j < len; j++) {
      rule = ref[j];
      this.astApi.createError = (attrs = {}) => {
        return this.createError(rule.rule.name, attrs);
      };
      // HACK: Push the local errors object into the plugin. This is a
      // temporary solution until I have a way for it to really return
      // multiple errors.
      rule.errors = errors;
      v = this.normalizeResult(rule, rule.lintAST(this.node, this.astApi));
      if (v != null) {
        return v;
      }
    }
    return errors;
  }

  _parseCoffeeScriptError(coffeeError) {
    var attrs, columnNumber, lineNumber, match, message, rule;
    rule = this.config['coffeescript_error'];
    message = coffeeError.toString();
    // Parse the line number
    lineNumber = -1;
    if (coffeeError.location != null) {
      lineNumber = coffeeError.location.first_line + 1;
      columnNumber = coffeeError.location.first_column + 1;
    } else {
      match = /line (\d+)/.exec(message);
      if ((match != null ? match.length : void 0) > 1) {
        lineNumber = parseInt(match[1], 10);
      }
      columnNumber = 1;
    }
    attrs = {
      message: message,
      level: rule.level,
      lineNumber: lineNumber,
      columnNumber: columnNumber
    };
    return this.createError('coffeescript_error', attrs);
  }

};


},{"./base_linter.coffee":3}],3:[function(require,module,exports){
// Patch the source properties onto the destination.
var BaseLinter, defaults, extend;

extend = function(destination, ...sources) {
  var i, k, len, source, v;
  for (i = 0, len = sources.length; i < len; i++) {
    source = sources[i];
    (function() {
      var results;
      results = [];
      for (k in source) {
        v = source[k];
        results.push(destination[k] = v);
      }
      return results;
    })();
  }
  return destination;
};

// Patch any missing attributes from defaults to source.
defaults = function(source, defaults) {
  return extend({}, defaults, source);
};

module.exports = BaseLinter = class BaseLinter {
  constructor(source1, config, rules) {
    this.source = source1;
    this.config = config;
    this.setupRules(rules);
  }

  isObject(obj) {
    return obj === Object(obj);
  }

  // Create an error object for the given rule with the given
  // attributes.
  createError(ruleName, attrs = {}) {
    var level;
    // Level should default to what's in the config, but can be overridden.
    if (attrs.level == null) {
      attrs.level = this.config[ruleName].level;
    }
    level = attrs.level;
    if (level !== 'ignore' && level !== 'warn' && level !== 'error') {
      throw new Error(`unknown level ${level} for rule: ${ruleName}`);
    }
    if (level === 'error' || level === 'warn') {
      attrs.rule = ruleName;
      return defaults(attrs, this.config[ruleName]);
    } else {
      return null;
    }
  }

  acceptRule(rule) {
    throw new Error('acceptRule needs to be overridden in the subclass');
  }

  // Only rules that have a level of error or warn will even get constructed.
  setupRules(rules) {
    var RuleConstructor, level, name, results, rule;
    this.rules = [];
    results = [];
    for (name in rules) {
      RuleConstructor = rules[name];
      level = this.config[name].level;
      if (level === 'error' || level === 'warn') {
        rule = new RuleConstructor(this, this.config);
        if (this.acceptRule(rule)) {
          results.push(this.rules.push(rule));
        } else {
          results.push(void 0);
        }
      } else if (level !== 'ignore') {
        throw new Error(`unknown level ${level} for rule: ${name}`);
      } else {
        results.push(void 0);
      }
    }
    return results;
  }

  normalizeResult(p, result) {
    if (result === true) {
      return this.createError(p.rule.name);
    }
    if (this.isObject(result)) {
      return this.createError(p.rule.name, result);
    }
  }

};


},{}],4:[function(require,module,exports){
  /*
  CoffeeLint

  Copyright (c) 2011 Matthew Perpick.
  CoffeeLint is freely distributable under the MIT license.
  */
var ASTLinter, CoffeeScript, ERROR, ErrorReport, IGNORE, LexicalLinter, LineLinter, RULES, WARN, _rules, cache, coffeelint, defaults, difference, extend, getTokens, mergeDefaultConfig, nodeRequire, packageJSON, sameJSON, union,
  indexOf = [].indexOf,
  slice = [].slice;

// Coffeelint's namespace.
// Browserify wrapps this file in a UMD that will set window.coffeelint to
// exports
coffeelint = exports;

// Hide from browserify
nodeRequire = require;

if (typeof window !== "undefined" && window !== null) {
  // If we're in the browser assume CoffeeScript is already loaded.
  CoffeeScript = window.CoffeeScript;
}

// By using nodeRequire it prevents browserify from finding this dependency.
// If it isn't hidden there is an error attempting to inline CoffeeScript.
// if browserify uses `-i` to ignore the dependency it creates an empty shim
// which breaks NodeJS
// https://github.com/substack/node-browserify/issues/471

// Atom has a `window`, but not a `window.CoffeeScript`. Calling `nodeRequire`
// here should fix Atom without breaking anything else.
if (CoffeeScript == null) {
  CoffeeScript = nodeRequire('coffeescript');
}

if (CoffeeScript == null) {
  throw new Error('Unable to find CoffeeScript');
}

// Browserify will inline the file at compile time.
packageJSON = require('./../package.json');

// The current version of Coffeelint.
coffeelint.VERSION = packageJSON.version;

// CoffeeLint error levels.
ERROR = 'error';

WARN = 'warn';

IGNORE = 'ignore';

coffeelint.RULES = RULES = require('./rules.coffee');

// Patch the source properties onto the destination.
extend = function(destination, ...sources) {
  var j, k, len, source, v;
  for (j = 0, len = sources.length; j < len; j++) {
    source = sources[j];
    (function() {
      var results;
      results = [];
      for (k in source) {
        v = source[k];
        results.push(destination[k] = v);
      }
      return results;
    })();
  }
  return destination;
};

// Patch any missing attributes from defaults to source.
defaults = function(source, defaults) {
  return extend({}, defaults, source);
};

// Helper to add rules to disabled list
union = function(a, b) {
  var c, j, len, len1, n, results, x;
  c = {};
  for (j = 0, len = a.length; j < len; j++) {
    x = a[j];
    c[x] = true;
  }
  for (n = 0, len1 = b.length; n < len1; n++) {
    x = b[n];
    c[x] = true;
  }
  results = [];
  for (x in c) {
    results.push(x);
  }
  return results;
};

// Helper to remove rules from disabled list
difference = function(a, b) {
  var j, len, results, x;
  results = [];
  for (j = 0, len = a.length; j < len; j++) {
    x = a[j];
    if (indexOf.call(b, x) < 0) {
      results.push(x);
    }
  }
  return results;
};

LineLinter = require('./line_linter.coffee');

LexicalLinter = require('./lexical_linter.coffee');

ASTLinter = require('./ast_linter.coffee');

// Cache instance, disabled by default
cache = null;

// Merge default and user configuration.
mergeDefaultConfig = function(userConfig) {
  var config, rule, ruleConfig, ruleLoader;
  try {
    // When run from the browser it may not be able to find the ruleLoader.
    ruleLoader = nodeRequire('./ruleLoader');
    ruleLoader.loadFromConfig(coffeelint, userConfig);
  } catch (error) {}
  config = {};
  if (userConfig.coffeelint) {
    config.coffeelint = userConfig.coffeelint;
  }
  for (rule in RULES) {
    ruleConfig = RULES[rule];
    config[rule] = defaults(userConfig[rule], ruleConfig);
  }
  return config;
};

sameJSON = function(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
};

coffeelint.trimConfig = function(userConfig) {
  var config, dConfig, dValue, key, newConfig, ref, rule, value;
  newConfig = {};
  userConfig = mergeDefaultConfig(userConfig);
  for (rule in userConfig) {
    config = userConfig[rule];
    dConfig = RULES[rule];
    if (rule === 'coffeelint') {
      config.transforms = config._transforms;
      delete config._transforms;
      config.coffeescript = config._coffeescript;
      delete config._coffeescript;
      newConfig[rule] = config;
    } else if ((config.level === (ref = dConfig.level) && ref === 'ignore')) {
      // If the rule is going to be ignored and would be by default it
      // doesn't matter what you may have configured
      void 0;
    } else if (config.level === 'ignore') {
      // If the rule is being ignored you don't need the rest of the
      // config.
      newConfig[rule] = {
        level: 'ignore'
      };
    } else {
      config.module = config._module;
      delete config._module;
      for (key in config) {
        value = config[key];
        if (key === 'message' || key === 'description' || key === 'name') {
          continue;
        }
        dValue = dConfig[key];
        if (value !== dValue && !sameJSON(value, dValue)) {
          if (newConfig[rule] == null) {
            newConfig[rule] = {};
          }
          newConfig[rule][key] = value;
        }
      }
    }
  }
  return newConfig;
};

coffeelint.invertLiterate = function(source) {
  var j, len, line, newSource, ref;
  source = CoffeeScript.helpers.invertLiterate(source);
  // Strip the first 4 spaces or a tab from every line.
  // After this the markdown is commented and all of the other code
  // should be at their natural location.
  newSource = '';
  ref = source.split('\n');
  for (j = 0, len = ref.length; j < len; j++) {
    line = ref[j];
    if (line.match(/^#/)) {
      // strip trailing space
      line = line.replace(/\s*$/, '');
    }
    // Strip the first 4 spaces or a tab of every line. This is how Markdown
    // indicates code, so in the end this pulls everything back to where it
    // would be indented if it hadn't been written in literate style.
    line = line.replace(/^[ ]{4}|^\t/g, '');
    newSource += `${line}\n`;
  }
  return newSource;
};

_rules = {};

coffeelint.registerRule = function(RuleConstructor, ruleName = void 0) {
  var e, name, p, ref, ref1;
  p = new RuleConstructor();
  name = (p != null ? (ref = p.rule) != null ? ref.name : void 0 : void 0) || '(unknown)';
  e = function(msg) {
    throw new Error(`Invalid rule: ${name} ${msg}`);
  };
  if (p.rule == null) {
    e('Rules must provide rule attribute with a default configuration.');
  }
  if (p.rule.name == null) {
    e('Rule defaults require a name');
  }
  if ((ruleName != null) && ruleName !== p.rule.name) {
    e(`Mismatched rule name: ${ruleName}`);
  }
  if (p.rule.message == null) {
    e('Rule defaults require a message');
  }
  if (p.rule.description == null) {
    e('Rule defaults require a description');
  }
  if ((ref1 = p.rule.level) !== 'ignore' && ref1 !== 'warn' && ref1 !== 'error') {
    e("Default level must be 'ignore', 'warn', or 'error'");
  }
  if (typeof p.lintToken === 'function') {
    if (!p.tokens) {
      e("'tokens' is required for 'lintToken'");
    }
  } else if (typeof p.lintLine !== 'function' && typeof p.lintAST !== 'function') {
    e('Rules must implement lintToken, lintLine, or lintAST');
  }
  // Capture the default options for the new rule.
  RULES[p.rule.name] = p.rule;
  return _rules[p.rule.name] = RuleConstructor;
};

coffeelint.getRules = function() {
  var j, key, len, output, ref;
  output = {};
  ref = Object.keys(RULES).sort();
  for (j = 0, len = ref.length; j < len; j++) {
    key = ref[j];
    output[key] = RULES[key];
  }
  return output;
};

// These all need to be explicitly listed so they get picked up by browserify.
coffeelint.registerRule(require('./rules/arrow_spacing.coffee'));

coffeelint.registerRule(require('./rules/braces_spacing.coffee'));

coffeelint.registerRule(require('./rules/bracket_spacing.coffee'));

coffeelint.registerRule(require('./rules/no_tabs.coffee'));

coffeelint.registerRule(require('./rules/no_spaces.coffee'));

coffeelint.registerRule(require('./rules/no_trailing_whitespace.coffee'));

coffeelint.registerRule(require('./rules/max_line_length.coffee'));

coffeelint.registerRule(require('./rules/line_endings.coffee'));

coffeelint.registerRule(require('./rules/no_trailing_semicolons.coffee'));

coffeelint.registerRule(require('./rules/indentation.coffee'));

coffeelint.registerRule(require('./rules/camel_case_classes.coffee'));

coffeelint.registerRule(require('./rules/colon_assignment_spacing.coffee'));

coffeelint.registerRule(require('./rules/no_implicit_braces.coffee'));

coffeelint.registerRule(require('./rules/no_nested_string_interpolation.coffee'));

coffeelint.registerRule(require('./rules/no_plusplus.coffee'));

coffeelint.registerRule(require('./rules/no_throwing_strings.coffee'));

coffeelint.registerRule(require('./rules/no_backticks.coffee'));

coffeelint.registerRule(require('./rules/no_implicit_parens.coffee'));

coffeelint.registerRule(require('./rules/no_empty_param_list.coffee'));

coffeelint.registerRule(require('./rules/no_stand_alone_at.coffee'));

coffeelint.registerRule(require('./rules/space_operators.coffee'));

coffeelint.registerRule(require('./rules/duplicate_key.coffee'));

coffeelint.registerRule(require('./rules/empty_constructor_needs_parens.coffee'));

coffeelint.registerRule(require('./rules/cyclomatic_complexity.coffee'));

coffeelint.registerRule(require('./rules/newlines_after_classes.coffee'));

coffeelint.registerRule(require('./rules/no_unnecessary_fat_arrows.coffee'));

coffeelint.registerRule(require('./rules/missing_fat_arrows.coffee'));

coffeelint.registerRule(require('./rules/prefer_fat_arrows_in_methods.coffee'));

coffeelint.registerRule(require('./rules/non_empty_constructor_needs_parens.coffee'));

coffeelint.registerRule(require('./rules/no_unnecessary_double_quotes.coffee'));

coffeelint.registerRule(require('./rules/no_debugger.coffee'));

coffeelint.registerRule(require('./rules/no_interpolation_in_single_quotes.coffee'));

coffeelint.registerRule(require('./rules/no_empty_functions.coffee'));

coffeelint.registerRule(require('./rules/prefer_english_operator.coffee'));

coffeelint.registerRule(require('./rules/prefer_logical_operator.coffee'));

coffeelint.registerRule(require('./rules/spacing_after_comma.coffee'));

coffeelint.registerRule(require('./rules/transform_messes_up_line_numbers.coffee'));

coffeelint.registerRule(require('./rules/ensure_comprehensions.coffee'));

coffeelint.registerRule(require('./rules/no_this.coffee'));

coffeelint.registerRule(require('./rules/eol_last.coffee'));

coffeelint.registerRule(require('./rules/no_private_function_fat_arrows.coffee'));

coffeelint.registerRule(require('./rules/missing_parseint_radix.coffee'));

coffeelint.registerRule(require('./rules/object_shorthand.coffee'));

getTokens = function(source) {
  try {
    // If there are syntax errors this will abort the lexical and line
    // linters.
    return CoffeeScript.tokens(source);
  } catch (error) {}
  return null;
};

ErrorReport = require('./error_report.coffee');

coffeelint.getErrorReport = function() {
  return new ErrorReport(coffeelint);
};

// Check the source against the given configuration and return an array
// of any errors found. An error is an object with the following
// properties:

//   {
//       rule :      'Name of the violated rule',
//       lineNumber: 'Number of the line that caused the violation',
//       level:      'The error level of the violated rule',
//       message:    'Information about the violated rule',
//       context:    'Optional details about why the rule was violated'
//   }

coffeelint.lint = function(source, userConfig = {}, literate = false) {
  var allErrors, astErrors, cmd, config, disabled, disabledEntirely, disabledInitially, disabledLine, e, errors, i, inlineConfig, j, l, len, len1, lexErrors, lexicalLinter, lineErrors, lineLinter, m, n, name, nextLine, o, ref, ref1, ref2, ref3, ref4, ref5, ref6, ref7, ref8, regex, rule, ruleLoader, rules, set, sourceLength, tokens, tokensByLine, transform;
  errors = [];
  if (cache != null) {
    cache.setConfig(userConfig);
  }
  if (cache != null ? cache.has(source) : void 0) {
    return cache != null ? cache.get(source) : void 0;
  }
  config = mergeDefaultConfig(userConfig);
  if (literate) {
    source = this.invertLiterate(source);
  }
  if ((userConfig != null ? (ref = userConfig.coffeelint) != null ? ref.transforms : void 0 : void 0) != null) {
    sourceLength = source.split('\n').length;
    ref2 = userConfig != null ? (ref1 = userConfig.coffeelint) != null ? ref1.transforms : void 0 : void 0;
    for (j = 0, len = ref2.length; j < len; j++) {
      m = ref2[j];
      try {
        ruleLoader = nodeRequire('./ruleLoader');
        transform = ruleLoader.require(m);
        source = transform(source);
      } catch (error) {}
    }
    // NOTE: This can have false negatives. For example if your transformer
    // changes one line into two early in the file and later condenses two
    // into one you'll end up with the same length and not get the warning
    // even though everything in between will be off by one.
    if (sourceLength !== source.split('\n').length && config.transform_messes_up_line_numbers.level !== 'ignore') {
      errors.push(extend({
        lineNumber: 1,
        context: `File was transformed from ${sourceLength} lines to ${source.split("\n").length} lines`
      }, config.transform_messes_up_line_numbers));
    }
  }
  if ((userConfig != null ? (ref3 = userConfig.coffeelint) != null ? ref3.coffeescript : void 0 : void 0) != null) {
    CoffeeScript = ruleLoader.require(userConfig.coffeelint.coffeescript);
  }
// coffeescript_error is unique because it's embedded in the ASTLinter. It
// indicates a syntax error and would not work well as a stand alone rule.

// Why can't JSON just support comments?
  for (name in userConfig) {
    if (name !== 'coffeescript_error' && name !== '_comment') {
      if (_rules[name] == null) {
        // TODO: Figure out a good way to notify the user that they have
        // configured a rule that doesn't exist. throwing an Error was
        // definitely a mistake. I probably need a good way to generate lint
        // warnings for configuration.
        void 0;
      }
    }
  }
  // disabledInitially is to prevent the rule from becoming active before
  // the actual inlined comment appears
  disabledInitially = [];
  ref4 = source.split('\n');
  // Check ahead for inline enabled rules
  for (n = 0, len1 = ref4.length; n < len1; n++) {
    l = ref4[n];
    ref5 = LineLinter.getDirective(l) || [], [regex, set] = ref5, [rule] = slice.call(ref5, -1);
    if ((set === 'enable' || set === 'enable-line') && ((ref6 = config[rule]) != null ? ref6.level : void 0) === 'ignore') {
      disabledInitially.push(rule);
      config[rule].level = 'error';
    }
  }
  // Do AST linting first so all compile errors are caught.
  astErrors = new ASTLinter(source, config, _rules, CoffeeScript).lint();
  errors = errors.concat(astErrors);
  // only do further checks if the syntax is okay, otherwise they just fail
  // with syntax error exceptions
  tokens = getTokens(source);
  if (tokens) {
    // Do lexical linting.
    lexicalLinter = new LexicalLinter(source, config, _rules, CoffeeScript, tokens);
    lexErrors = lexicalLinter.lint();
    errors = errors.concat(lexErrors);
    // Do line linting.
    tokensByLine = lexicalLinter.tokensByLine;
    lineLinter = new LineLinter(source, config, _rules, tokensByLine, literate);
    lineErrors = lineLinter.lint();
    errors = errors.concat(lineErrors);
    inlineConfig = lineLinter.inlineConfig;
  } else {
    // default this so it knows what to do
    inlineConfig = {
      enable: {},
      disable: {},
      'enable-line': {},
      'disable-line': {}
    };
  }
  // Sort by line number and return.
  errors.sort(function(a, b) {
    return a.lineNumber - b.lineNumber;
  });
  // Create a list of all errors
  disabledEntirely = (function() {
    var len2, map, o, ref7, result;
    result = [];
    map = {};
    ref7 = errors || [];
    for (o = 0, len2 = ref7.length; o < len2; o++) {
      ({name} = ref7[o]);
      if (!map[name]) {
        result.push(name);
        map[name] = true;
      }
    }
    return result;
  })();
  // Disable/enable rules for inline blocks
  allErrors = errors;
  errors = [];
  disabled = disabledInitially;
  nextLine = 0;
  for (i = o = 0, ref7 = source.split('\n').length; (0 <= ref7 ? o < ref7 : o > ref7); i = 0 <= ref7 ? ++o : --o) {
    disabledLine = disabled;
    for (cmd in inlineConfig) {
      rules = inlineConfig[cmd][i];
      if (rules != null) {
        ({
          'disable': function() {
            if (rules.length) {
              disabled = union(disabled, rules);
              return disabledLine = union(disabledLine, rules);
            } else {
              return disabled = disabledLine = disabledEntirely;
            }
          },
          'disable-line': function() {
            if (rules.length) {
              return disabledLine = union(disabledLine, rules);
            } else {
              return disabledLine = disabledEntirely;
            }
          },
          'enable': function() {
            if (rules.length) {
              disabled = difference(disabled, rules);
              return disabledLine = difference(disabledLine, rules);
            } else {
              return disabled = disabledLine = disabledInitially;
            }
          },
          'enable-line': function() {
            if (rules.length) {
              return disabledLine = difference(disabledLine, rules);
            } else {
              return disabledLine = disabledInitially;
            }
          }
        })[cmd]();
      }
    }
    // advance line and append relevant messages
    while (nextLine === i && allErrors.length > 0) {
      nextLine = allErrors[0].lineNumber - 1;
      e = allErrors[0];
      if (e.lineNumber === i + 1 || (e.lineNumber == null)) {
        e = allErrors.shift();
        if (ref8 = e.rule, indexOf.call(disabledLine, ref8) < 0) {
          errors.push(e);
        }
      }
    }
  }
  if (cache != null) {
    cache.set(source, errors);
  }
  return errors;
};

coffeelint.setCache = function(obj) {
  return cache = obj;
};


},{"./../package.json":1,"./ast_linter.coffee":2,"./error_report.coffee":5,"./lexical_linter.coffee":6,"./line_linter.coffee":7,"./rules.coffee":8,"./rules/arrow_spacing.coffee":9,"./rules/braces_spacing.coffee":10,"./rules/bracket_spacing.coffee":11,"./rules/camel_case_classes.coffee":12,"./rules/colon_assignment_spacing.coffee":13,"./rules/cyclomatic_complexity.coffee":14,"./rules/duplicate_key.coffee":15,"./rules/empty_constructor_needs_parens.coffee":16,"./rules/ensure_comprehensions.coffee":17,"./rules/eol_last.coffee":18,"./rules/indentation.coffee":19,"./rules/line_endings.coffee":20,"./rules/max_line_length.coffee":21,"./rules/missing_fat_arrows.coffee":22,"./rules/missing_parseint_radix.coffee":23,"./rules/newlines_after_classes.coffee":24,"./rules/no_backticks.coffee":25,"./rules/no_debugger.coffee":26,"./rules/no_empty_functions.coffee":27,"./rules/no_empty_param_list.coffee":28,"./rules/no_implicit_braces.coffee":29,"./rules/no_implicit_parens.coffee":30,"./rules/no_interpolation_in_single_quotes.coffee":31,"./rules/no_nested_string_interpolation.coffee":32,"./rules/no_plusplus.coffee":33,"./rules/no_private_function_fat_arrows.coffee":34,"./rules/no_spaces.coffee":35,"./rules/no_stand_alone_at.coffee":36,"./rules/no_tabs.coffee":37,"./rules/no_this.coffee":38,"./rules/no_throwing_strings.coffee":39,"./rules/no_trailing_semicolons.coffee":40,"./rules/no_trailing_whitespace.coffee":41,"./rules/no_unnecessary_double_quotes.coffee":42,"./rules/no_unnecessary_fat_arrows.coffee":43,"./rules/non_empty_constructor_needs_parens.coffee":44,"./rules/object_shorthand.coffee":45,"./rules/prefer_english_operator.coffee":46,"./rules/prefer_fat_arrows_in_methods.coffee":47,"./rules/prefer_logical_operator.coffee":48,"./rules/space_operators.coffee":49,"./rules/spacing_after_comma.coffee":50,"./rules/transform_messes_up_line_numbers.coffee":51}],5:[function(require,module,exports){
// A summary of errors in a CoffeeLint run.
var ErrorReport;

module.exports = ErrorReport = class ErrorReport {
  constructor(coffeelint) {
    this.coffeelint = coffeelint;
    this.paths = {};
  }

  lint(filename, source, config = {}, literate = false) {
    return this.paths[filename] = this.coffeelint.lint(source, config, literate);
  }

  getExitCode() {
    var path;
    for (path in this.paths) {
      if (this.pathHasError(path)) {
        return 1;
      }
    }
    return 0;
  }

  getSummary() {
    var error, errorCount, errors, i, len, path, pathCount, ref, warningCount;
    pathCount = errorCount = warningCount = 0;
    ref = this.paths;
    for (path in ref) {
      errors = ref[path];
      pathCount++;
      for (i = 0, len = errors.length; i < len; i++) {
        error = errors[i];
        if (error.level === 'error') {
          errorCount++;
        }
        if (error.level === 'warn') {
          warningCount++;
        }
      }
    }
    return {errorCount, warningCount, pathCount};
  }

  getErrors(path) {
    return this.paths[path];
  }

  pathHasWarning(path) {
    return this._hasLevel(path, 'warn');
  }

  pathHasError(path) {
    return this._hasLevel(path, 'error');
  }

  hasError() {
    var path;
    for (path in this.paths) {
      if (this.pathHasError(path)) {
        return true;
      }
    }
    return false;
  }

  _hasLevel(path, level) {
    var error, i, len, ref;
    ref = this.paths[path];
    for (i = 0, len = ref.length; i < len; i++) {
      error = ref[i];
      if (error.level === level) {
        return true;
      }
    }
    return false;
  }

};


},{}],6:[function(require,module,exports){
var BaseLinter, LexicalLinter, TokenApi,
  indexOf = [].indexOf;

TokenApi = (function() {
  class TokenApi {
    constructor(CoffeeScript, source, config1, tokensByLine, tokens1) {
      this.config = config1;
      this.tokensByLine = tokensByLine;
      this.tokens = tokens1;
      if (this.tokens == null) {
        this.tokens = CoffeeScript.tokens(source);
      }
      this.lines = source.split('\n');
      this.tokensByLine = {}; // A map of tokens by line.
    }

    
      // Return the token n places away from the current token.
    peek(n = 1) {
      return this.tokens[this.i + n] || null;
    }

  };

  TokenApi.prototype.i = 0; // The index of the current token we're linting.

  return TokenApi;

}).call(this);

BaseLinter = require('./base_linter.coffee');


// A class that performs checks on the output of CoffeeScript's lexer.

module.exports = LexicalLinter = class LexicalLinter extends BaseLinter {
  constructor(source, config, rules, CoffeeScript, tokens) {
    super(source, config, rules);
    this.tokenApi = new TokenApi(CoffeeScript, source, this.config, this.tokensByLine, tokens);
    // This needs to be available on the LexicalLinter so it can be passed
    // to the LineLinter when this finishes running.
    this.tokensByLine = this.tokenApi.tokensByLine;
  }

  acceptRule(rule) {
    return typeof rule.lintToken === 'function';
  }

  // Return a list of errors encountered in the given source.
  lint() {
    var error, errors, i, j, k, len, len1, ref, ref1, token;
    errors = [];
    ref = this.tokenApi.tokens;
    for (i = j = 0, len = ref.length; j < len; i = ++j) {
      token = ref[i];
      this.tokenApi.i = i;
      ref1 = this.lintToken(token);
      for (k = 0, len1 = ref1.length; k < len1; k++) {
        error = ref1[k];
        errors.push(error);
      }
    }
    return errors;
  }

  // Return an error if the given token fails a lint check, false otherwise.
  lintToken(token) {
    var base, errors, j, len, lineNumber, ref, ref1, rule, type, v, value;
    [
      type,
      value,
      {
        first_line: lineNumber
      }
    ] = token;
    if ((base = this.tokensByLine)[lineNumber] == null) {
      base[lineNumber] = [];
    }
    this.tokensByLine[lineNumber].push(token);
    // CoffeeScript loses line numbers of interpolations and multi-line
    // regexes, so fake it by using the last line number we know.
    this.lineNumber = lineNumber || this.lineNumber || 0;
    this.tokenApi.lineNumber = this.lineNumber;
    // Multiple rules might run against the same token to build context.
    // Every rule should run even if something has already produced an
    // error for the same token.
    errors = [];
    ref = this.rules;
    for (j = 0, len = ref.length; j < len; j++) {
      rule = ref[j];
      if (!(ref1 = token[0], indexOf.call(rule.tokens, ref1) >= 0)) {
        continue;
      }
      v = this.normalizeResult(rule, rule.lintToken(token, this.tokenApi));
      if (v != null) {
        errors.push(v);
      }
    }
    return errors;
  }

  createError(ruleName, attrs = {}) {
    var token;
    if (attrs.lineNumber == null) {
      attrs.lineNumber = this.lineNumber;
    }
    attrs.lineNumber += 1;
    attrs.line = this.tokenApi.lines[attrs.lineNumber - 1];
    if (attrs.token) {
      token = attrs.token;
      attrs.lineNumber = token[2].first_line + 1;
      attrs.columnNumber = token[2].first_column + 1;
      if (token[2].last_line) {
        attrs.lineNumberEnd = token[2].last_line + 1;
      }
      if (token[2].last_column) {
        attrs.columnNumberEnd = token[2].last_column + 1;
      }
    }
    return super.createError(ruleName, attrs);
  }

};


},{"./base_linter.coffee":3}],7:[function(require,module,exports){
var BaseLinter, LineApi, LineLinter, configShortcuts, configStatement;

LineApi = (function() {
  class LineApi {
    constructor(source, config1, tokensByLine1, literate1) {
      this.config = config1;
      this.tokensByLine = tokensByLine1;
      this.literate = literate1;
      this.line = null;
      this.lines = source.split('\n');
      this.lineCount = this.lines.length;
      // maintains some contextual information
      //   inClass: bool; in class or not
      //   lastUnemptyLineInClass: null or lineNumber, if the last not-empty
      //                     line was in a class it holds its number
      //   classIndents: the number of indents within a class
      this.context = {
        class: {
          inClass: false,
          lastUnemptyLineInClass: null,
          classIndents: null
        }
      };
    }

    isLiterate() {
      return this.literate;
    }

    // maintain the contextual information for class-related stuff
    maintainClassContext(line) {
      if (this.context.class.inClass) {
        if (this.lineHasToken('INDENT')) {
          this.context.class.classIndents++;
        } else if (this.lineHasToken('OUTDENT')) {
          this.context.class.classIndents--;
          if (this.context.class.classIndents === 0) {
            this.context.class.inClass = false;
            this.context.class.classIndents = null;
          }
        }
        if (!line.match(/^\s*$/)) {
          this.context.class.lastUnemptyLineInClass = this.lineNumber;
        }
      } else {
        if (!line.match(/\\s*/)) {
          this.context.class.lastUnemptyLineInClass = null;
        }
        if (this.lineHasToken('CLASS')) {
          this.context.class.inClass = true;
          this.context.class.lastUnemptyLineInClass = this.lineNumber;
          this.context.class.classIndents = 0;
        }
      }
      return null;
    }

    isLastLine() {
      return this.lineNumber === this.lineCount - 1;
    }

    // Return true if the given line actually has tokens.
    // Optional parameter to check for a specific token type and line number.
    lineHasToken(tokenType = null, lineNumber = null) {
      var i, len, token, tokens;
      lineNumber = lineNumber != null ? lineNumber : this.lineNumber;
      if (tokenType == null) {
        return this.tokensByLine[lineNumber] != null;
      } else {
        tokens = this.tokensByLine[lineNumber];
        if (tokens == null) {
          return null;
        }
        for (i = 0, len = tokens.length; i < len; i++) {
          token = tokens[i];
          if (token[0] === tokenType) {
            return true;
          }
        }
        return false;
      }
    }

    // Return tokens for the given line number.
    getLineTokens() {
      return this.tokensByLine[this.lineNumber] || [];
    }

  };

  LineApi.prototype.lineNumber = 0;

  return LineApi;

}).call(this);

BaseLinter = require('./base_linter.coffee');

// Some repeatedly used regular expressions.
configStatement = /coffeelint:\s*((disable|enable)(-line)?)(?:=([\w\s,]*))?/;

// TODO: make this user (and / or api) configurable
configShortcuts = [[/\#.*noqa/, 'coffeelint: disable-line']];


// A class that performs regex checks on each line of the source.

module.exports = LineLinter = class LineLinter extends BaseLinter {
  static getDirective(line) {
    var i, len, replacement, shortcut;
    for (i = 0, len = configShortcuts.length; i < len; i++) {
      [shortcut, replacement] = configShortcuts[i];
      if (line.match(shortcut)) {
        return configStatement.exec(replacement);
      }
    }
    return configStatement.exec(line);
  }

  constructor(source, config, rules, tokensByLine, literate = false) {
    super(source, config, rules);
    this.lineApi = new LineApi(source, config, tokensByLine, literate);
    // Store suppressions in the form of { line #: type }
    this.inlineConfig = {
      enable: {},
      disable: {},
      'enable-line': {},
      'disable-line': {}
    };
  }

  acceptRule(rule) {
    return typeof rule.lintLine === 'function';
  }

  lint() {
    var error, errors, i, j, len, len1, line, lineNumber, ref, ref1;
    errors = [];
    ref = this.lineApi.lines;
    for (lineNumber = i = 0, len = ref.length; i < len; lineNumber = ++i) {
      line = ref[lineNumber];
      this.lineApi.lineNumber = this.lineNumber = lineNumber;
      this.lineApi.line = this.lineApi.lines[lineNumber];
      this.lineApi.maintainClassContext(line);
      this.collectInlineConfig(line);
      ref1 = this.lintLine(line);
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        error = ref1[j];
        errors.push(error);
      }
    }
    return errors;
  }

  // Return an error if the line contained failed a rule, null otherwise.
  lintLine(line) {
    var errors, i, len, ref, rule, v;
    // Multiple rules might run against the same line to build context.
    // Every every rule should run even if something has already produced an
    // error for the same token.
    errors = [];
    ref = this.rules;
    for (i = 0, len = ref.length; i < len; i++) {
      rule = ref[i];
      v = this.normalizeResult(rule, rule.lintLine(line, this.lineApi));
      if (v != null) {
        errors.push(v);
      }
    }
    return errors;
  }

  collectInlineConfig(line) {
    var cmd, i, len, r, ref, result, rules;
    // Check for block config statements enable and disable
    result = this.constructor.getDirective(line);
    if (result != null) {
      cmd = result[1];
      rules = [];
      if (result[4] != null) {
        ref = result[4].split(',');
        for (i = 0, len = ref.length; i < len; i++) {
          r = ref[i];
          rules.push(r.replace(/^\s+|\s+$/g, ''));
        }
      }
      this.inlineConfig[cmd][this.lineNumber] = rules;
    }
    return null;
  }

  createError(rule, attrs = {}) {
    var ref;
    if (attrs.lineNumber == null) {
      attrs.lineNumber = this.lineNumber + 1; // Lines are indexed by zero.
    }
    attrs.level = (ref = this.config[rule]) != null ? ref.level : void 0;
    return super.createError(rule, attrs);
  }

};


},{"./base_linter.coffee":3}],8:[function(require,module,exports){
// CoffeeLint error levels.
var ERROR, IGNORE, WARN;

ERROR = 'error';

WARN = 'warn';

IGNORE = 'ignore';

// CoffeeLint's default rule configuration.
module.exports = {
  coffeescript_error: {
    level: ERROR,
    message: '' // The default coffeescript error is fine.
  }
};


},{}],9:[function(require,module,exports){
var ArrowSpacing;

module.exports = ArrowSpacing = (function() {
  class ArrowSpacing {
    lintToken(token, tokenApi) {
      var pp;
      // Throw error unless the following happens.

      // We will take a look at the previous token to see
      // 1. That the token is properly spaced
      // 2. Wasn't generated by the CoffeeScript compiler
      // 3. That it is just indentation
      // 4. If the function declaration has no parameters
      // e.g. x(-> 3)
      //      x( -> 3)

      // or a statement is wrapped in parentheses
      // e.g. (-> true)()

      // we will accept either having a space or not having a space there.

      // Also if the -> is the beginning of the file, then simply just return
      pp = tokenApi.peek(-1);
      if (!pp) {
        return;
      }
      // Ignore empty functions
      if (!token.spaced && tokenApi.peek(1)[0] === 'INDENT' && tokenApi.peek(2)[0] === 'OUTDENT') {
        return null;
      // Throw error unless the previous token...
      } else if (!(((token.spaced != null) || (token.newLine != null)) && (((pp.spaced != null) || pp[0] === 'TERMINATOR') || (pp.generated != null) || pp[0] === 'INDENT' || (pp[1] === '(' && (pp.generated == null))))) { //4
        return {token};
      } else {
        return null;
      }
    }

  };

  ArrowSpacing.prototype.rule = {
    name: 'arrow_spacing',
    level: 'ignore',
    message: 'Function arrows (-> and =>) must be spaced properly',
    description: `<p>This rule checks to see that there is spacing before and after
the arrow operator that declares a function. This rule is disabled
by default.</p> <p>Note that if arrow_spacing is enabled, and you
pass an empty function as a parameter, arrow_spacing will accept
either a space or no space in-between the arrow operator and the
parenthesis</p>
<pre><code># Both of this will not trigger an error,
# even with arrow_spacing enabled.
x(-> 3)
x( -> 3)

# However, this will trigger an error
x((a,b)-> 3)
</code>
</pre>`
  };

  ArrowSpacing.prototype.tokens = ['->', '=>'];

  return ArrowSpacing;

}).call(this);


},{}],10:[function(require,module,exports){
var BracesSpacing,
  indexOf = [].indexOf;

module.exports = BracesSpacing = (function() {
  class BracesSpacing {
    distanceBetweenTokens(firstToken, secondToken) {
      return secondToken[2].first_column - firstToken[2].last_column - 1;
    }

    findNearestToken(token, tokenApi, difference) {
      var nearestToken, totalDifference;
      totalDifference = 0;
      while (true) {
        totalDifference += difference;
        nearestToken = tokenApi.peek(totalDifference);
        if ((nearestToken != null ? nearestToken[0] : void 0) === 'OUTDENT' || ((nearestToken != null ? nearestToken.generated : void 0) != null)) {
          continue;
        }
        return nearestToken;
      }
    }

    tokensOnSameLine(firstToken, secondToken) {
      return firstToken[2].first_line === secondToken[2].first_line;
    }

    tokenSetsMatch(a, b) {
      return JSON.stringify(a) === JSON.stringify(b);
    }

    getExpectedSpaces(tokenApi, tokens) {
      var config, mono, ref, ref1;
      config = tokenApi.config[this.rule.name];
      mono = ['IDENTIFIER', ...this.tokens];
      tokens = tokens.map(function(token) {
        return token != null ? token[0] : void 0;
      }).filter(function(token) {
        return indexOf.call(mono, token) >= 0;
      });
      if (this.tokenSetsMatch(tokens.slice(0, 2), this.tokens)) {
        return (ref = config.empty_object_spaces) != null ? ref : config.spaces;
      } else if (this.tokenSetsMatch(mono, tokens.sort())) {
        return (ref1 = config.mono_object_spaces) != null ? ref1 : config.spaces;
      } else {
        return config.spaces;
      }
    }

    lintToken(token, tokenApi) {
      var actual, expected, firstToken, msg, secondToken, tokens;
      if (token.generated) {
        return null;
      }
      [firstToken, secondToken] = tokens = token[0] === '{' ? [token, this.findNearestToken(token, tokenApi, 1), this.findNearestToken(token, tokenApi, 2)] : [this.findNearestToken(token, tokenApi, -1), token, this.findNearestToken(token, tokenApi, -2)];
      if (!this.tokensOnSameLine(firstToken, secondToken)) {
        return null;
      }
      expected = this.getExpectedSpaces(tokenApi, tokens);
      actual = this.distanceBetweenTokens(firstToken, secondToken);
      if (actual === expected) {
        return null;
      } else {
        msg = `There should be ${expected} space`;
        if (expected !== 1) {
          msg += 's';
        }
        msg += ` inside \"${token[0]}\"`;
        return {
          token,
          context: msg
        };
      }
    }

  };

  BracesSpacing.prototype.rule = {
    name: 'braces_spacing',
    level: 'ignore',
    spaces: 0,
    empty_object_spaces: 0,
    message: 'Curly braces must have the proper spacing',
    description: `This rule checks to see that there is the proper spacing inside
curly braces. The spacing amount is specified by "spaces".
The spacing amount for empty objects is specified by
"empty_object_spaces".
The spacing amount for objects containing a single item is
specified by "mono_object_spaces".
<pre><code>
# Spaces is 0
{a: b}     # Good
{a: b }    # Bad
{ a: b}    # Bad
{ a: b }   # Bad
# Spaces is 1
{a: b}     # Bad
{a: b }    # Bad
{ a: b}    # Bad
{ a: b }   # Good
{ a: b  }  # Bad
{  a: b }  # Bad
{  a: b  } # Bad
# Empty Object Spaces is 0
{}         # Good
{ }        # Bad
# Empty Object Spaces is 1
{}         # Bad
{ }        # Good
# Mono Object Spaces is 0
{a}        # Good
{ a }      # Bad
# Mono Object Spaces is 1
{a}        # Bad
{ a }      # Good
</code></pre>
This rule is disabled by default.`
  };

  BracesSpacing.prototype.tokens = ['{', '}'];

  return BracesSpacing;

}).call(this);


},{}],11:[function(require,module,exports){
var BracketSpacing;

module.exports = BracketSpacing = (function() {
  class BracketSpacing {
    distanceBetweenTokens(firstToken, secondToken) {
      return secondToken[2].first_column - firstToken[2].last_column - 1;
    }

    findNearestToken(token, tokenApi, difference) {
      var nearestToken, totalDifference;
      totalDifference = 0;
      while (true) {
        totalDifference += difference;
        nearestToken = tokenApi.peek(totalDifference);
        if (nearestToken != null ? nearestToken[0].startsWith('STRING_') : void 0) {
          // Render quotes for string interpolation.
          nearestToken[1] = '"';
        }
        if ((nearestToken != null ? nearestToken[0] : void 0) === 'OUTDENT' || ((nearestToken != null ? nearestToken.generated : void 0) != null)) {
          continue;
        }
        return nearestToken;
      }
    }

    tokensOnSameLine(firstToken, secondToken) {
      return firstToken[2].first_line === secondToken[2].first_line;
    }

    escape(string) {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    getExpectedSpaces(tokenApi, tokens) {
      var config, except, pattern, ref, ref1;
      config = tokenApi.config[this.rule.name];
      except = this.escape(config.exceptions.join(''));
      pattern = tokens.map(function(token) {
        return token != null ? token[1] : void 0;
      }).join('');
      switch (false) {
        case !(except && RegExp(`^\\[[${except}]|[${except}]\\]$`).test(pattern)):
          if (config.spaces) {
            return 0;
          } else {
            return 1;
          }
          break;
        case !pattern.includes('[]'):
          return (ref = config.empty_array_spaces) != null ? ref : config.spaces;
        case !/\[\w+\]/.test(pattern):
          return (ref1 = config.mono_array_spaces) != null ? ref1 : config.spaces;
        default:
          return config.spaces;
      }
    }

    lintToken(token, tokenApi) {
      var actual, expected, firstToken, msg, secondToken, tokens;
      if (token.generated) {
        return null;
      }
      tokens = token[0] === this.tokens[0] ? (firstToken = token, secondToken = this.findNearestToken(token, tokenApi, 1), [firstToken, secondToken, this.findNearestToken(token, tokenApi, 2)]) : (firstToken = this.findNearestToken(token, tokenApi, -1), secondToken = token, [this.findNearestToken(token, tokenApi, -2), firstToken, secondToken]);
      if (!this.tokensOnSameLine(firstToken, secondToken)) {
        return null;
      }
      expected = this.getExpectedSpaces(tokenApi, tokens);
      actual = this.distanceBetweenTokens(firstToken, secondToken);
      if (actual === expected) {
        return null;
      } else {
        msg = `There should be ${expected} space`;
        if (expected !== 1) {
          msg += 's';
        }
        msg += ` inside \"${token[0]}\"`;
        return {
          token,
          context: msg
        };
      }
    }

  };

  BracketSpacing.prototype.rule = {
    name: 'bracket_spacing',
    level: 'ignore',
    spaces: 0,
    empty_array_spaces: 0,
    exceptions: [],
    message: 'Square brackets must have the proper spacing',
    description: `This rule checks to see that there is the proper spacing inside
square brackets. The spacing amount is specified by "spaces".
The spacing amount for empty arrays is specified by
"empty_array_spaces".
The spacing amount for arrays containing a single item is
specified by "mono_array_spaces".
Specified characters will be ignored if listed in "exceptions".
<pre><code>
# Spaces is 0
[a, b]     # Good
[a, b ]    # Bad
[ a, b]    # Bad
[ a, b ]   # Bad
# Except brackets
[ [a, b] ] # Good
[[ a, b ]] # Bad
# Spaces is 1
[a, b]     # Bad
[a, b ]    # Bad
[ a, b]    # Bad
[ a, b ]   # Good
[ a, b  ]  # Bad
[  a, b ]  # Bad
[  a, b  ] # Bad
# Except braces
[{ a: b }] # Good
[ {a: b} ] # Bad
# Empty Array Spaces is 0
[]         # Good
[ ]        # Bad
# Empty Array Spaces is 1
[]         # Bad
[ ]        # Good
# Mono Array Spaces is 0
[a]        # Good
[ a ]      # Bad
# Mono Array Spaces is 1
[a]        # Bad
[ a ]      # Good
</code></pre>
This rule is disabled by default.`
  };

  BracketSpacing.prototype.tokens = ['[', ']'];

  return BracketSpacing;

}).call(this);


},{}],12:[function(require,module,exports){
var CamelCaseClasses, regexes;

regexes = {
  camelCase: /^[A-Z_][a-zA-Z\d]*$/
};

module.exports = CamelCaseClasses = (function() {
  class CamelCaseClasses {
    lintToken(token, tokenApi) {
      var className, offset, ref, ref1, ref2;
      // TODO: you can do some crazy shit in CoffeeScript, like
      // class func().ClassName. Don't allow that.

      // Don't try to lint the names of anonymous classes.
      if ((token.newLine != null) || ((ref = tokenApi.peek()[0]) === 'INDENT' || ref === 'EXTENDS')) {
        return null;
      }
      // It's common to assign a class to a global namespace, e.g.
      // exports.MyClassName, so loop through the next tokens until
      // we find the real identifier.
      className = null;
      offset = 1;
      while (!className) {
        if (((ref1 = tokenApi.peek(offset + 1)) != null ? ref1[0] : void 0) === '.') {
          offset += 2;
        } else if (((ref2 = tokenApi.peek(offset)) != null ? ref2[0] : void 0) === '@') {
          offset += 1;
        } else {
          className = tokenApi.peek(offset)[1];
        }
      }
      // Now check for the error.
      if (!regexes.camelCase.test(className)) {
        return {
          token,
          context: `class name: ${className}`
        };
      }
    }

  };

  CamelCaseClasses.prototype.rule = {
    name: 'camel_case_classes',
    level: 'error',
    message: 'Class name should be UpperCamelCased',
    description: `This rule mandates that all class names are UpperCamelCased.
Camel casing class names is a generally accepted way of
distinguishing constructor functions - which require the 'new'
prefix to behave properly - from plain old functions.
<pre>
<code># Good!
class BoaConstrictor

# Bad!
class boaConstrictor
</code>
</pre>
This rule is enabled by default.`
  };

  CamelCaseClasses.prototype.tokens = ['CLASS'];

  return CamelCaseClasses;

}).call(this);


},{}],13:[function(require,module,exports){
var ColonAssignmentSpacing;

module.exports = ColonAssignmentSpacing = (function() {
  class ColonAssignmentSpacing {
    lintToken(token, tokenApi) {
      var checkSpacing, isLeftSpaced, isRightSpaced, nextToken, previousToken, spaceRules;
      spaceRules = tokenApi.config[this.rule.name].spacing;
      previousToken = tokenApi.peek(-1);
      nextToken = tokenApi.peek(1);
      checkSpacing = function(direction) {
        var minDirection, spacing;
        spacing = (function() {
          switch (direction) {
            case 'left':
              return token[2].first_column - previousToken[2].last_column - 1;
            case 'right':
              return nextToken[2].first_column - token[2].first_column - 1;
          }
        })();
        // when spacing is negative, the neighboring token is a newline
        if (spacing < 0) {
          return true;
        } else {
          minDirection = parseInt(spaceRules['min_' + direction], 10);
          // if a minimal spacing is specified, only check that
          if (minDirection >= 0) {
            return spacing >= minDirection;
          } else {
            // otherwise check exact spacing
            return spacing === parseInt(spaceRules[direction], 10);
          }
        }
      };
      isLeftSpaced = checkSpacing('left');
      isRightSpaced = checkSpacing('right');
      if (token.jsxColon || isLeftSpaced && isRightSpaced) {
        return null;
      } else {
        return {
          token: token,
          context: `Incorrect spacing around column ${token[2].first_column}`
        };
      }
    }

  };

  ColonAssignmentSpacing.prototype.rule = {
    name: 'colon_assignment_spacing',
    level: 'ignore',
    message: 'Colon assignment without proper spacing',
    spacing: {
      left: 0,
      right: 0
    },
    description: `<p>This rule checks to see that there is spacing before and
after the colon in a colon assignment (i.e., classes, objects).
The spacing amount is specified by
spacing.left and spacing.right, respectively.
A zero value means no spacing required.
</p>
<pre><code>
#
# If spacing.left and spacing.right is 1
#

# Doesn't throw an error
object = {spacing : true}
class Dog
  canBark : true

# Throws an error
object = {spacing: true}
class Cat
  canBark: false
</code></pre>`
  };

  ColonAssignmentSpacing.prototype.tokens = [':'];

  return ColonAssignmentSpacing;

}).call(this);


},{}],14:[function(require,module,exports){
var CyclomaticComplexity;

module.exports = CyclomaticComplexity = (function() {
  class CyclomaticComplexity {
    // returns the "complexity" value of the current node.
    getComplexity(node) {
      var complexity, name, ref;
      name = this.astApi.getNodeName(node);
      complexity = name === 'If' || name === 'While' || name === 'For' || name === 'Try' ? 1 : name === 'Op' && ((ref = node.operator) === '&&' || ref === '||') ? 1 : name === 'Switch' ? node.cases.length : 0;
      return complexity;
    }

    lintAST(node, astApi) {
      this.astApi = astApi;
      this.lintNode(node);
      return void 0;
    }

    // Lint the AST node and return its cyclomatic complexity.
    lintNode(node) {
      var complexity, error, name, ref, rule;
      // Get the complexity of the current node.
      name = (ref = this.astApi) != null ? ref.getNodeName(node) : void 0;
      complexity = this.getComplexity(node);
      // Add the complexity of all child's nodes to this one.
      node.eachChild((childNode) => {
        var childComplexity, ref1;
        childComplexity = this.lintNode(childNode);
        if (((ref1 = this.astApi) != null ? ref1.getNodeName(childNode) : void 0) !== 'Code') {
          return complexity += childComplexity;
        }
      });
      rule = this.astApi.config[this.rule.name];
      // If the current node is a function, and it's over our limit, add an
      // error to the list.
      if (name === 'Code' && complexity >= rule.value) {
        error = this.astApi.createError({
          context: complexity + 1,
          lineNumber: node.locationData.first_line + 1,
          lineNumberEnd: node.locationData.last_line + 1,
          columnNumber: node.locationData.first_column + 1,
          columnNumberEnd: node.locationData.last_column + 1
        });
        if (error) {
          this.errors.push(error);
        }
      }
      // Return the complexity for the benefit of parent nodes.
      return complexity;
    }

  };

  CyclomaticComplexity.prototype.rule = {
    name: 'cyclomatic_complexity',
    level: 'ignore',
    message: 'The cyclomatic complexity is too damn high',
    value: 10,
    description: `Examine the complexity of your function.`
  };

  return CyclomaticComplexity;

}).call(this);


},{}],15:[function(require,module,exports){
var DuplicateKey;

module.exports = DuplicateKey = (function() {
  class DuplicateKey {
    constructor() {
      this.braceScopes = []; // A stack tracking keys defined in nexted scopes.
    }

    lintToken([type], tokenApi) {
      if (type === '{' || type === '}') {
        this.lintBrace(...arguments);
        return void 0;
      }
      if (type === 'PROPERTY' || type === 'STRING') {
        return this.lintIdentifier(...arguments);
      }
    }

    lintIdentifier(token, tokenApi) {
      var key, m, nextToken, previousToken;
      key = token[1];
      if (this.currentScope == null) {
        // Class names might not be in a scope
        return null;
      }
      nextToken = tokenApi.peek(1);
      if (nextToken[1] !== ':') {
        // Exit if this identifier isn't being assigned. A and B
        // are identifiers, but only A should be examined:
        // A = B
        return null;
      }
      previousToken = tokenApi.peek(-1);
      if (previousToken[0] === '@') {
        // Assigning "@something" and "something" are not the same thing
        key = `@${key}`;
      }
      if (m = key.match(/^(["'])(.*)\1$/)) {
        // Normalize property, "property", and 'property'
        key = m[2];
      }
      // Added a prefix to not interfere with things like "constructor".
      key = `identifier-${key}`;
      if (this.currentScope[key]) {
        return {token};
      } else {
        this.currentScope[key] = token;
        return null;
      }
    }

    lintBrace(token) {
      if (token[0] === '{') {
        if (this.currentScope != null) {
          this.braceScopes.push(this.currentScope);
        }
        this.currentScope = {};
      } else {
        this.currentScope = this.braceScopes.pop();
      }
      return null;
    }

  };

  DuplicateKey.prototype.rule = {
    // I don't know of any legitimate reason to define duplicate keys in an
    // object. It seems to always be a mistake, it's also a syntax error in
    // strict mode.
    // See https://jslinterrors.com/duplicate-key-a/
    name: 'duplicate_key',
    level: 'error',
    message: 'Duplicate key defined in object or class',
    description: `Prevents defining duplicate keys in object literals and classes`
  };

  DuplicateKey.prototype.tokens = ['PROPERTY', 'STRING', '{', '}'];

  return DuplicateKey;

}).call(this);


},{}],16:[function(require,module,exports){
var EmptyConstructorNeedsParens;

module.exports = EmptyConstructorNeedsParens = (function() {
  class EmptyConstructorNeedsParens {
    // Return an error if the given indentation token is not correct.
    lintToken(token, tokenApi) {
      var identIndex, isIdent, nextToken, peek, ref, ref1, ref2;
      if (token[1] === 'new') {
        peek = tokenApi.peek.bind(tokenApi);
        // Find the last chained identifier, e.g. Bar in new foo.bar.Bar().
        identIndex = 1;
        while (true) {
          isIdent = (ref = (ref1 = peek(identIndex)) != null ? ref1[0] : void 0) === 'IDENTIFIER' || ref === 'PROPERTY';
          nextToken = peek(identIndex + 1);
          if (isIdent) {
            if ((nextToken != null ? nextToken[0] : void 0) === '.') {
              // skip the dot and start with the next token
              identIndex += 2;
              continue;
            }
            if ((nextToken != null ? nextToken[0] : void 0) === 'INDEX_START') {
              while (((ref2 = peek(identIndex)) != null ? ref2[0] : void 0) !== 'INDEX_END') {
                identIndex++;
              }
              continue;
            }
          }
          break;
        }
        // The callStart is generated if your parameters are all on the same
        // line with implicit parens, and if your parameters start on the
        // next line, but is missing if there are no params and no parens.
        if (isIdent && (nextToken != null)) {
          return this.handleExpectedCallStart(nextToken, tokenApi);
        }
      }
    }

    handleExpectedCallStart(isCallStart, tokenApi) {
      if (isCallStart[0] !== 'CALL_START') {
        return {
          token: tokenApi.peek(isCallStart, 1)
        };
      }
    }

  };

  EmptyConstructorNeedsParens.prototype.rule = {
    name: 'empty_constructor_needs_parens',
    level: 'ignore',
    message: 'Invoking a constructor without parens and without arguments',
    description: `Requires constructors with no parameters to include the parens`
  };

  EmptyConstructorNeedsParens.prototype.tokens = ['UNARY'];

  return EmptyConstructorNeedsParens;

}).call(this);


},{}],17:[function(require,module,exports){
var EnsureComprehensions,
  indexOf = [].indexOf;

module.exports = EnsureComprehensions = (function() {
  class EnsureComprehensions {
    lintToken(token, tokenApi) {
      var atEqual, idents, numCallEnds, numCallStarts, numParenEnds, numParenStarts, peeker, prevIdents, prevToken, ref, ref1;
      // Rules
      // Ignore if normal for-loop with a block
      // If LHS of operation contains either the key or value variable of
      //     the loop, assume that it is not a comprehension.

      // Find all identifiers (including lhs values and parts of for loop)
      idents = this.findIdents(tokenApi);
      // if it looks like a for block, don't bother checking
      if (this.forBlock) {
        this.forBlock = false;
        return;
      }
      peeker = -1;
      atEqual = false;
      numCallEnds = 0;
      numCallStarts = 0;
      numParenStarts = 0;
      numParenEnds = 0;
      prevIdents = [];
      while ((prevToken = tokenApi.peek(peeker))) {
        if (prevToken[0] === 'CALL_END') {
          numCallEnds++;
        }
        if (prevToken[0] === 'CALL_START') {
          numCallStarts++;
        }
        if (prevToken[0] === '(') {
          numParenStarts++;
        }
        if (prevToken[0] === ')') {
          numParenEnds++;
        }
        if (prevToken[0] === 'IDENTIFIER') {
          if (!atEqual) {
            prevIdents.push(prevToken[1]);
          } else if (ref = prevToken[1], indexOf.call(idents, ref) >= 0) {
            return;
          }
        }
        if (((ref1 = prevToken[0]) === '(' || ref1 === '->' || ref1 === 'TERMINATOR') || (prevToken.newLine != null)) {
          break;
        }
        if (prevToken[0] === '=' && numParenEnds === numParenStarts) {
          atEqual = {token};
        }
        peeker--;
      }
      // If we hit a terminal node (TERMINATOR token or w/ property newLine)
      // or if we hit the top of the file and we've seen an '=' sign without
      // any identifiers that are part of the for-loop, and there is an equal
      // amount of CALL_START/CALL_END tokens. An unequal number means the list
      // comprehension is inside of a function call
      if (atEqual && numCallStarts === numCallEnds) {
        return {
          token,
          context: ''
        };
      }
    }

    findIdents(tokenApi) {
      var idents, nextToken, peeker, ref;
      peeker = 1;
      idents = [];
      while ((nextToken = tokenApi.peek(peeker))) {
        if (nextToken[0] === 'IDENTIFIER') {
          idents.push(nextToken[1]);
        }
        if ((ref = nextToken[0]) === 'FORIN' || ref === 'FOROF') {
          break;
        }
        peeker++;
      }
      // now search ahead to see if this becomes a FOR block
      while ((nextToken = tokenApi.peek(peeker))) {
        if (nextToken[0] === 'TERMINATOR') {
          break;
        }
        if (nextToken[0] === 'INDENT') {
          this.forBlock = true;
          break;
        }
        peeker++;
      }
      return idents;
    }

  };

  EnsureComprehensions.prototype.rule = {
    name: 'ensure_comprehensions',
    level: 'warn',
    message: 'Comprehensions must have parentheses around them',
    description: `This rule makes sure that parentheses are around comprehensions.`
  };

  EnsureComprehensions.prototype.tokens = ['FOR'];

  EnsureComprehensions.prototype.forBlock = false;

  return EnsureComprehensions;

}).call(this);


},{}],18:[function(require,module,exports){
var EOLLast;

module.exports = EOLLast = (function() {
  class EOLLast {
    lintLine(line, lineApi) {
      var isNewline, previousIsNewline;
      if (!lineApi.isLastLine()) {
        return null;
      }
      isNewline = line.length === 0;
      previousIsNewline = lineApi.lineCount > 1 ? lineApi.lines[lineApi.lineNumber - 1].length === 0 : false;
      if (!(isNewline && !previousIsNewline)) {
        return true;
      }
    }

  };

  EOLLast.prototype.rule = {
    name: 'eol_last',
    level: 'ignore',
    message: 'File does not end with a single newline',
    description: `Checks that the file ends with a single newline`
  };

  return EOLLast;

}).call(this);


},{}],19:[function(require,module,exports){
var Indentation,
  indexOf = [].indexOf;

module.exports = Indentation = (function() {
  class Indentation {
    constructor() {
      this.arrayTokens = []; // A stack tracking the array token pairs.
    }

    
      // Return an error if the given indentation token is not correct.
    lintToken(token, tokenApi) {
      var chain, currentLine, dotIndent, expected, got, ignoreIndent, isArrayIndent, isMultiline, lineNumber, lines, next, numIndents, previous, previousSymbol, ref, ref1, regExRes, spaces, startsWith, type;
      [type, numIndents] = token;
      ({
        first_column: dotIndent
      } = token[2]);
      ({lines, lineNumber} = tokenApi);
      expected = tokenApi.config[this.rule.name].value;
      // See: 'Indented chained invocations with bad indents'
      // This actually checks the chained call to see if its properly indented
      if (type === '.') {
        // Keep this if statement separately, since we still need to let
        // the linting pass if the '.' token is not at the beginning of
        // the line
        currentLine = lines[lineNumber];
        if (((ref = currentLine.match(/\S/)) != null ? ref[0] : void 0) === '.') {
          next = tokenApi.peek(1);
          if (next[0] === 'PROPERTY') {
            chain = '.' + next[1];
            startsWith = new RegExp('^(\\s*)(\\' + chain + ')');
            regExRes = currentLine.match(startsWith);
            spaces = (regExRes != null ? regExRes[1].length : void 0) || -1;
            if ((regExRes != null ? regExRes.index : void 0) === 0 && spaces === dotIndent) {
              got = dotIndent;
              if (dotIndent - expected > expected) {
                got %= expected;
              }
              if (dotIndent % expected !== 0) {
                return {
                  token,
                  context: `Expected ${expected} got ${got}`
                };
              }
            }
          }
        }
        return void 0;
      }
      if (type === '[' || type === ']') {
        this.lintArray(token);
        return void 0;
      }
      if ((token.generated != null) || (token.explicit != null)) {
        return null;
      }
      // Ignore the indentation inside of an array, so that
      // we can allow things like:
      //   x = ["foo",
      //             "bar"]
      previous = tokenApi.peek(-1);
      isArrayIndent = this.inArray() && (previous != null ? previous.newLine : void 0);
      // Ignore indents used to for formatting on multi-line expressions, so
      // we can allow things like:
      //   a = b =
      //     c = d
      previousSymbol = (ref1 = tokenApi.peek(-1)) != null ? ref1[0] : void 0;
      isMultiline = previousSymbol === '=' || previousSymbol === ',';
      // Summarize the indentation conditions we'd like to ignore
      ignoreIndent = isArrayIndent || isMultiline;
      // Correct CoffeeScript's incorrect INDENT token value when functions
      // get chained. See https://github.com/jashkenas/coffeescript/issues/3137
      // Also see CoffeeLint Issues: #4, #88, #128, and many more.
      numIndents = this.getCorrectIndent(tokenApi);
      // Now check the indentation.
      if (!ignoreIndent && !(indexOf.call(numIndents, expected) >= 0)) {
        return {
          token,
          context: `Expected ${expected} got ${numIndents[0]}`
        };
      }
    }

    // Return true if the current token is inside of an array.
    inArray() {
      return this.arrayTokens.length > 0;
    }

    // Lint the given array token.
    lintArray(token) {
      // Track the array token pairs
      if (token[0] === '[') {
        this.arrayTokens.push(token);
      } else if (token[0] === ']') {
        this.arrayTokens.pop();
      }
      // Return null, since we're not really linting
      // anything here.
      return null;
    }

    grabLineTokens(tokenApi, lineNumber, all = false) {
      var i, k, len, len1, ref, ref1, results, results1, tok, tokensByLine;
      ({tokensByLine} = tokenApi);
      if (lineNumber < 0) {
        lineNumber = 0;
      }
      while (!((tokensByLine[lineNumber] != null) || lineNumber === 0)) {
        lineNumber--;
      }
      if (all) {
        ref = tokensByLine[lineNumber];
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          tok = ref[i];
          results.push(tok);
        }
        return results;
      } else {
        ref1 = tokensByLine[lineNumber];
        results1 = [];
        for (k = 0, len1 = ref1.length; k < len1; k++) {
          tok = ref1[k];
          if ((tok.generated == null) && tok[0] !== 'OUTDENT') {
            results1.push(tok);
          }
        }
        return results1;
      }
    }

    // Returns a corrected INDENT value if the current line is part of
    // a chained call. Otherwise returns original INDENT value.
    getCorrectIndent(tokenApi) {
      var _, curIndent, i, j, len, lineNumber, lines, prevIndent, prevNum, prevTokens, ref, ref1, ref2, ref3, ref4, ref5, ref6, ref7, ret, skipAssign, t, tokens, tryLine;
      ({lineNumber, lines, tokens} = tokenApi);
      curIndent = (ref = lines[lineNumber].match(/\S/)) != null ? ref.index : void 0;
      prevNum = 1;
      while (/^\s*(#|$)/.test(lines[lineNumber - prevNum])) {
        prevNum += 1;
      }
      prevTokens = this.grabLineTokens(tokenApi, lineNumber - prevNum);
      if (((ref1 = prevTokens[0]) != null ? ref1[0] : void 0) === 'INDENT') {
        // Pass both the INDENT value and the location of the first token
        // after the INDENT because sometimes CoffeeScript doesn't return
        // the correct INDENT if there is something like an if/else
        // inside an if/else inside of a -> function definition: e.g.

        // ->
        //   r = if a
        //     if b
        //       2
        //     else
        //       3
        //   else
        //     4

        // will error without: curIndent - prevTokens[1]?[2].first_column
        return [curIndent - ((ref2 = prevTokens[1]) != null ? ref2[2].first_column : void 0), curIndent - prevTokens[0][1]];
      } else {
        prevIndent = (ref3 = prevTokens[0]) != null ? ref3[2].first_column : void 0;
// This is a scan to handle extra indentation from if/else
// statements to make them look nicer: e.g.

// r = if a
//   true
// else
//   false

// is valid.

// r = if a
//       true
//     else
//       false

// is also valid.
        for (j = i = 0, len = prevTokens.length; i < len; j = ++i) {
          _ = prevTokens[j];
          if (!(prevTokens[j][0] === '=' && ((ref4 = prevTokens[j + 1]) != null ? ref4[0] : void 0) === 'IF')) {
            continue;
          }
          skipAssign = curIndent - prevTokens[j + 1][2].first_column;
          ret = curIndent - prevIndent;
          if (skipAssign < 0) {
            return [ret];
          }
          return [skipAssign, ret];
        }
        // This happens when there is an extra indent to maintain long
        // conditional statements (IF/UNLESS): e.g.

        // ->
        //   if a is c and
        //     (false or
        //       long.expression.that.necessitates(linebreak))
        //     @foo()

        // is valid (note that there an only an extra indent in the last
        // statement is required and not the line above it

        // ->
        //   if a is c and
        //       (false or
        //       long.expression.that.necessitates(linebreak))
        //     @foo()
        // is also OK.
        while (prevIndent > curIndent) {
          tryLine = lineNumber - prevNum;
          prevTokens = this.grabLineTokens(tokenApi, tryLine, true);
          // This is to handle weird object/string indentation.
          // See: 'Handle edge-case weirdness with strings in objects'
          //   test case in test_indentation.coffee or in the file,
          //   test_no_empty_functions.coffee, which is why/how I
          //   caught this.
          if (((ref5 = prevTokens[0]) != null ? ref5[0] : void 0) === 'INDENT') {
            prevIndent = prevTokens[0][1];
            prevTokens = prevTokens.slice(1);
          }
          t = 0;
          // keep looping prevTokens until we find a token in @keywords
          // or we just run out of tokens in prevTokens
          while (!((prevTokens[t] == null) || (ref6 = prevTokens[t][0], indexOf.call(this.keywords, ref6) >= 0))) {
            t++;
          }
          // slice off everything before 't'
          prevTokens = prevTokens.slice(t);
          prevNum++;
          if (prevTokens[0] == null) {
            // if there isn't a valid token, restart the while loop
            continue;
          }
          // set new "prevIndent"
          prevIndent = (ref7 = prevTokens[0]) != null ? ref7[2].first_column : void 0;
        }
      }
      return [curIndent - prevIndent];
    }

  };

  Indentation.prototype.rule = {
    name: 'indentation',
    value: 2,
    level: 'error',
    message: 'Line contains inconsistent indentation',
    description: `This rule imposes a standard number of spaces(tabs) to be used for
indentation. Since whitespace is significant in CoffeeScript, it's
critical that a project chooses a standard indentation format and
stays consistent. Other roads lead to darkness. <pre> <code>#
Enabling this option will prevent this ugly
# but otherwise valid CoffeeScript.
twoSpaces = () ->
  fourSpaces = () ->
      eightSpaces = () ->
            'this is valid CoffeeScript'

</code>
</pre>
Two space indentation is enabled by default.`
  };

  Indentation.prototype.tokens = ['INDENT', '[', ']', '.'];

  Indentation.prototype.keywords = ['->', '=>', '@', 'CATCH', 'CLASS', 'DEFAULT', 'ELSE', 'EXPORT', 'FINALLY', 'FOR', 'FORIN', 'FOROF', 'IDENTIFIER', 'IF', 'IMPORT', 'LEADING_WHEN', 'LOOP', 'PROPERTY', 'RETURN', 'SWITCH', 'THROW', 'TRY', 'UNTIL', 'WHEN', 'WHILE', 'YIELD'];

  return Indentation;

}).call(this);


},{}],20:[function(require,module,exports){
var LineEndings;

module.exports = LineEndings = (function() {
  class LineEndings {
    lintLine(line, lineApi) {
      var ending, lastChar, ref, valid;
      ending = (ref = lineApi.config[this.rule.name]) != null ? ref.value : void 0;
      if (!ending || lineApi.isLastLine() || !line) {
        return null;
      }
      lastChar = line[line.length - 1];
      valid = (function() {
        if (ending === 'windows') {
          return lastChar === '\r';
        } else if (ending === 'unix') {
          return lastChar !== '\r';
        } else {
          throw new Error(`unknown line ending type: ${ending}`);
        }
      })();
      if (!valid) {
        return {
          columnNumber: line.length,
          context: `Expected ${ending}`
        };
      } else {
        return null;
      }
    }

  };

  LineEndings.prototype.rule = {
    name: 'line_endings',
    level: 'ignore',
    value: 'unix', // or 'windows'
    message: 'Line contains incorrect line endings',
    description: `This rule ensures your project uses only <tt>windows</tt> or
<tt>unix</tt> line endings. This rule is disabled by default.`
  };

  return LineEndings;

}).call(this);


},{}],21:[function(require,module,exports){
var MaxLineLength, regexes;

regexes = {
  literateComment: /^\s*\#\s/, // indentation, up to comment followed by at least one space.
  longUrlComment: /^\s*\#\s.*http[^\s]+.*$/ // indentation, up to comment followed by at least one space.
// Any string may precedes url
// Actual link
// Line may end by other things
};

module.exports = MaxLineLength = (function() {
  class MaxLineLength {
    lintLine(line, lineApi) {
      var isCommentLine, limitComments, lineLength, max, ref, ref1;
      max = (ref = lineApi.config[this.rule.name]) != null ? ref.value : void 0;
      limitComments = (ref1 = lineApi.config[this.rule.name]) != null ? ref1.limitComments : void 0;
      isCommentLine = regexes.literateComment.test(line);
      lineLength = line.replace(/\s+$/, '').length;
      if (lineApi.isLiterate() && isCommentLine) {
        lineLength -= 2;
      }
      if (max && max < lineLength && !regexes.longUrlComment.test(line)) {
        if (!limitComments) {
          if (isCommentLine) {
            return;
          }
        }
        return {
          columnNumber: max,
          context: `Length is ${lineLength}, max is ${max}`
        };
      }
    }

  };

  MaxLineLength.prototype.rule = {
    name: 'max_line_length',
    value: 80,
    level: 'error',
    limitComments: true,
    message: 'Line exceeds maximum allowed length',
    description: `This rule imposes a maximum line length on your code. <a
href="https://www.python.org/dev/peps/pep-0008/">Python's style
guide</a> does a good job explaining why you might want to limit the
length of your lines, though this is a matter of taste.

Lines can be no longer than eighty characters by default.`
  };

  return MaxLineLength;

}).call(this);


},{}],22:[function(require,module,exports){
var MissingFatArrows, any, containsButIsnt,
  indexOf = [].indexOf;

any = function(arr, test) {
  return arr.reduce((function(res, elt) {
    return res || test(elt);
  }), false);
};

containsButIsnt = function(node, nIsThis, nIsClass) {
  var target;
  target = void 0;
  node.traverseChildren(false, function(n) {
    if (nIsClass(n)) {
      return false;
    }
    if (nIsThis(n)) {
      target = n;
      return false;
    }
  });
  return target;
};

module.exports = MissingFatArrows = (function() {
  class MissingFatArrows {
    constructor() {
      this.isCode = this.isCode.bind(this);
      this.isClass = this.isClass.bind(this);
      this.isValue = this.isValue.bind(this);
      this.isObject = this.isObject.bind(this);
      this.isThis = this.isThis.bind(this);
      this.isFatArrowCode = this.isFatArrowCode.bind(this);
    }

    lintAST(node, astApi) {
      this.astApi = astApi;
      this.lintNode(node);
      return void 0;
    }

    lintNode(node, methods = []) {
      var error, isStrict, ref;
      isStrict = (ref = this.astApi.config[this.rule.name]) != null ? ref.is_strict : void 0;
      if (this.isPrototype(node)) {
        return;
      }
      if (this.isConstructor(node)) {
        return;
      }
      // Ignore any nodes we know to be methods
      if ((!this.isFatArrowCode(node)) && (isStrict ? true : indexOf.call(methods, node) < 0) && (this.needsFatArrow(node))) {
        error = this.astApi.createError({
          lineNumber: node.locationData.first_line + 1,
          columnNumber: node.locationData.first_column + 1
        });
        this.errors.push(error);
      }
      return node.eachChild((child) => {
        return this.lintNode(child, (function() {
          switch (false) {
            case !this.isClass(node):
              return this.methodsOfClass(node);
            // Once we've hit a function, we know we can't be in the top
            // level of a method anymore, so we can safely reset the methods
            // to empty to save work.
            case !this.isCode(node):
              return [];
            default:
              return methods;
          }
        }).call(this));
      });
    }

    isCode(node) {
      return this.astApi.getNodeName(node) === 'Code';
    }

    isClass(node) {
      return this.astApi.getNodeName(node) === 'Class';
    }

    isValue(node) {
      return this.astApi.getNodeName(node) === 'Value';
    }

    isObject(node) {
      return this.astApi.getNodeName(node) === 'Obj';
    }

    isPrototype(node) {
      var i, ident, len, props, ref, ref1;
      props = (node != null ? (ref = node.variable) != null ? ref.properties : void 0 : void 0) || [];
      for (i = 0, len = props.length; i < len; i++) {
        ident = props[i];
        if (((ref1 = ident.name) != null ? ref1.value : void 0) === 'prototype') {
          return true;
        }
      }
      return false;
    }

    isThis(node) {
      return this.isValue(node) && node.base.value === 'this';
    }

    isFatArrowCode(node) {
      return this.isCode(node) && node.bound;
    }

    isConstructor(node) {
      var ref, ref1;
      return ((ref = node.variable) != null ? (ref1 = ref.base) != null ? ref1.value : void 0 : void 0) === 'constructor';
    }

    needsFatArrow(node) {
      return this.isCode(node) && (any(node.params, (param) => {
        return param.contains(this.isThis) != null;
      }) || containsButIsnt(node.body, this.isThis, this.isClass));
    }

    methodsOfClass(classNode) {
      var bodyNodes, returnNode;
      bodyNodes = classNode.body.expressions;
      returnNode = bodyNodes[bodyNodes.length - 1];
      if ((returnNode != null) && this.isValue(returnNode) && this.isObject(returnNode.base)) {
        return returnNode.base.properties.map(function(assignNode) {
          return assignNode.value;
        }).filter(this.isCode);
      } else {
        return [];
      }
    }

  };

  MissingFatArrows.prototype.rule = {
    name: 'missing_fat_arrows',
    level: 'ignore',
    is_strict: false,
    message: 'Used `this` in a function without a fat arrow',
    description: `Warns when you use \`this\` inside a function that wasn't defined
with a fat arrow. This rule does not apply to methods defined in a
class, since they have \`this\` bound to the class instance (or the
class itself, for class methods). The option \`is_strict\` is
available for checking bindings of class methods.

It is impossible to statically determine whether a function using
\`this\` will be bound with the correct \`this\` value due to language
features like \`Function.prototype.call\` and
\`Function.prototype.bind\`, so this rule may produce false positives.`
  };

  return MissingFatArrows;

}).call(this);


},{}],23:[function(require,module,exports){
var ParseintRadix;

module.exports = ParseintRadix = (function() {
  class ParseintRadix {
    lintToken(token, tokenApi) {
      var callEnd, functionName, prevToken;
      [prevToken, functionName] = tokenApi.peek(-1);
      if (functionName === 'parseInt') {
        [callEnd] = tokenApi.peek(2);
        if (callEnd === 'CALL_END') {
          return {token};
        }
      }
    }

  };

  ParseintRadix.prototype.rule = {
    name: 'missing_parseint_radix',
    level: 'warn',
    message: 'parseInt is missing the radix argument',
    description: `This rule warns about using parseInt without a radix. From the MDN
developers reference: <q>Always specify this parameter to eliminate
reader confusion and to guarantee predictable behavior.</q>
<pre>
  <code># You would expect this to result in 8, but
  # it might result in 0 (parsed as octal).
  parseInt '08'

  # To be safe, specify the radix argument:
  parseInt '08', 10
  </code>
</pre>`
  };

  ParseintRadix.prototype.tokens = ['CALL_START'];

  return ParseintRadix;

}).call(this);


},{}],24:[function(require,module,exports){
var NewlinesAfterClasses;

module.exports = NewlinesAfterClasses = (function() {
  class NewlinesAfterClasses {
    lintToken(token, tokenApi) {
      var afters, comment, ending, got, lineNumber, lines, numIndents, outdent, ref, ref1, start, trueLine, type;
      [
        type,
        numIndents,
        {
          first_line: lineNumber
        }
      ] = token;
      ({lines} = tokenApi);
      ending = tokenApi.config[this.rule.name].value;
      if (type === 'CLASS') {
        this.classCount++;
      }
      if (this.classCount > 0 && (token.generated != null)) {
        if (type === '{' && ((ref = token.origin) != null ? ref[0] : void 0) === ':') {
          this.classBracesCount++;
        }
        if (type === '}' && ((ref1 = token.origin) != null ? ref1[0] : void 0) === 'OUTDENT') {
          this.classBracesCount--;
          this.classCount--;
          if (this.classCount === 0 && this.classBracesCount === 0) {
            afters = 1;
            comment = 0;
            outdent = token.origin[2].first_line;
            start = Math.min(lineNumber, outdent);
            trueLine = start + 1;
            while (/^\s*(#|$)/.test(lines[start + afters])) {
              if (/^\s*#/.test(lines[start + afters])) {
                comment += 1;
              }
              afters += 1;
            }
            // add up blank lines, subtract comments, subtract 2 because
            // before/after counters started at 1.
            got = afters - comment - 1;
            // if `got` and `ending` don't match throw an error _unless_
            // we are at the end of the file.
            if (got !== ending && trueLine + got !== lines.length) {
              return {
                context: `Expected ${ending} got ${got}`,
                lineNumber: trueLine
              };
            }
          }
        }
      }
    }

  };

  NewlinesAfterClasses.prototype.rule = {
    name: 'newlines_after_classes',
    value: 3,
    level: 'ignore',
    message: 'Wrong count of blank lines between a class and other code',
    description: `<p>Checks the number of blank lines between classes and other code.</p>

Options:
- <pre><code>value</code></pre> - The number of required blank lines
after class definitions. Defaults to 3.`
  };

  NewlinesAfterClasses.prototype.tokens = ['CLASS', '}', '{'];

  NewlinesAfterClasses.prototype.classBracesCount = 0;

  NewlinesAfterClasses.prototype.classCount = 0;

  return NewlinesAfterClasses;

}).call(this);


},{}],25:[function(require,module,exports){
var NoBackticks;

module.exports = NoBackticks = (function() {
  class NoBackticks {
    lintToken(token, tokenApi) {
      if (token.comments == null) {
        return {token};
      }
    }

  };

  NoBackticks.prototype.rule = {
    name: 'no_backticks',
    level: 'error',
    message: 'Backticks are forbidden',
    description: `Backticks allow snippets of JavaScript to be embedded in
CoffeeScript. While some folks consider backticks useful in a few
niche circumstances, they should be avoided because so none of
JavaScript's "bad parts", like <tt>with</tt> and <tt>eval</tt>,
sneak into CoffeeScript.
This rule is enabled by default.`
  };

  NoBackticks.prototype.tokens = ['JS'];

  return NoBackticks;

}).call(this);


},{}],26:[function(require,module,exports){
var NoDebugger;

module.exports = NoDebugger = (function() {
  class NoDebugger {
    lintToken(token, tokenApi) {
      var method, ref, ref1, ref2;
      if (((ref = token[0]) === 'STATEMENT') && token[1] === 'debugger') {
        return {
          token,
          context: `found '${token[0]}'`
        };
      }
      if ((ref1 = tokenApi.config[this.rule.name]) != null ? ref1.console : void 0) {
        if (token[1] === 'console' && ((ref2 = tokenApi.peek(1)) != null ? ref2[0] : void 0) === '.') {
          method = tokenApi.peek(2);
          return {
            token,
            context: `found 'console.${method[1]}'`
          };
        }
      }
    }

  };

  NoDebugger.prototype.rule = {
    name: 'no_debugger',
    level: 'warn',
    message: 'Found debugging code',
    console: false,
    description: `This rule detects \`debugger\` and optionally \`console\` calls
This rule is \`warn\` by default.`
  };

  NoDebugger.prototype.tokens = ['STATEMENT', 'IDENTIFIER'];

  return NoDebugger;

}).call(this);


},{}],27:[function(require,module,exports){
var NoEmptyFunctions, isEmptyCode;

isEmptyCode = function(node, astApi) {
  var nodeName;
  nodeName = astApi.getNodeName(node);
  return nodeName === 'Code' && node.body.isEmpty();
};

module.exports = NoEmptyFunctions = (function() {
  class NoEmptyFunctions {
    lintAST(node, astApi) {
      this.lintNode(node, astApi);
      return void 0;
    }

    lintNode(node, astApi) {
      var error;
      if (isEmptyCode(node, astApi)) {
        error = astApi.createError({
          lineNumber: node.locationData.first_line + 1,
          columnNumber: node.locationData.first_column + 1
        });
        this.errors.push(error);
      }
      return node.eachChild((child) => {
        return this.lintNode(child, astApi);
      });
    }

  };

  NoEmptyFunctions.prototype.rule = {
    name: 'no_empty_functions',
    level: 'ignore',
    message: 'Empty function',
    description: `Disallows declaring empty functions. The goal of this rule is that
unintentional empty callbacks can be detected:
<pre>
<code>someFunctionWithCallback ->
doSomethingSignificant()
</code>
</pre>
The problem is that the call to
<tt>doSomethingSignificant</tt> will be made regardless
of <tt>someFunctionWithCallback</tt>'s execution. It can
be because you did not indent the call to
<tt>doSomethingSignificant</tt> properly.

If you really meant that <tt>someFunctionWithCallback</tt>
should call a callback that does nothing, you can write your code
this way:
<pre>
<code>someFunctionWithCallback ->
    undefined
doSomethingSignificant()
</code>
</pre>`
  };

  return NoEmptyFunctions;

}).call(this);


},{}],28:[function(require,module,exports){
var NoEmptyParamList;

module.exports = NoEmptyParamList = (function() {
  class NoEmptyParamList {
    lintToken(token, tokenApi) {
      var nextType;
      nextType = tokenApi.peek()[0];
      if (nextType === 'PARAM_END') {
        return {token};
      }
    }

  };

  NoEmptyParamList.prototype.rule = {
    name: 'no_empty_param_list',
    level: 'ignore',
    message: 'Empty parameter list is forbidden',
    description: `This rule prohibits empty parameter lists in function definitions.
<pre>
<code># The empty parameter list in here is unnecessary:
myFunction = () -&gt;

# We might favor this instead:
myFunction = -&gt;
</code>
</pre>
Empty parameter lists are permitted by default.`
  };

  NoEmptyParamList.prototype.tokens = ['PARAM_START'];

  return NoEmptyParamList;

}).call(this);


},{}],29:[function(require,module,exports){
var NoImplicitBraces,
  slice = [].slice;

module.exports = NoImplicitBraces = (function() {
  class NoImplicitBraces {
    constructor() {
      this.isClass = false;
      this.className = '';
    }

    lintToken(token, tokenApi) {
      var _type, _val, c, lineNum, peekIdent, prevToken, ref, type, val;
      [type, val, lineNum] = token;
      if (type === 'OUTDENT' || type === 'INDENT' || type === 'CLASS') {
        return this.trackClass(...arguments);
      }
      // reset "className" if class uses EXTENDS keyword
      if (type === 'EXTENDS') {
        this.className = '';
        return;
      }
      // If we're looking at an IDENTIFIER, and we're in a class, and we've not
      // set a className (or the previous non-identifier was 'EXTENDS', set the
      // current identifier as the class name)
      if ((type === 'IDENTIFIER' || type === 'PROPERTY') && this.isClass && this.className === '') {
        // Backtrack to get the full classname
        c = 0;
        while ((ref = tokenApi.peek(c)[0]) === 'IDENTIFIER' || ref === 'PROPERTY' || ref === '.') {
          this.className += tokenApi.peek(c)[1];
          c++;
        }
      }
      if (token.generated && type === '{') {
        // If strict mode is set to false it allows implicit braces when the
        // object is declared over multiple lines.
        if (!tokenApi.config[this.rule.name].strict) {
          [prevToken] = tokenApi.peek(-1);
          if (prevToken === 'INDENT' || prevToken === 'TERMINATOR') {
            return;
          }
        }
        if (this.isClass) {
          // The way CoffeeScript generates tokens for classes
          // is a bit weird. It generates '{' tokens around instance
          // methods (also known as the prototypes of an Object).
          [prevToken] = tokenApi.peek(-1);
          // If there is a TERMINATOR token right before the '{' token
          if (prevToken === 'TERMINATOR') {
            return;
          }
          peekIdent = '';
          c = -2;
          // Go back until you grab all the tokens with IDENTIFIER,
          // PROPERTY or '.'
          while (([_type, _val] = tokenApi.peek(c))) {
            if (_type !== 'IDENTIFIER' && _type !== 'PROPERTY' && _type !== '.') {
              break;
            }
            peekIdent = _val + peekIdent;
            c--;
          }
          if (peekIdent === this.className) {
            return;
          }
        }
        return {
          token: tokenApi.peek(c + 1)
        };
      }
    }

    trackClass(token, tokenApi) {
      var ln, n0, n1, ref, ref1, ref2;
      ref = [token, tokenApi.peek()], (ref1 = ref[0], [n0] = ref1, [ln] = slice.call(ref1, -1)), (ref2 = ref[1], [n1] = ref2);
      if (n0 === 'INDENT') {
        this.dent++;
      }
      if (n0 === 'OUTDENT') {
        this.dent--;
      }
      if (this.dent === 0 && n0 === 'OUTDENT' && n1 === 'TERMINATOR') {
        this.isClass = false;
      }
      if (n0 === 'CLASS') {
        this.isClass = true;
        this.className = '';
      }
      return null;
    }

  };

  NoImplicitBraces.prototype.rule = {
    name: 'no_implicit_braces',
    level: 'ignore',
    message: 'Implicit braces are forbidden',
    strict: true,
    description: `This rule prohibits implicit braces when declaring object literals.
Implicit braces can make code more difficult to understand,
especially when used in combination with optional parenthesis.
<pre>
<code># Do you find this code ambiguous? Is it a
# function call with three arguments or four?
myFunction a, b, 1:2, 3:4

# While the same code written in a more
# explicit manner has no ambiguity.
myFunction(a, b, {1:2, 3:4})
</code>
</pre>
Implicit braces are permitted by default, since their use is
idiomatic CoffeeScript.`
  };

  NoImplicitBraces.prototype.tokens = ['{', 'OUTDENT', 'INDENT', 'CLASS', 'IDENTIFIER', 'PROPERTY', 'EXTENDS'];

  NoImplicitBraces.prototype.dent = 0;

  return NoImplicitBraces;

}).call(this);


},{}],30:[function(require,module,exports){
var NoImplicitParens;

module.exports = NoImplicitParens = (function() {
  class NoImplicitParens {
    lintToken(token, tokenApi) {
      var genCallStart, i, sameLine, t;
      if (token.generated) {
        if (tokenApi.config[this.rule.name].strict !== false) {
          return {token};
        } else {
          // If strict mode is turned off it allows implicit parens when
          // the expression is spread over multiple lines.
          i = -1;
          while (true) {
            t = tokenApi.peek(i);
            sameLine = t[2].first_line === token[2].first_line;
            genCallStart = t[0] === 'CALL_START' && t.generated;
            if ((t == null) || genCallStart && sameLine) {
              return {
                token: t || token
              };
            }
            // If we have not found a CALL_START token that is generated,
            // and we've moved into a new line, this is fine and should
            // just return.
            if (!sameLine) {
              return null;
            }
            i -= 1;
          }
        }
      }
    }

  };

  NoImplicitParens.prototype.rule = {
    name: 'no_implicit_parens',
    level: 'ignore',
    message: 'Implicit parens are forbidden',
    strict: true,
    description: `This rule prohibits implicit parens on function calls.
<pre>
<code># Some folks don't like this style of coding.
myFunction a, b, c

# And would rather it always be written like this:
myFunction(a, b, c)
</code>
</pre>
Implicit parens are permitted by default, since their use is
idiomatic CoffeeScript.`
  };

  NoImplicitParens.prototype.tokens = ['CALL_END'];

  return NoImplicitParens;

}).call(this);


},{}],31:[function(require,module,exports){
var NoInterpolationInSingleQuotes;

module.exports = NoInterpolationInSingleQuotes = (function() {
  class NoInterpolationInSingleQuotes {
    lintToken(token, tokenApi) {
      var hasInterpolation, tokenValue;
      tokenValue = token[1];
      hasInterpolation = tokenValue.match(/^.*#\{[^}]+\}.*$/);
      if (hasInterpolation) {
        return {token};
      }
    }

  };

  NoInterpolationInSingleQuotes.prototype.rule = {
    name: 'no_interpolation_in_single_quotes',
    level: 'ignore',
    message: 'Interpolation in single quoted strings is forbidden',
    description: `This rule prohibits string interpolation in a single quoted string.
<pre>
<code># String interpolation in single quotes is not allowed:
foo = '#{bar}'

# Double quotes is OK of course
foo = "#{bar}"
</code>
</pre>
String interpolation in single quoted strings is permitted by
default.`
  };

  NoInterpolationInSingleQuotes.prototype.tokens = ['STRING'];

  return NoInterpolationInSingleQuotes;

}).call(this);


},{}],32:[function(require,module,exports){
var NoNestedStringInterpolation;

module.exports = NoNestedStringInterpolation = (function() {
  class NoNestedStringInterpolation {
    constructor() {
      this.blocks = [];
    }

    lintToken(token, tokenApi) {
      var block, ref, tag, tagname, tagtype;
      [tag] = token;
      if (!this.blocks.length) {
        this.blocks.push([]);
      }
      block = this.blocks[this.blocks.length - 1];
      if (tag === 'JSX_TAG') {
        this.blocks.push([]);
        return;
      }
      [tagname, tagtype] = tag.split('_');
      if (tagtype === 'END') {
        block.pop();
        if (tagname === 'STRING') {
          block.strCount -= 1;
          if (block.strCount <= 1) {
            block.error = false;
          }
        } else {
          this.blocks.pop();
        }
        if (!block.length) {
          this.blocks.pop();
        }
        if (!this.blocks.length) {
          this.blocks.push([]);
        }
      } else {
        block.push(tagname);
        if (tagname === 'STRING') {
          block.strCount = ((ref = block.strCount) != null ? ref : 0) + 1;
          // Don't make multiple errors for deeply nested interpolation
          if (block.strCount > 1 && !block.error) {
            block.error = true;
            return {token};
          }
        }
      }
    }

  };

  NoNestedStringInterpolation.prototype.rule = {
    name: 'no_nested_string_interpolation',
    level: 'warn',
    message: 'Nested string interpolation is forbidden',
    description: `This rule warns about nested string interpolation,
as it tends to make code harder to read and understand.
<pre>
<code># Good!
str = "Book by #{firstName.toUpperCase()} #{lastName.toUpperCase()}"

# Bad!
str = "Book by #{"#{firstName} #{lastName}".toUpperCase()}"
</code>
</pre>`
  };

  NoNestedStringInterpolation.prototype.tokens = ['JSX_TAG', 'CALL_START', 'CALL_END', 'STRING_START', 'STRING_END'];

  return NoNestedStringInterpolation;

}).call(this);


},{}],33:[function(require,module,exports){
var NoPlusPlus;

module.exports = NoPlusPlus = (function() {
  class NoPlusPlus {
    lintToken(token, tokenApi) {
      return {
        token,
        context: `found '${token[0]}'`
      };
    }

  };

  NoPlusPlus.prototype.rule = {
    name: 'no_plusplus',
    level: 'ignore',
    message: 'The increment and decrement operators are forbidden',
    description: `This rule forbids the increment and decrement arithmetic operators.
Some people believe the <tt>++</tt> and <tt>--</tt> to be cryptic
and the cause of bugs due to misunderstandings of their precedence
rules.
This rule is disabled by default.`
  };

  NoPlusPlus.prototype.tokens = ['++', '--'];

  return NoPlusPlus;

}).call(this);


},{}],34:[function(require,module,exports){
var NoPrivateFunctionFatArrows,
  indexOf = [].indexOf;

module.exports = NoPrivateFunctionFatArrows = (function() {
  class NoPrivateFunctionFatArrows {
    constructor() {
      this.isCode = this.isCode.bind(this);
      this.isClass = this.isClass.bind(this);
      this.isValue = this.isValue.bind(this);
      this.isObject = this.isObject.bind(this);
      this.isFatArrowCode = this.isFatArrowCode.bind(this);
    }

    lintAST(node, astApi) {
      this.astApi = astApi;
      this.lintNode(node);
      return void 0;
    }

    lintNode(node, functions = []) {
      var error;
      if (this.isFatArrowCode(node) && indexOf.call(functions, node) >= 0) {
        error = this.astApi.createError({
          lineNumber: node.locationData.first_line + 1,
          columnNumber: node.locationData.first_column + 1
        });
        this.errors.push(error);
      }
      return node.eachChild((child) => {
        return this.lintNode(child, (function() {
          switch (false) {
            case !this.isClass(node):
              return this.functionsOfClass(node);
            // Once we've hit a function, we know we can't be in the top
            // level of a function anymore, so we can safely reset the
            // functions to empty to save work.
            case !this.isCode(node):
              return [];
            default:
              return functions;
          }
        }).call(this));
      });
    }

    isCode(node) {
      return this.astApi.getNodeName(node) === 'Code';
    }

    isClass(node) {
      return this.astApi.getNodeName(node) === 'Class';
    }

    isValue(node) {
      return this.astApi.getNodeName(node) === 'Value';
    }

    isObject(node) {
      return this.astApi.getNodeName(node) === 'Obj';
    }

    isFatArrowCode(node) {
      return this.isCode(node) && node.bound;
    }

    functionsOfClass(classNode) {
      var bodyNode, bodyValues;
      bodyValues = (function() {
        var i, len, ref, results;
        ref = classNode.body.expressions;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          bodyNode = ref[i];
          if (this.isValue(bodyNode) && this.isObject(bodyNode.base)) {
            continue;
          }
          results.push(bodyNode.value);
        }
        return results;
      }).call(this);
      return bodyValues.filter(this.isCode);
    }

  };

  NoPrivateFunctionFatArrows.prototype.rule = {
    name: 'no_private_function_fat_arrows',
    level: 'warn',
    message: 'Used the fat arrow for a private function',
    description: `Warns when you use the fat arrow for a private function
inside a class definition scope. It is not necessary and
it does not do anything.`
  };

  return NoPrivateFunctionFatArrows;

}).call(this);


},{}],35:[function(require,module,exports){
var NoSpaces, indentationRegex,
  indexOf = [].indexOf;

indentationRegex = /\S/;

module.exports = NoSpaces = (function() {
  class NoSpaces {
    lintLine(line, lineApi) {
      var indentation;
      // Only check lines that have compiled tokens. This helps
      // us ignore spaces in the middle of multi line strings, heredocs, etc.
      // since they are all reduced to a single token whose line number
      // is the start of the expression.
      indentation = line.split(indentationRegex)[0];
      if (lineApi.lineHasToken() && indexOf.call(indentation, '\ ') >= 0) {
        return true;
      } else {
        return null;
      }
    }

  };

  NoSpaces.prototype.rule = {
    name: 'no_spaces',
    level: 'ignore',
    message: 'Line contains space indentation',
    description: `This rule forbids spaces in indentation. It is disabled by default.`
  };

  return NoSpaces;

}).call(this);


},{}],36:[function(require,module,exports){
var NoStandAloneAt;

module.exports = NoStandAloneAt = (function() {
  class NoStandAloneAt {
    lintToken(token, tokenApi) {
      var isAStart, isDot, isProp, isProtoProp, nextToken, noSpace, ref, ref1;
      [nextToken] = tokenApi.peek();
      noSpace = !token.spaced;
      isProp = nextToken === 'PROPERTY';
      isAStart = nextToken === 'INDEX_START' || nextToken === 'CALL_START'; // @[] or @()
      isDot = nextToken === '.';
      // https://github.com/jashkenas/coffee-script/issues/1601
      // @::foo is valid, but @:: behaves inconsistently and is planned for
      // removal. Technically @:: is a stand alone ::, but I think it makes
      // sense to group it into no_stand_alone_at
      isProtoProp = nextToken === '::' && ((ref = (ref1 = tokenApi.peek(2)) != null ? ref1[0] : void 0) === 'PROPERTY');
      // Return an error after an '@' token unless:
      // 1: there is a '.' afterwards (isDot)
      // 2: there isn't a space after the '@' and the token following the '@'
      // is an property, the start of an index '[' or is an property after
      // the '::'
      if (!(isDot || (noSpace && (isProp || isAStart || isProtoProp)))) {
        return {token};
      }
    }

  };

  NoStandAloneAt.prototype.rule = {
    name: 'no_stand_alone_at',
    level: 'ignore',
    message: '@ must not be used stand alone',
    description: `This rule checks that no stand alone @ are in use, they are
discouraged. Further information in CoffeeScript issue <a
href="https://github.com/jashkenas/coffee-script/issues/1601">
#1601</a>`
  };

  NoStandAloneAt.prototype.tokens = ['@'];

  return NoStandAloneAt;

}).call(this);


},{}],37:[function(require,module,exports){
var NoTabs, indentationRegex,
  indexOf = [].indexOf;

indentationRegex = /\S/;

module.exports = NoTabs = (function() {
  class NoTabs {
    lintLine(line, lineApi) {
      var indentation;
      // Only check lines that have compiled tokens. This helps
      // us ignore tabs in the middle of multi line strings, heredocs, etc.
      // since they are all reduced to a single token whose line number
      // is the start of the expression.
      indentation = line.split(indentationRegex)[0];
      if (lineApi.lineHasToken() && indexOf.call(indentation, '\t') >= 0) {
        return {
          columnNumber: indentation.indexOf('\t')
        };
      } else if (lineApi.lineHasToken() && line.match(/\t *$/)) {
        return {
          columnNumber: indentation.indexOf('\t')
        };
      } else {
        return null;
      }
    }

  };

  NoTabs.prototype.rule = {
    name: 'no_tabs',
    level: 'error',
    message: 'Line contains tab indentation',
    description: `This rule forbids tabs in indentation. Enough said. It is enabled by
default.`
  };

  return NoTabs;

}).call(this);


},{}],38:[function(require,module,exports){
var NoThis;

module.exports = NoThis = (function() {
  class NoThis {
    lintToken(token, tokenApi) {
      var level, nextToken, ref;
      ({
        config: {
          no_stand_alone_at: {level}
        }
      } = tokenApi);
      nextToken = (ref = tokenApi.peek(1)) != null ? ref[0] : void 0;
      if (!(level !== 'ignore' && nextToken !== '.')) {
        return {token};
      }
    }

  };

  NoThis.prototype.rule = {
    name: 'no_this',
    level: 'ignore',
    message: "Don't use 'this', use '@' instead",
    description: `This rule prohibits 'this'.
Use '@' instead.`
  };

  NoThis.prototype.tokens = ['THIS'];

  return NoThis;

}).call(this);


},{}],39:[function(require,module,exports){
var NoThrowingStrings;

module.exports = NoThrowingStrings = (function() {
  class NoThrowingStrings {
    lintToken(token, tokenApi) {
      var n1, nextIsString, ref;
      ref = tokenApi.peek(), [n1] = ref;
      // Catch literals and string interpolations, which are wrapped in parens.
      nextIsString = n1 === 'STRING' || n1 === 'STRING_START';
      if (nextIsString) {
        return {token};
      }
    }

  };

  NoThrowingStrings.prototype.rule = {
    name: 'no_throwing_strings',
    level: 'error',
    message: 'Throwing strings is forbidden',
    description: `This rule forbids throwing string literals or interpolations. While
JavaScript (and CoffeeScript by extension) allow any expression to
be thrown, it is best to only throw <a
href="https://developer.mozilla.org
/en/JavaScript/Reference/Global_Objects/Error"> Error</a> objects,
because they contain valuable debugging information like the stack
trace. Because of JavaScript's dynamic nature, CoffeeLint cannot
ensure you are always throwing instances of <tt>Error</tt>. It will
only catch the simple but real case of throwing literal strings.
<pre>
<code># CoffeeLint will catch this:
throw "i made a boo boo"

# ... but not this:
throw getSomeString()
</code>
</pre>
This rule is enabled by default.`
  };

  NoThrowingStrings.prototype.tokens = ['THROW'];

  return NoThrowingStrings;

}).call(this);


},{}],40:[function(require,module,exports){
var NoTrailingSemicolons, regexes,
  indexOf = [].indexOf,
  splice = [].splice;

regexes = {
  trailingSemicolon: /;\r?$/
};

module.exports = NoTrailingSemicolons = (function() {
  class NoTrailingSemicolons {
    lintLine(line, lineApi) {
      var endPos, first, hasNewLine, hasSemicolon, last, lineTokens, newLine, ref, ref1, ref2, startCounter, startPos, stopTokens, tokenLen;
      // The TERMINATOR token is extended through to the next token. As a
      // result a line with a comment DOES have a token: the TERMINATOR from
      // the last line of code.
      lineTokens = lineApi.getLineTokens();
      tokenLen = lineTokens.length;
      stopTokens = ['TERMINATOR', 'HERECOMMENT'];
      if (tokenLen === 1 && (ref = lineTokens[0][0], indexOf.call(stopTokens, ref) >= 0)) {
        return;
      }
      if (tokenLen === 2 && lineTokens[1].generated && (ref1 = lineTokens[0][0], indexOf.call(stopTokens, ref1) >= 0)) {
        return;
      }
      newLine = line;
      if (tokenLen > 1 && lineTokens[tokenLen - 1][0] === 'TERMINATOR') {
        // `startPos` contains the end pos of the last non-TERMINATOR token
        // `endPos` contains the start position of the TERMINATOR token

        // if startPos and endPos arent equal, that probably means a comment
        // was sliced out of the tokenizer
        startPos = lineTokens[tokenLen - 2][2].last_column + 1;
        endPos = lineTokens[tokenLen - 1][2].first_column;
        if (startPos !== endPos) {
          startCounter = startPos;
          while (line[startCounter] !== '#' && startCounter < line.length) {
            startCounter++;
          }
          newLine = line.substring(0, startCounter).replace(/\s*$/, '');
        }
      }
      hasSemicolon = regexes.trailingSemicolon.test(newLine);
      [...first] = lineTokens, [last] = splice.call(first, -1);
      hasNewLine = last && (last.newLine != null);
      // Don't throw errors when the contents of multiline strings,
      // regexes and the like end in ";"
      if (hasSemicolon && !hasNewLine && lineApi.lineHasToken() && !((ref2 = last[0]) === 'STRING' || ref2 === 'IDENTIFIER' || ref2 === 'STRING_END')) {
        return true;
      }
    }

  };

  NoTrailingSemicolons.prototype.rule = {
    name: 'no_trailing_semicolons',
    level: 'error',
    message: 'Line contains a trailing semicolon',
    description: `This rule prohibits trailing semicolons, since they are needless
cruft in CoffeeScript.
<pre>
<code># This semicolon is meaningful.
x = '1234'; console.log(x)

# This semicolon is redundant.
alert('end of line');
</code>
</pre>
Trailing semicolons are forbidden by default.`
  };

  return NoTrailingSemicolons;

}).call(this);


},{}],41:[function(require,module,exports){
var NoTrailingWhitespace, regexes;

regexes = {
  trailingWhitespace: /[^\s]+[\t ]+\r?$/,
  onlySpaces: /^[\t ]+\r?$/,
  spacesStart: /[\t ]+\r?$/,
  lineHasComment: /^\s*[^\#]*\#/
};

module.exports = NoTrailingWhitespace = (function() {
  class NoTrailingWhitespace {
    lintLine(line, lineApi) {
      var i, len, ref, ref1, ref2, str, token, tokens;
      if (!((ref = lineApi.config['no_trailing_whitespace']) != null ? ref.allowed_in_empty_lines : void 0)) {
        if (regexes.onlySpaces.test(line)) {
          return {
            columnNumber: line.match(regexes.spacesStart).length + 1
          };
        }
      }
      if (regexes.trailingWhitespace.test(line)) {
        // By default only the regex above is needed.
        if (!((ref1 = lineApi.config['no_trailing_whitespace']) != null ? ref1.allowed_in_comments : void 0)) {
          return {
            columnNumber: line.match(regexes.spacesStart).index + 1
          };
        }
        line = line;
        tokens = lineApi.tokensByLine[lineApi.lineNumber];
        if (!tokens) {
          return null;
        }
        ref2 = (function() {
          var j, len, results;
          results = [];
          for (j = 0, len = tokens.length; j < len; j++) {
            token = tokens[j];
            if (token[0] === 'STRING') {
              results.push(token[1]);
            }
          }
          return results;
        })();
        // To avoid confusion when a string might contain a "#", every string
        // on this line will be removed. before checking for a comment
        for (i = 0, len = ref2.length; i < len; i++) {
          str = ref2[i];
          line = line.replace(str, 'STRING');
        }
        if (!regexes.lineHasComment.test(line)) {
          return {
            columnNumber: line.match(regexes.spacesStart).index + 1
          };
        }
      }
    }

  };

  NoTrailingWhitespace.prototype.rule = {
    name: 'no_trailing_whitespace',
    level: 'error',
    message: 'Line ends with trailing whitespace',
    allowed_in_comments: false,
    allowed_in_empty_lines: true,
    description: `This rule forbids trailing whitespace in your code, since it is
needless cruft. It is enabled by default.`
  };

  return NoTrailingWhitespace;

}).call(this);


},{}],42:[function(require,module,exports){
var NoUnnecessaryDoubleQuotes;

module.exports = NoUnnecessaryDoubleQuotes = (function() {
  class NoUnnecessaryDoubleQuotes {
    constructor() {
      this.regexps = [];
      this.interpolationLevel = 0;
      this.inJSX = false;
      this.JSXCallLevel = 0;
    }

    lintToken(token, tokenApi) {
      var hasLegalConstructs, isSingleBlock, isSingleQuote, ref, tokenValue, type;
      [type, tokenValue] = token;
      if (type === 'STRING_START' || type === 'STRING_END') {
        return this.trackInterpolation(...arguments);
      }
      if (type === 'JSX_TAG' || type === 'CALL_START' || type === 'CALL_END') {
        return this.trackJSX(...arguments);
      }
      isSingleQuote = tokenValue.quote === "'";
      isSingleBlock = tokenValue.quote === "'''";
      if (isSingleQuote || isSingleBlock) { // no double quotes, all OK
        return false;
      }
      // When CoffeeScript generates calls to RegExp it double quotes the 2nd
      // parameter. Using peek(2) becuase the peek(1) would be a CALL_END
      if (((ref = tokenApi.peek(2)) != null ? ref[0] : void 0) === 'REGEX_END') {
        return false;
      }
      hasLegalConstructs = this.inJSX || this.isInInterpolation() || this.hasSingleQuote(tokenValue);
      if (!hasLegalConstructs) {
        return {token};
      }
    }

    isInInterpolation() {
      return this.interpolationLevel > 0;
    }

    trackInterpolation(token, tokenApi) {
      if (token[0] === 'STRING_START') {
        this.interpolationLevel += 1;
      } else if (token[0] === 'STRING_END') {
        this.interpolationLevel -= 1;
      }
      // We're not linting, just tracking interpolations.
      return null;
    }

    trackJSX(token, tokenApi) {
      if (token[0] === 'JSX_TAG') {
        this.inJSX = true;
      } else if (token[0] === 'CALL_START') {
        if (this.inJSX) {
          this.JSXCallLevel += 1;
        }
      } else if (token[0] === 'CALL_END') {
        if (this.inJSX) {
          this.JSXCallLevel -= 1;
          if (this.JSXCallLevel === 0) {
            this.inJSX = false;
          }
        }
      }
      // We're not linting, just tracking interpolations.
      return null;
    }

    hasSingleQuote(tokenValue) {
      return tokenValue.indexOf("'") !== -1;
    }

  };

  NoUnnecessaryDoubleQuotes.prototype.rule = {
    name: 'no_unnecessary_double_quotes',
    level: 'ignore',
    message: 'Unnecessary double quotes are forbidden',
    description: `This rule prohibits double quotes unless string interpolation is
used or the string contains single quotes.
<pre>
<code># Double quotes are discouraged:
foo = "bar"

# Unless string interpolation is used:
foo = "#{bar}baz"

# Or they prevent cumbersome escaping:
foo = "I'm just following the 'rules'"
</code>
</pre>
Double quotes are permitted by default.`
  };

  NoUnnecessaryDoubleQuotes.prototype.tokens = ['STRING', 'STRING_START', 'STRING_END', 'JSX_TAG', 'CALL_START', 'CALL_END'];

  return NoUnnecessaryDoubleQuotes;

}).call(this);


},{}],43:[function(require,module,exports){
var NoUnnecessaryFatArrows, any;

any = function(arr, test) {
  return arr.reduce((function(res, elt) {
    return res || test(elt);
  }), false);
};

module.exports = NoUnnecessaryFatArrows = (function() {
  class NoUnnecessaryFatArrows {
    constructor() {
      this.isThis = this.isThis.bind(this);
      this.needsFatArrow = this.needsFatArrow.bind(this);
    }

    lintAST(node, astApi) {
      this.astApi = astApi;
      this.lintNode(node);
      return void 0;
    }

    lintNode(node) {
      var error;
      if ((this.isFatArrowCode(node)) && (!this.needsFatArrow(node))) {
        error = this.astApi.createError({
          lineNumber: node.locationData.first_line + 1,
          columnNumber: node.locationData.first_column + 1
        });
        this.errors.push(error);
      }
      return node.eachChild((child) => {
        return this.lintNode(child);
      });
    }

    isCode(node) {
      return this.astApi.getNodeName(node) === 'Code';
    }

    isFatArrowCode(node) {
      return this.isCode(node) && node.bound;
    }

    isValue(node) {
      return this.astApi.getNodeName(node) === 'Value';
    }

    isThis(node) {
      var ref;
      return ((ref = node.constructor) != null ? ref.name : void 0) === 'ThisLiteral' || this.isValue(node) && node.base.value === 'this';
    }

    needsFatArrow(node) {
      return this.isCode(node) && (any(node.params, (param) => {
        return param.contains(this.isThis) != null;
      }) || (node.body.contains(this.isThis) != null) || (node.body.contains((child) => {
        var ref;
        if (!this.astApi.getNodeName(child)) {
          return ((ref = child.constructor) != null ? ref.name : void 0) === 'SuperCall';
        } else {
          return this.isFatArrowCode(child) && this.needsFatArrow(child);
        }
      }) != null));
    }

  };

  NoUnnecessaryFatArrows.prototype.rule = {
    name: 'no_unnecessary_fat_arrows',
    level: 'warn',
    message: 'Unnecessary fat arrow',
    description: `Disallows defining functions with fat arrows when \`this\`
is not used within the function.`
  };

  return NoUnnecessaryFatArrows;

}).call(this);


},{}],44:[function(require,module,exports){
var NonEmptyConstructorNeedsParens, ParentClass;

ParentClass = require('./empty_constructor_needs_parens.coffee');

module.exports = NonEmptyConstructorNeedsParens = (function() {
  class NonEmptyConstructorNeedsParens extends ParentClass {
    handleExpectedCallStart(isCallStart, tokenApi) {
      if (isCallStart[0] === 'CALL_START' && isCallStart.generated) {
        return {
          token: tokenApi.peek(isCallStart, 1)
        };
      }
    }

  };

  NonEmptyConstructorNeedsParens.prototype.rule = {
    name: 'non_empty_constructor_needs_parens',
    level: 'ignore',
    message: 'Invoking a constructor without parens and with arguments',
    description: `Requires constructors with parameters to include the parens`
  };

  return NonEmptyConstructorNeedsParens;

}).call(this);


},{"./empty_constructor_needs_parens.coffee":16}],45:[function(require,module,exports){
var ObjectShorthand;

module.exports = ObjectShorthand = (function() {
  class ObjectShorthand {
    lintToken(token, tokenApi) {
      var checkExplicit, explicit, property, value;
      checkExplicit = function() {
        var current;
        current = -2;
        while (tokenApi.peek(current)[0] !== '{') {
          current--;
        }
        return !tokenApi.peek(current).generated;
      };
      // Get the property name and the value
      property = tokenApi.peek(-1);
      value = tokenApi.peek(1);
      // Check if we have explicit {}
      explicit = checkExplicit();
      if (explicit && property[1] === value[1]) {
        return {
          context: `Use '{${property[1]}}'`
        };
      } else {
        return null;
      }
    }

  };

  ObjectShorthand.prototype.rule = {
    name: 'object_shorthand',
    level: 'ignore',
    message: 'Use property-value shorthand when using explicit braces',
    description: `<p>Use property value shorthand in objects, when explicit braces are used.</p>
<pre><code>test = "value"

# Good
{test}
test: test

# Bad
{test: test}
</code></pre>`
  };

  ObjectShorthand.prototype.tokens = [':'];

  return ObjectShorthand;

}).call(this);


},{}],46:[function(require,module,exports){
var PreferEnglishOperator,
  indexOf = [].indexOf;

module.exports = PreferEnglishOperator = (function() {
  class PreferEnglishOperator {
    lintToken(token, tokenApi) {
      var actual_token, config, context, first_column, last_column, level, line;
      config = tokenApi.config[this.rule.name];
      level = config.level;
      // Compare the actual token with the lexed token.
      ({first_column, last_column} = token[2]);
      line = tokenApi.lines[tokenApi.lineNumber];
      actual_token = line.slice(first_column, +last_column + 1 || 9e9);
      context = (function() {
        var ref, ref1;
        switch (true) {
          case actual_token === '==' && indexOf.call(config.ops, 'is') >= 0:
            return 'Replace "==" with "is"';
          case actual_token === '!=' && indexOf.call(config.ops, 'isnt') >= 0:
            return 'Replace "!=" with "isnt"';
          case actual_token === '||' && indexOf.call(config.ops, 'or') >= 0:
            return 'Replace "||" with "or"';
          case actual_token === '&&' && indexOf.call(config.ops, 'and') >= 0:
            return 'Replace "&&" with "and"';
          case actual_token === '!' && indexOf.call(config.ops, 'not') >= 0:
            // `not not expression` seems awkward, so `!!expression`
            // gets special handling.
            if (((ref = tokenApi.peek(1)) != null ? ref[0] : void 0) === 'UNARY_MATH') {
              level = config.doubleNotLevel;
              return '"?" is usually better than "!!"';
            } else if (((ref1 = tokenApi.peek(-1)) != null ? ref1[0] : void 0) === 'UNARY_MATH') {
              // Ignore the 2nd half of the double not
              return void 0;
            } else {
              return 'Replace "!" with "not"';
            }
            break;
          default:
            return void 0;
        }
      })();
      if (context != null) {
        return {token, level, context};
      }
    }

  };

  PreferEnglishOperator.prototype.rule = {
    name: 'prefer_english_operator',
    level: 'ignore',
    message: 'Don\'t use &&, ||, ==, !=, or !',
    doubleNotLevel: 'ignore',
    ops: ['and', 'or', 'not', 'is', 'isnt'],
    description: `This rule prohibits &&, ||, ==, != and !.
Use and, or, is, isnt, and not instead.
!! for converting to a boolean is ignored.`
  };

  PreferEnglishOperator.prototype.tokens = ['COMPARE', 'UNARY_MATH', '&&', '||'];

  return PreferEnglishOperator;

}).call(this);


},{}],47:[function(require,module,exports){
var MissingFatArrows,
  indexOf = [].indexOf;

module.exports = MissingFatArrows = (function() {
  class MissingFatArrows {
    constructor() {
      this.isCode = this.isCode.bind(this);
      this.isClass = this.isClass.bind(this);
      this.isValue = this.isValue.bind(this);
      this.isObject = this.isObject.bind(this);
      this.isFatArrowCode = this.isFatArrowCode.bind(this);
      this.insideMethod = [false];
    }

    lintAST(node, astApi) {
      this.astApi = astApi;
      this.lintNode(node);
      return void 0;
    }

    lintNode(node, methods = []) {
      var error;
      if (indexOf.call(methods, node) >= 0) {
        this.insideMethod.push(true);
      } else if (this.isClass(node)) {
        this.insideMethod.push(false);
      } else if ((this.isCode(node)) && this.insideMethod[this.insideMethod.length - 1] && !this.isFatArrowCode(node)) {
        error = this.astApi.createError({
          lineNumber: node.locationData.first_line + 1
        });
        this.errors.push(error);
      }
      node.eachChild((child) => {
        return this.lintNode(child, (function() {
          switch (false) {
            case !this.isClass(node):
              return this.methodsOfClass(node);
            // Once we've hit a function, we know we can't be in the top
            // level of a method anymore, so we can safely reset the methods
            // to empty to save work.
            case !this.isCode(node):
              return [];
            default:
              return methods;
          }
        }).call(this));
      });
      if (indexOf.call(methods, node) >= 0 || this.isClass(node)) {
        return this.insideMethod.pop();
      }
    }

    isCode(node) {
      return this.astApi.getNodeName(node) === 'Code';
    }

    isClass(node) {
      return this.astApi.getNodeName(node) === 'Class';
    }

    isValue(node) {
      return this.astApi.getNodeName(node) === 'Value';
    }

    isObject(node) {
      return this.astApi.getNodeName(node) === 'Obj';
    }

    isFatArrowCode(node) {
      return this.isCode(node) && node.bound;
    }

    methodsOfClass(classNode) {
      var bodyNodes, returnNode;
      bodyNodes = classNode.body.expressions;
      returnNode = bodyNodes[bodyNodes.length - 1];
      if ((returnNode != null) && this.isValue(returnNode) && this.isObject(returnNode.base)) {
        return returnNode.base.properties.map(function(assignNode) {
          return assignNode.value;
        }).filter(this.isCode);
      } else {
        return [];
      }
    }

  };

  MissingFatArrows.prototype.rule = {
    name: 'prefer_fat_arrows_in_methods',
    level: 'ignore',
    message: 'Require fat arrows inside method bodies',
    description: `Warns when you do not use a fat arrow for functions defined inside
method bodies. This assures that \`this\` is always bound to the
method's object inside the code block of a method.`
  };

  return MissingFatArrows;

}).call(this);


},{}],48:[function(require,module,exports){
var PreferLogicalOperator;

module.exports = PreferLogicalOperator = (function() {
  class PreferLogicalOperator {
    lintToken(token, tokenApi) {
      var actual_token, context, first_column, last_column, line;
      // Compare the actual token with the lexed token.
      ({first_column, last_column} = token[2]);
      line = tokenApi.lines[tokenApi.lineNumber];
      actual_token = line.slice(first_column, +last_column + 1 || 9e9);
      if (token[0] === 'COMPOUND_ASSIGN' && (actual_token === 'or=' || actual_token === 'and=')) {
        actual_token = token.origin[1];
      }
      context = (function() {
        switch (actual_token) {
          case 'is':
            return 'Replace "is" with "=="';
          case 'isnt':
            return 'Replace "isnt" with "!="';
          case 'or':
            return 'Replace "or" with "||"';
          case 'and':
            return 'Replace "and" with "&&"';
          case 'not':
            return 'Replace "not" with "!"';
          case 'yes':
            return 'Replace "yes" with true';
          case 'on':
            return 'Replace "on" with true';
          case 'off':
            return 'Replace "off" with false';
          case 'no':
            return 'Replace "no" with false';
          default:
            return void 0;
        }
      })();
      if (context != null) {
        return {token, context};
      }
    }

  };

  PreferLogicalOperator.prototype.rule = {
    name: 'prefer_logical_operator',
    level: 'ignore',
    message: 'Don\'t use is, isnt, not, and, or, yes, on, no, off',
    doubleNotLevel: 'ignore',
    description: `This rule prohibits is, isnt, not, and, or, yes, on, no, off.
Use ==, !=, !, &&, ||, true, false instead.`
  };

  PreferLogicalOperator.prototype.tokens = ['COMPARE', 'UNARY', 'BOOL', 'COMPOUND_ASSIGN', '&&', '||'];

  return PreferLogicalOperator;

}).call(this);


},{}],49:[function(require,module,exports){
var SpaceOperators,
  indexOf = [].indexOf;

module.exports = SpaceOperators = (function() {
  class SpaceOperators {
    constructor() {
      this.callTokens = []; // A stack tracking the call token pairs.
      this.parenTokens = []; // A stack tracking the parens token pairs.
      this.interpolationLevel = 0;
      this.isParam = 0;
    }

    lintToken(token, tokenApi) {
      var rest, type;
      [type, ...rest] = token;
      // These just keep track of state
      if (type === 'CALL_START' || type === 'CALL_END') {
        this.trackCall(token, tokenApi);
        return;
      }
      if (type === 'PARAM_START' || type === 'PARAM_END') {
        this.trackParams(token, tokenApi);
        return;
      }
      if (type === 'STRING_START' || type === 'STRING_END') {
        this.trackParens(token, tokenApi);
        return;
      }
      // These may return errors
      if (type === '+' || type === '-') {
        return this.lintPlus(token, tokenApi);
      } else {
        return this.lintMath(token, tokenApi);
      }
    }

    lintPlus(token, tokenApi) {
      var isUnary, notFirstToken, p, ref, unaries;
      // We can't check this inside of interpolations right now, because the
      // plusses used for the string type co-ercion are marked not spaced.
      if (this.isInInterpolation() || this.isInExtendedRegex()) {
        return null;
      }
      p = tokenApi.peek(-1);
      unaries = ['TERMINATOR', '(', '=', '-', '+', ',', 'CALL_START', 'INDEX_START', '..', '...', 'COMPARE', 'IF', 'THROW', '&', '^', '|', '&&', '||', 'POST_IF', ':', '[', 'INDENT', 'COMPOUND_ASSIGN', 'RETURN', 'MATH', 'BY', 'LEADING_WHEN'];
      isUnary = !p ? false : (ref = p[0], indexOf.call(unaries, ref) >= 0);
      notFirstToken = p || (token.spaced != null) || token.newLine;
      if (notFirstToken && ((isUnary && (token.spaced != null)) || (!isUnary && !token.newLine && (!token.spaced || (p && !p.spaced))))) {
        return {
          token,
          context: token[1]
        };
      } else {
        return null;
      }
    }

    lintMath(token, tokenApi) {
      var default_parameters, p;
      default_parameters = tokenApi.config[this.rule.name].default_parameters;
      p = tokenApi.peek(-1);
      if (!default_parameters && this.isParam > 0 && token[0] === '=') {
        if (token.spaced || (p && p.spaced)) {
          return {
            token,
            context: token[1]
          };
        } else {
          return null;
        }
      } else if (!token.newLine && (!token.spaced || (p && !p.spaced))) {
        return {
          token,
          context: token[1]
        };
      } else {
        return null;
      }
    }

    isInExtendedRegex() {
      var i, len, ref, t;
      ref = this.callTokens;
      for (i = 0, len = ref.length; i < len; i++) {
        t = ref[i];
        if (t.isRegex) {
          return true;
        }
      }
      return false;
    }

    isInInterpolation() {
      return this.interpolationLevel > 0;
    }

    trackCall(token, tokenApi) {
      var p;
      if (token[0] === 'CALL_START') {
        p = tokenApi.peek(-1);
        // Track regex calls, to know (approximately) if we're in an
        // extended regex.
        token.isRegex = p && p[0] === 'IDENTIFIER' && p[1] === 'RegExp';
        this.callTokens.push(token);
      } else {
        this.callTokens.pop();
      }
      return null;
    }

    trackParens(token, tokenApi) {
      if (token[0] === 'STRING_START') {
        this.interpolationLevel += 1;
      } else if (token[0] === 'STRING_END') {
        this.interpolationLevel -= 1;
      }
      // We're not linting, just tracking interpolations.
      return null;
    }

    trackParams(token, tokenApi) {
      if (token[0] === 'PARAM_START') {
        this.isParam++;
      } else if (token[0] === 'PARAM_END') {
        this.isParam--;
      }
      // We're not linting, just tracking function params.
      return null;
    }

  };

  SpaceOperators.prototype.rule = {
    name: 'space_operators',
    level: 'ignore',
    message: 'Operators must be spaced properly',
    description: `This rule enforces that operators have space around them.
Optionally, you can set \`default_parameters\` to \`false\` to
require no space around \`=\` when used to define default paramaters.`,
    default_parameters: true
  };

  SpaceOperators.prototype.tokens = ['+', '-', '=', '**', 'MATH', 'COMPARE', '&', '^', '|', '&&', '||', 'COMPOUND_ASSIGN', 'STRING_START', 'STRING_END', 'CALL_START', 'CALL_END', 'PARAM_START', 'PARAM_END'];

  return SpaceOperators;

}).call(this);


},{}],50:[function(require,module,exports){
var SpacingAfterComma,
  indexOf = [].indexOf;

module.exports = SpacingAfterComma = (function() {
  class SpacingAfterComma {
    constructor() {
      this.inRegex = false;
    }

    lintToken(token, tokenApi) {
      var ignore_elision, type;
      [type] = token;
      if (type === 'REGEX_START') {
        this.inRegex = true;
        return;
      }
      if (type === 'REGEX_END') {
        this.inRegex = false;
        return;
      }
      ({ignore_elision} = tokenApi.config[this.rule.name]);
      if (ignore_elision && indexOf.call(tokenApi.peek(1), ',') >= 0) {
        return null;
      }
      if (!(token.spaced || token.newLine || this.isGenerated(token, tokenApi) || this.isRegexFlag(token, tokenApi))) {
        return {token};
      }
    }

    // Coffeescript does some code generation when using JSX syntax, and it adds
    // brackets & commas that are not marked as generated. The only way to check
    // these is to see if the comma has the same column number as the last token.
    isGenerated(token, tokenApi) {
      var offset, pos, prevPos, prevToken;
      if (token.generated) {
        return true;
      }
      offset = -1;
      prevToken = tokenApi.peek(offset);
      while (prevToken.generated) {
        offset -= 1;
        prevToken = tokenApi.peek(offset);
      }
      pos = token[2];
      prevPos = prevToken[2];
      if (pos.first_line === prevPos.first_line && pos.first_column === prevPos.first_column) {
        return true;
      }
      return false;
    }

    // When generating a regex (///${whatever}///i) CoffeeScript generates tokens
    // for RegEx(whatever, "i") but doesn't bother to mark that comma as
    // generated or spaced. Looking 3 tokens ahead skips the STRING and CALL_END
    isRegexFlag(token, tokenApi) {
      var maybeEnd;
      if (!this.inRegex) {
        return false;
      }
      maybeEnd = tokenApi.peek(3);
      return (maybeEnd != null ? maybeEnd[0] : void 0) === 'REGEX_END';
    }

  };

  SpacingAfterComma.prototype.rule = {
    name: 'spacing_after_comma',
    level: 'ignore',
    ignore_elision: false,
    message: 'a space is required after commas',
    description: `This rule checks to make sure you have a space after commas.
Consecutive commas are allowed when skipping array elements
if "ignore_elision" is true.
<pre><code>
# ignore_elision: true
[,, c,, e, f] = [1, 2, 3, 4, 5, 6]
</code></pre>`
  };

  SpacingAfterComma.prototype.tokens = [',', 'REGEX_START', 'REGEX_END'];

  return SpacingAfterComma;

}).call(this);


},{}],51:[function(require,module,exports){
var TransformMessesUpLineNumbers;

module.exports = TransformMessesUpLineNumbers = (function() {
  class TransformMessesUpLineNumbers {
    lintToken(token, tokenApi) {}

  };

  TransformMessesUpLineNumbers.prototype.rule = {
    name: 'transform_messes_up_line_numbers',
    level: 'warn',
    message: 'Transforming source messes up line numbers',
    description: `This rule detects when changes are made by transform function,
and warns that line numbers are probably incorrect.`
  };

  TransformMessesUpLineNumbers.prototype.tokens = [];

  return TransformMessesUpLineNumbers;

}).call(this);

// implemented before the tokens are created, using the entire source.


},{}]},{},[4])(4)
});
