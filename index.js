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
        if (!"Welcome".includes(char)) { continue }

        let rawPath = glyph.properties.d;
        let pathStr = svgpath(rawPath)
            .scale(1, -1)
            .translate(0, glyph.properties['vert-adv-y'] / 4)
            .scale(10/advanceRatio)
            .rel()
            .toString();

        let path = svgpath(pathStr);

        let movesToUndo = [];
        for (let segment of path.segments) {
            if (segment[0] === 'M') { segment[0] = 'm'; }
            if (segment[0] === 'm') {
                movesToUndo.push([...segment]);
            }
        }
        while (movesToUndo.length > 0) {
            let move = movesToUndo.pop();
            move[1] = -move[1];
            move[2] = -move[2];
            path.segments.push(move);
        }
        path.segments.push(
            [ 'm', (glyph.properties['horiz-adv-x'] / advanceRatio) * 10, 0 ],
            // [ 'l', 10, 0 ]
        )

        // console.log(char);
        // console.log(glyph.properties);
        // console.log(util.inspect(path, false, null, true));
        console.log(path.round(6).toString());
    }


});
