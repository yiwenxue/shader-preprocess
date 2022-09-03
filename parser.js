const grammar = require('./parse.js').grammar;
const semantics = require('./parse.js').semantics;
const printer = require('./parse.js').printer;
const matching = require('./parse.js').matching;
const matching2 = require('./parse.js').matching2;

const difflib = require('difflib');

const MATCHING_TRUE = 1;
const MATCHING_FALSE = 0;
const MATCHING_UNKNOWN = -1;

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
    { name: 'CC_LIGHT_TYPE', type: 'string', value: '', options: ['directional', 'spot', 'surface'] },
    { name: 'CC_USE_INSTANCING', type: 'bool', value: '', options: ['ON', 'OFF'] },
    { name: 'CC_USE_INSTANCE_SKINNING', type: 'bool', value: '', options: ['ON', 'OFF'] },
    { name: 'CC_USE_SHADOW', type: 'bool', value: '', options: ['ON', 'OFF'] },
    { name: 'CC_SHADOW_TYPE', type: 'string', value: '', options: ['planar', 'PCF', 'PCSS', 'CSM'] },
    { name: 'CC_SNOW_METHOD', type: 'string', value: '', options: ['PHYISCAL', 'FAKE'] },
];

function matchingCheck2(keywordSet, patterns) {
    const res = patterns.every(p => {
        return matching2(keywordSet, p.value);
    });
    return res;
}

function matchingCheck(keywordSet, patterns) {
    const res = patterns.every(p => {
        return matching(keywordSet, p.value) !== MATCHING_FALSE;
    });
    return res;
}

function enumVariants2(patterns, level, operator = (keywords) => { }) {
    if (level === keywords.length) {
        if (matchingCheck2(keywords, patterns)) {
            // do something
            operator(keywords);
        }
        return;
    }
    const keyword = keywords[level];
    for (let i = 0; i < keyword.options.length; i++) {
        keyword.value = keyword.options[i];
        enumVariants2(patterns, level + 1, operator);
    }
}

function enumVariants(patterns, keywords, level = 0, operator = (keywords) => { }) {
    if (level === keywords.length) {
        operator(keywords);
        return true;
    }

    const keyword = keywords[level];
    for (let i = 0; i < keyword.options.length; i++) {
        keyword.value = keyword.options[i];
        if (matchingCheck(keywords.slice(0, level + 1), patterns))
            enumVariants(patterns, keywords, level + 1, operator);
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
//     1. [done] check if the variant matches the pattern at every level to reduce the search space
//     2. [done] sort the order of keywords to optimize the searching space

function macroExtractor(pattern) {
    switch (pattern.type) {
        // case 'declare_exp':
        case 'define_exp':
        case 'define_exp_array':
            return [pattern.name];

        case 'define':
        case 'declare':
            return macroExtractor(pattern.name).concat(macroExtractor(pattern.value));

        case 'NOT':
            return macroExtractor(pattern.value);

        case 'AND':
        case 'OR':
            return macroExtractor(pattern.name).concat(macroExtractor(pattern.value));

        default:
            return [];
    }
}

function nestExtractor(pattern, declares = []) {
    switch (pattern.type) {
        case 'declare_exp':
            const p = declares.find(d => d.value.name.name === pattern.name);
            if (!p) {
                console.error(`FATAL: declare ${pattern.name} not found`);
            }
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
    const defines = patterns.filter(p => p.value.type === 'define' || p.value.name.name === '_');

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

const macros = defines.reduce((acc, p) => {
    return acc.concat(macroExtractor(p.value));
}, []);

const freq = {};

keywords.forEach(k => {
    const count = macros.filter(m => m === k.name).length;
    freq[k.name] = count;
});

console.log(`freq: `, freq);

// sort keywords
const res = keywords.sort((a, b) => {
    return freq[b.name] - freq[a.name];
});

console.log(`sorted keywords:`, res.map(k => k.name));

var output = '';

function keywordsPrinter(keywords) {
    const data = keywords.map(k => { return `    ${k.name} : ${k.value}`; });
    output = output + `{\n${data.join('\n')}\n}\n`;
};

enumVariants(defines, res, 0, keywordsPrinter);
var output1 = output.slice();
output = '';
enumVariants2(defines, 0, keywordsPrinter);
var output2 = output.slice();

if (output1 === output2) {
    console.log('output1 === output2');
} else {
    console.log('output1 !== output2');
    const diff = difflib.contextDiff(output1.split('\n'), output2.split('\n'));
    console.log(diff);
}

var startTime = performance.now()
for (let i = 0; i < 1000; i++) {
    enumVariants(defines, res, 0);
}
var endTime = performance.now()
console.log(`enumVariants time cost: ${endTime - startTime} ms`);

startTime = performance.now()
for (let i = 0; i < 1000; i++) {
    enumVariants2(defines, 0);
}
endTime = performance.now()
console.log(`enumVariants2 time cost: ${endTime - startTime} ms`);