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

const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');
const { outputDir, srcDir, aliases } = require('./path');

/**
 * resolve aliases in module name like ui or core
 * @param {string} id
 */
const resolveAlias = id => {
    for (let alias in aliases) {
        if (aliases.hasOwnProperty(alias)) {
            let afterAlias;
            if (id.indexOf(alias) === 0 && (afterAlias = id.substring(alias.length))[0] === '/') {
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
const copyCss = cssFile => {
    const outputFile = path.resolve(outputDir, path.relative(srcDir, cssFile));

    fs.access(cssFile, fs.constants.F_OK, err => {
        if (err) {
            console.error(`${cssFile} was not found!`);
            return;
        }
        mkdirp(path.dirname(outputFile), () => {
            fs.copyFile(cssFile, outputFile, err => {
                if (err) {
                    throw err;
                }
            });
            const mapFile = `${cssFile}.map`;
            fs.access(mapFile, fs.constants.F_OK, err => {
                if (!err) {
                    fs.copyFile(mapFile, `${outputFile}.map`, err => {
                        if (err) {
                            throw err;
                        }
                    });
                }
            });
        });
    });
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
            return {
                id: `css!${source}`,
                external: true,
                moduleSideEffects: true
            };
        }
        return null; // other ids should be handled as usually
    }
});
