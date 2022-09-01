const ohm = require('ohm-js');

const grammarSource = String.raw`
Pattern {

    Exp = HeaderExp Pattern Comment*

	Pattern = DefineExp "requires" Expression -- Define
        | DeclareExp "requires" Expression -- Declare
    
    HeaderExp = "#pragma define-pattern"
    
    Expression
    	= Expression "AND" Expression -- AND
        | Expression "OR" Expression -- OR
		| "NOT" Expression -- NOT
		| PirExp --PirExp

	PirExp
    	= "(" Expression ")" -- Paren
		| DefineExp
		| DeclareExp

	DeclareExp = Key

	DefineExp 
        = Key ":" Option -- Define
        | Key ":" OptionArray -- DefineArray

    Option (an option)
    	= "TRUE"
        	| "FALSE"
            | "ON"
            | "OFF"
            | StringOption
            | NumberOption
            
    StringOption (a string option)
    	= "'" OptionLetter* "'"
            
	OptionArray (an option array)
    	= "[" "]" -- empty
        	|  "[" Options "]" -- nonempty
    
    Options = Option ("," Option)*
    
    Key (an identifier)
    	= MacroLetter*

    OptionLetter
        = "_" | letter

    MacroLetter
   		= "_" | upper
    
    NumberOption (a number option)
        = digit+

    Comment (a comment)
        = "//" ( ~lineTerminator any)*
           
    lineTerminator = "\n" | "\r" | "\u2028" | "\u2029"
}`;

// const mapping = {
//     Exp: {header : 0, Pattern: 1},
//     Pattern_Define: {name : 0, op: 1, value : 2},
//     Pattern_Declare: {name : 0, op: 1, value : 2},
//     Expression_AND: {exp1: 0, op: 1, exp2 : 2},
//     Expression_OR: {exp1: 0, op: 1, exp2 : 2},
//     Expression_NOT: {op: 0, exp2 : 1},
//     DefineExp_Define: {name: 0, op : 1, value : 2},
//     DefineExp_DefineArray : {name: 0, op: 1, values : 2},
// };

const grammar = ohm.grammar(grammarSource);

const semantics = grammar.createSemantics();

semantics.addOperation(
    'pattern',
    {
        _terminal() {
            return this.sourceString;
        },
        Exp(header, e, comment) {
            return {
                type: "Pattern",
                name: "Root",
                value: e.pattern(),
            };
        },
        Pattern_Define(def, op, exp) {
            return {
                type: "define",
                name: def.pattern(),
                value: exp.pattern(),
            };
        },
        Pattern_Declare(dec, op, exp) {
            return {
                type: "declare",
                name: dec.pattern(),
                value: exp.pattern(),
            };
        },
        Expression_AND(left, op, right) {
            return {
                type: 'AND',
                name: left.pattern(),
                value: right.pattern()
            };
        },
        Expression_OR(left, op, right) {
            return {
                type: 'OR',
                name: left.pattern(),
                value: right.pattern()
            };
        },
        Expression_NOT(_, expression) {
            return {
                type: 'NOT',
                name: null,
                value: expression.pattern()
            };
        },
        PirExp_Paren(_1, expression, _2) {
            return expression.pattern();
        },
        DefineExp_Define(key, _, option) {
            return {
                type: 'define_exp',
                name: key.pattern(),
                value: option.pattern()
            };
        },
        DefineExp_DefineArray(key, _, optionArray) {
            return {
                type: 'define_exp_array',
                name: key.pattern(),
                value: optionArray.children.map(option => option.pattern())
            };
        },
        DeclareExp(key) {
            return {
                type: 'declare_exp',
                name: key.pattern(),
                value: 'any',
            };
        },
        OptionArray_empty(_1, _2) {
            return {
                type: "Option_array",
                name: null,
                value: null,
            };
        },
        OptionArray_nonempty(_1, options, _2) {
            return {
                type: 'Option_array',
                name: null,
                value: options.pattern(),
            };
        },
        Options(option, _, options) {
            return {
                type: "Options",
                name: null,
                value: [option.pattern(), ...options.children.map(option => option.pattern())],
            };
        },
        Option(e) {
            return e.pattern();
        },
        Key(e) {
            return e.sourceString;
        },
        StringOption(_1, option, _2) {
            return option.sourceString;
        },
        NumberOption(e) {
            return parseInt(e.sourceString);
        }
    });

function printer(key, level) {
    if (!key.type) {
        if (key.name) {
            console.log(key.name);
        } else {
            console.log(key);
        }
        return;
    }
    const align = '+ ';
    switch (key.type) {
        case 'define_exp':
            console.log(`${align.repeat(level)}${key.name} : ${key.value}`); break;
        case 'define_exp_array':
            console.log(`${align.repeat(level)}${key.name} : [${key.value.map(v => v.value.value).join(', ')}]`); break;
        case 'declare_exp':
            console.log(`${align.repeat(level)}${key.name}`); break;
        case 'NOT':
            console.log(`${align.repeat(level)}NOT`);
            printer(key.value, level + 1);
            break;
        case 'define':
        case 'declare':
            console.log(`${align.repeat(level)}${key.type}`);
            printer(key.name, level + 1);
            console.log(`${align.repeat(level)}requires`);
            printer(key.value, level + 1);
            break;
        default:
            printer(key.name, level + 1);
            console.log(`${align.repeat(level)}${key.type}`);
            printer(key.value, level + 1);
            break;
    }
};

function satisfy(key, require) {
    if (require === 'any') {
        return true;
    }
    return require === key;
}

function satisfyArray(key, require) {
    const options = require.value.value;
    return options.some(v => v === key);
}

function matching(keySet, pattern) {
    switch (pattern.type) {
        case 'define_exp':
            return satisfy(keySet.find(e => e.name === pattern.name).value, pattern.value);

        case 'define_exp_array':
            return satisfyArray(keySet.find(e => e.name === pattern.name).value, pattern.value[0]);

        case 'declare_exp':
            console.error('declare exp should be trimmed out before matching');
            return false;

        case 'define':
            return matching(keySet, pattern.name) ?
                matching(keySet, pattern.value) :
                true;

        case 'declare':
            if (pattern.name.name === `_`)
                return matching(keySet, pattern.value);
            else break;

        case 'NOT':
            return !matching(keySet, pattern.value);

        case 'AND':
            return matching(keySet, pattern.name) && matching(keySet, pattern.value);

        case 'OR':
            return matching(keySet, pattern.name) || matching(keySet, pattern.value);

        default:
            return false;
    }
}

module.exports = {
    grammar,
    semantics,
    printer,
    matching,
};