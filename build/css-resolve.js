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
const { outputDir, srcDir, aliases } = require('./path');
const postcss = require('postcss');
const postcssScss = require('postcss-scss');
const postcssConfig = require('./postcss.config');

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
 * Build css file with postcss
 * @param {string} cssFile
 * @param {map: Boolean} options
 */
const buildCss = (cssFile, options) => {
    const outputFile = path.resolve(outputDir, path.relative(srcDir, cssFile));
    fs.readFile(cssFile, 'utf8', (err, source) => {
        if (err) {
            throw new Error(`File not found: ${cssFile}`);
        }
        postcss(postcssConfig.plugins)
            .process(source, {
                from: cssFile,
                to: outputFile,
                map: options.map ? { annotation: true } : false
            })
            .then(writeOutResult);
    });
};

/**
 * Build scss file with postcss and postcssScss plugin
 * @param {string} scssFile
 * @param {map: Boolean} options
 */
const buildScss = (scssFile, options) => {
    const outputFile = path.resolve(
        outputDir,
        path.relative(srcDir, scssFile.replace(/([\/\.])scss(\/|$)/g, '$1css$2'))
    );

    fs.readFile(scssFile, 'utf8', (err, source) => {
        if (err) {
            throw new Error(`File not found: ${scssFile}`);
        }
        postcss(postcssConfig.plugins)
            .process(source, {
                syntax: postcssScss,
                from: scssFile,
                to: outputFile,
                map: options.map ? { annotation: true } : false
            })
            .then(writeOutResult);
    });
};

/**
 * Write out compiled css and source map
 * @param {LazyResult} result
 */
const writeOutResult = result => {
    const outputFile = result.opts.to;
    fs.mkdir(path.dirname(outputFile), { recursive: true }, () => {
        fs.writeFile(outputFile, result.css, { flag: 'w' }, err => {
            if (err) {
                throw err;
            }
        });

        if (result.map) {
            fs.writeFile(`${outputFile}.map`, result.map, { flag: 'w' }, err => {
                if (err) {
                    throw err;
                }
            });
        }
    });
};

/**
 * Css resolve plugin
 */
export default ({ map } = { map: false }) => ({
    name: 'css-resolve', // this name will show up in warnings and errors
    resolveId(source, importer) {
        if (/\.s?css$/.test(source) && importer) {
            const file = resolveAlias(source);
            if (path.extname(source) === '.scss') {
                buildScss(file, { map });
            } else {
                buildCss(file, { map });
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
