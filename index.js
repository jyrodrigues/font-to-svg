const ttf2svg = require('ttf2svg');
const fs = require('fs');

fs.readFile('./Barlow/Barlow-Light.ttf', function (err, buffer) {
    if (!!err) throw err;

    const svgContent = ttf2svg(buffer);
    fs.writeFileSync('./Barlow-Light.svg', svgContent);
});
