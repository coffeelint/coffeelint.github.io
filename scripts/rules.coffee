{ RULES: rules } = require '@coffeelint/cli'

rulesHTML = ''
ruleNames = Object.keys(rules).sort()
for ruleName in ruleNames
    rule = rules[ruleName]
    rule.name = ruleName
    rule.description = '[no description provided]' unless rule.description
    rulesHTML += """

        <tr>
        <td class="rule">#{rule.name}</td>
        <td class="description">
            #{rule.description}
            <p><em>default level: #{rule.level}</em></p>
        </td>
        </tr>
        """

module.exports = rulesHTML
