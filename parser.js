const grammar = require('./parse.js').grammar;
const semantics = require('./parse.js').semantics;
const printer = require('./parse.js').printer;
const matching = require('./parse.js').matching;

const macroRE = /#pragma\s+define-meta\s+(\w+)\s*(\w*)\s*\n/g;
const patternRE = /#pragma\s+define-pattern\s+(\w+)\s*(\w*)\s*requires\s+(\w+)\s*(\w*)\s*\n/g;
const patternExp = /#pragma define-pattern.+/g;

const { createCipheriv } = require('crypto');
const fs = require('fs');

const extractPattern = (source) => {
    defCap = patternRE.exec(source);
    let patterns = [];
    while (defCap) {
        const name = defCap[1];
        const value = defCap[2];
        const name2 = defCap[3];
        const value2 = defCap[4];
        patterns.push({name, value, name2, value2});
        defCap = patternRE.exec(source);
    }
    return patterns;
}

const extractMacros = (source) => {
    defCap = macroRE.exec(source);
    let macros = [];
    while (defCap) {
        const name = defCap[1];
        const value = defCap[2];
        const record = {name, value};
        macros.push(record);
        defCap = macroRE.exec(source);
    }
    return macros;
}

const extractPatternExp = (source) => {
    defCap = patternExp.exec(source);
    const patterns = [];
    while (defCap) {
        const record = defCap[0];
        patterns.push(record.replace(/^\s+|\s+$/g, ''));
        defCap = patternExp.exec(source);
    }
    return patterns;
}

const patternSets = (macros, patterns) => { 
    const sets = [];
    for (let i = 0; i < macros.length; i++) {
        if (!macros.find(m => m.name === macros[i].name)) {
            sets.push({name: macros[i].name, priority: 0, records: {}});
        }
    }
    for (let i = 0; i < patterns.length; i++) {
        if (!sets.find(s => s.name === patterns[i].name)) {
            sets.push({name: patterns[i].name, priority: 0, records: {}});
        }
        if (!sets.find(s => s.name === patterns[i].name2)) {
            sets.push({name: patterns[i].name2, priority: 1, records: {}});
        } else {
            sets.find(s => s.name === patterns[i].name2).priority ++;
        }
    }

    console.log(sets);
}

const patterns = [];

function loadShader (file) {
    const content = fs.readFileSync(file);
    // console.log({macros : extractMacros(content)});
    // console.log({patterns : extractPattern(content)});

    // patternSets(extractMacros(content), extractPattern(content));
    const patternEntry = extractPatternExp(content);

    const patternAst = patternEntry.map(e => {
        const match = grammar.match(e);
        // console.log(`matching ${match.succeeded()} : \"${e}\"\n`);
        if (match.succeeded()) {
            const ast = semantics(match).pattern();
            return ast;
        }
        return ;
    });

    // copy patterns from patternAst to patterns
    patternAst.forEach(p => {
        if (p) {
            patterns.push(p);
        }
    } );
}

const keywords = [
    {name: 'CC_USE_FOG', type: 'bool', value: '', options : ['ON', 'OFF']},
    {name: 'CC_FOG_TYPE', type: 'number', value: '', options : [0, 1, 2, 3]},
    {name: 'CC_USE_INSTANCING', type: 'bool', value: '', options : ['ON', 'OFF']},
    {name: 'CC_USE_INSTANCE_SKINNING', type: 'bool', value: '', options : ['ON', 'OFF']},
];

let declares = [];
let defines = [];

function matchingCheck (keywordSet, patterns) {
    const res = defines.every(p => {
        return matching (keywordSet, p.value);
    });
    return res;
}

let variant = [];
let count = 0;
function enumVariants (level) {
    if (level === keywords.length) {
        if (keywords[1].value !== 2)
        // if (!matchingCheck(keywords, patterns))
            console.log(count ++, matchingCheck(keywords, patterns), keywords);
        return;
    }
    const keyword = keywords[level];
    for (let i = 0; i < keyword.options.length; i++) {
        keyword.value = keyword.options[i];
        enumVariants(level + 1);
    }
}

// 0. [done] get patterns from source code
//     0. [done] load shader source code
//     1. [done] extract macros
//     2. [done] extract patterns

// 1. [done] preprocess the patterns
//     0. [done] turn declarations into nest expressions

// 2. [done] enumerate all possible variants of the patterns

// 3. match the variants against the patterns

function nestExtractor (pattern) {
    switch (pattern.type) {
        case 'declare_exp':
            const p = declares.find(d => d.value.name.name === pattern.name);
            const value = 
            pattern.name = p.value.value.name;
            pattern.type = p.value.value.type;
            pattern.value = p.value.value.value;
            break;

        case 'define':
        case 'declare':
        case 'NOT':
            nestExtractor(pattern.value);
            break;

        case 'AND':
        case 'OR':
            nestExtractor(pattern.name);
            nestExtractor(pattern.value);
            break;

        default:
            break;
    }
}

function preprocess (patterns) {
    declares = patterns.filter(p => p.value.type === 'declare');

    defines = patterns.filter(p => p.value.type === 'define');

    defines.forEach(p => {
        nestExtractor(p.value);
    });

    // console.log ("declares");
    // declares.forEach(d => {
    //     printer(d, 0);
    // });

    // console.log ("defines");
    defines.forEach(d => {
        printer(d, 0);
    });
}

loadShader('./test.glsl');

// console.log(patterns);

preprocess(patterns);

enumVariants(0);