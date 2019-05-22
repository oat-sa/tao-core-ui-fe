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
const path = require('path');
const sass = require('node-sass');
const { outputDir, srcDir, aliases } = require('./path');

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

const buildCss = cssFile => {
    const outputFile = path.resolve(outputDir, path.relative(srcDir, cssFile));
    fs.copyFile(cssFile, outputFile, err => {
        if (err) {
            throw err;
        }
    });
};

const buildScss = scssFile => {
    const outputFile = path.resolve(
        outputDir,
        path.relative(srcDir, scssFile.replace(/([\/\.])scss(\/|$)/g, '$1css$2'))
    );

    sass.render(
        {
            file: scssFile,
            includePaths: [path.resolve(srcDir, '..', 'scss')]
        },
        (err, result) => {
            if (err) {
                throw err;
            }
            fs.mkdir(path.dirname(outputFile), { recursive: true }, () => {
                fs.writeFile(outputFile, result.css, { flag: 'w' }, err => {
                    if (err) {
                        throw err;
                    }
                });
            });
        }
    );
};

export default () => ({
    name: 'css-resolve', // this name will show up in warnings and errors
    resolveId(source, importer) {
        if (/\.s?css$/.test(source) && importer) {
            const file = resolveAlias(source);
            if (path.extname(source) === '.scss') {
                buildScss(file);
            } else {
                buildCss(file);
            }
            return {
                id: `css!${source}`,
                external: true,
                moduleSideEffects: true
            };
        }
        return null; // other ids should be handled as usually
    }
});
