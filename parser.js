const grammar = require('./parse.js').grammar;
const semantics = require('./parse.js').semantics;
const printer = require('./parse.js').printer;
const matching = require('./parse.js').matching;

const patternExp = /#pragma define-pattern.+/g;

const fs = require('fs');

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

function patternFromShader(file) {
    const content = fs.readFileSync(file);
    const patternEntry = extractPatternExp(content);

    return patternEntry.map(e => {
        const match = grammar.match(e);
        if (match.succeeded()) {
            const ast = semantics(match).pattern();
            return ast;
        }
        return;
    });
}

const keywords = [
    { name: 'CC_USE_FOG', type: 'bool', value: '', options: ['ON', 'OFF'] },
    { name: 'CC_FOG_TYPE', type: 'number', value: '', options: [0, 1, 2, 3] },
    { name: 'CC_USE_INSTANCING', type: 'bool', value: '', options: ['ON', 'OFF'] },
    { name: 'CC_USE_INSTANCE_SKINNING', type: 'bool', value: '', options: ['ON', 'OFF'] },
];

function matchingCheck(keywordSet, patterns) {
    const res = patterns.every(p => {
        return matching(keywordSet, p.value);
    });
    return res;
}

function enumVariants(patterns, level, operator = (keywords) => { console.log(keywords); }) {
    if (level === keywords.length) {
        if (matchingCheck(keywords, patterns)) {
            // do something
            operator(keywords);
        }
        return;
    }
    const keyword = keywords[level];
    for (let i = 0; i < keyword.options.length; i++) {
        keyword.value = keyword.options[i];
        enumVariants(patterns, level + 1, operator);
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
//     0. [done] match the variant against the pattern recursively at the end
//     1. check if the variant matches the pattern at every level to reduce the search space
//     2. sort the order of keywords to optimize the searching space

function nestExtractor(pattern, declares = []) {
    switch (pattern.type) {
        case 'declare_exp':
            const p = declares.find(d => d.value.name.name === pattern.name);
            pattern.name = p.value.value.name;
            pattern.type = p.value.value.type;
            pattern.value = p.value.value.value;
            break;

        case 'define':
        case 'declare':
        case 'NOT':
            nestExtractor(pattern.value, declares);
            break;

        case 'AND':
        case 'OR':
            nestExtractor(pattern.name, declares);
            nestExtractor(pattern.value, declares);
            break;

        default:
            break;
    }
}

function preprocess(patterns) {
    const declares = patterns.filter(p => p.value.type === 'declare');
    const defines = patterns.filter(p => p.value.type === 'define');

    defines.forEach(p => {
        nestExtractor(p.value, declares);
    });

    defines.forEach(d => {
        printer(d, 0);
    });

    return defines;
}

const patterns = patternFromShader('./test.glsl');

const defines = preprocess(patterns);

function keywordsPrinter(keywords) {
    const data = keywords.map(k => { return { name: k.name, value: k.value }; });
    console.log(data);
};

enumVariants(defines, 0, keywordsPrinter);
