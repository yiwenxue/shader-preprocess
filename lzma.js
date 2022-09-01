var my_lzma = require("lzma").LZMA;

var my_lzma = new my_lzma();

var bytes = my_lzma.compress("Hello World!", 1);

var str = my_lzma.decompress(bytes);

console.log(str);