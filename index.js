const ttf2svg = require('ttf2svg');
const fs = require('fs');
const svgParser = require('svg-parser');
const util = require('util');
const svgpath = require('svgpath');

const processFontBuffer = (buffer) => {
    // Transform True Type Font into SVG
    // https://github.com/qdsang/ttf2svg
    const svgContent = ttf2svg(buffer);

    // fs.writeFileSync('./Barlow-Light.svg', svgContent);

    // Parse SVG string into HAST (Hypertext Abstract Syntax Tree format)
    // https://github.com/Rich-Harris/svg-parser
    const root = svgParser.parse(svgContent);

    // console.log(util.inspect(root, false, null, true));
    // fs.writeFileSync('./Barlow-Light.json', JSON.stringify(root));

    // Extract Glyphs and maximum advancement after glyph drawing for re-scaling
    let svg = root.children[0];
    let defs = svg.children[1];
    let barlowLightFont = defs.children[0];
    let advanceRatio = Math.max(
        // https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/horiz-adv-x
        barlowLightFont.properties['horiz-adv-x'],
        barlowLightFont.properties['vert-adv-y']
    );
    let glyphs = barlowLightFont.children.filter(elem => elem.tagName === "glyph");

    let formattedGlyphs = {};

    // Transform each Glyph path
    for (glyph of glyphs) {
        let char = String.fromCharCode(parseInt(glyph.properties.unicode.replace("&#x", ""),16))

        let rawPath = glyph.properties.d;
        let pathStr = svgpath(rawPath)
            .scale(1, -1)
            .translate(0, glyph.properties['vert-adv-y'] / 4)
            .scale(10/advanceRatio)
            .rel()
            .toString();

        // Transform to string and back because `svgpath` stacks operations like `.rel()`
        // and we want to manually insert svg moves to reset the relative position.
        let path = svgpath(pathStr);

        // Stack svg moves to reset them at the end of the path in reverse order (could be any order).
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

        // Add a final svg move by how much the font defines this glyph to "advance"
        path.segments.push(
            [ 'm', (glyph.properties['horiz-adv-x'] / advanceRatio) * 10, 0 ],
            // [ 'l', 10, 0 ]
        )

        let formattedPathSegments = path.round(6).segments;

        formattedGlyphs[char] = formattedPathSegments;

        // console.log(char);
        // console.log(glyph.properties);
        // console.log(util.inspect(path, false, null, true));
        // console.log(formattedPathString);
    }

    return formattedGlyphs;
}

// `moduleName` should be in PascalCase
const fontToElmModule = (moduleName, glyphsObject) => {
    let elmCode = `
module Svg.${moduleName} exposing (lettersDict)

import Dict exposing (Dict)
import Svg.Core exposing (PathSegment(..))


lettersDict : Dict Char (List PathSegment)
lettersDict =
    Dict.fromList`;

    let count = 0;

    for (let glyph in glyphsObject) {
        if (count === 0) {
            elmCode += `\n        [ ( '${glyph}'`;
        } else {
            elmCode += `\n        , ( '${glyph}'`;
        }
        count += 1;

        let segments = glyphsObject[glyph];

        for (let i = 0; i < segments.length; i++) {
            let seg = segments[i];

            elmCode += `\n        ${(i === 0 ? "  , [" : "    ,")} ${seg[0].toUpperCase()}`;

            if (seg[1] !== undefined) {
                elmCode += ` ( ${seg[1]}, ${seg[2]} )`
            }

            if (seg[3] !== undefined) {
                elmCode += ` ( ${seg[3]}, ${seg[4]} )`
            }
        }

        elmCode += "\n            ]";
        elmCode += "\n          )";
    }

    elmCode += "\n        ]";

    return elmCode;
}

fs.readFile('./Barlow/Barlow-Light.ttf', (err, buffer) => {
    if (!!err) throw err;

    let formattedGlyphs = processFontBuffer(buffer);
    let moduleName = "FontBarlowLight"
    let elmFileAsString = fontToElmModule(moduleName, formattedGlyphs);

    fs.writeFileSync(`${moduleName}.elm`, elmFileAsString);
});
