/**
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; under version 2
 * of the License (non-upgradable).
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 *
 * Copyright (c) 2019 (original work) Open Assessment Technologies SA ;
 */

const { mkdirp, copyFile, access, constants } = require('fs-extra');
const path = require('path');
const { outputDir, srcDir, aliases } = require('./path');

/**
 * resolve aliases in module name like ui or core
 * @param {string} id - module id
 * @returns {string} id with resolved alias
 */
const resolveAlias = id => {
    for (let alias in aliases) {
        if (aliases.hasOwnProperty(alias)) {
            let afterAlias;
            if (id.startsWith(alias) && (afterAlias = id.substring(alias.length))[0] === '/') {
                return `${aliases[alias]}${afterAlias}`;
            }
        }
    }
    return id;
};

/**
 * Copy CSS file and optionally the source map to output directory
 * @param {string} cssFile
 */
const copyCss = async cssFile => {
    const outputFile = path.resolve(outputDir, path.relative(srcDir, cssFile));

    // check css file existance
    try {
        await access(cssFile, constants.F_OK);
    } catch (err) {
        console.error('\x1b[33m%s\x1b[0m', `${cssFile} was not found!`); // it is yellow
        return;
    }

    // create output directory if it is not exists
    const outputFileDir = path.dirname(outputFile);
    try {
        await access(outputFileDir, constants.F_OK);
    } catch (err) {
        await mkdirp(outputFileDir);
    }

    // copy css file
    await copyFile(cssFile, outputFile);

    // copy map file if it exists
    const mapFile = `${cssFile}.map`;
    try {
        await access(mapFile, constants.F_OK);
        await copyFile(mapFile, `${outputFile}.map`)``;
    } catch (e) {}
};

/**
 * Css resolve plugin
 */
export default () => ({
    name: 'css-resolve', // this name will show up in warnings and errors
    resolveId(source, importer) {
        if (/\.css$/.test(source) && importer) {
            const file = resolveAlias(source);
            copyCss(file);
            this.addWatchFile(file);
            return {
                id: `css!${source}`,
                external: true,
                moduleSideEffects: true
            };
        }
        return null; // other ids should be handled as usually
    },
    watchChange(source) {
        copyCss(source);
    }
});
