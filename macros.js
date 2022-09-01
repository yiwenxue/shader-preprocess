const fs = require('fs');

const definesReg = /\"defines\":\s\[(\s|\n|,|\{.*\})+\]/gm;
const macroReg = /\{name:(\w+).*?\}/gm;

function extractDefine(str) {
    if (str.length <= 0) {
        return [];
    }

    const defines = [];
    let defineCap = definesReg.exec(str);
    while (defineCap) {
        const define = defineCap[0].replace(/\"/g, '').replace(/\s/g, '');
        defines.push(define);
        defineCap = definesReg.exec(str);
    }
    return defines;
}

const defines = extractDefine(fs.readFileSync('./builtin-effects.ts', 'utf8'));

function extractMacro(str) {
    if (str.length <= 0) {
        return [];
    }

    const macros = [];
    let macroCap = macroReg.exec(str);
    while (macroCap) {
        const macro = macroCap[1];
        macros.push(macro);
        macroCap = macroReg.exec(str);
    }
    return macros;
}

const macroList = [];

defines.forEach((define, index) => {
    const macros = extractMacro(define);
    // push to list if not exist
    macros.forEach(macro => {
        if (!macroList.includes(macro)) {
            macroList.push(macro);
        }
    });
});

console.log('length: ', macroList.length, '\n', macroList);

// save list to file
fs.writeFileSync('./macro-list.json', JSON.stringify(macroList));