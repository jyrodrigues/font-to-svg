const ttf2svg = require('ttf2svg');
const fs = require('fs');
const svgParser = require('svg-parser');
const util = require('util');
const svgpath = require('svgpath');

fs.readFile('./Barlow/Barlow-Light.ttf', function (err, buffer) {
    if (!!err) throw err;

    const svgContent = ttf2svg(buffer);
    // fs.writeFileSync('./Barlow-Light.svg', svgContent);
    const root = svgParser.parse(svgContent);
    // console.log(util.inspect(parsed, false, null, true));

    // fs.writeFileSync('./Barlow-Light.json', JSON.stringify(parsed));

    let svg = root.children[0];
    let defs = svg.children[1];
    let barlowLightFont = defs.children[0];
    let advanceRatio = Math.max(
        // https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/horiz-adv-x
        barlowLightFont.properties['horiz-adv-x'],
        barlowLightFont.properties['vert-adv-y']
    );
    let glyphs = barlowLightFont.children.filter(elem => elem.tagName === "glyph");

    for (glyph of glyphs) {
        let char = String.fromCharCode(parseInt(glyph.properties.unicode.replace("&#x", ""),16))
        if (char != "A") { continue }
        let path = glyph.properties.d;
        let transformed = svgpath(path)
            .scale(10/advanceRatio)
            .scale(1, -1)
            .rel()
            .round(6)
            .toString();
        console.log(transformed);
        // break;
    }

    // let i = 0;
    // for (let c of parsed.children[0].children) {
    //     console.log(util.inspect(c, false, null, true));
    //     i++;
    //     if (i > 10 ) { break; }
    // }
});
