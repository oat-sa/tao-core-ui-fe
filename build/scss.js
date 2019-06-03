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
const glob = require('glob');
const postcss = require('postcss');
const postcssScss = require('postcss-scss');
const promiseLimit = require('promise-limit');
const { srcDir, scssVendorDir, rootPath } = require('./path');
const postcssConfig = require('./postcss.config');
const { mkdirp, copy } = require('fs-extra');

const limit = promiseLimit(5);

/**
 * Build scss file with postcss and postcssScss plugin
 * @param {string} scssFile
 * @param {map: Boolean} options
 */
const buildScss = scssFile =>
    new Promise(resolve => {
        const outputFile = scssFile.replace(/([\/\.])scss(\/|$)/g, '$1css$2');

        fs.readFile(scssFile, 'utf8', (err, source) => {
            if (err) {
                throw new Error(`File not found: ${scssFile}`);
            }
            postcss(postcssConfig.plugins)
                .process(source, {
                    syntax: postcssScss,
                    from: scssFile,
                    to: outputFile,
                    map: { annotation: true }
                })
                .catch(err => {
                    console.error(err);
                    process.exit(-1);
                })
                .then(writeOutResult)
                .then(resolve);
        });
    });

/**
 * Write out compiled css and source map
 * @param {LazyResult} result
 */
const writeOutResult = result => {
    const outputFile = result.opts.to;
    mkdirp(path.dirname(outputFile), () => {
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
 * Build scss files to css files
 */
const scssDirectories = [scssVendorDir, srcDir];

glob(
    path.join(rootPath, `+(${scssDirectories.map(dir => path.relative(rootPath, dir)).join('|')})`, '**', '[^_]*.scss'),
    (err, files) => {
        if (err) {
            throw err;
        }

        files.forEach(file => limit(() => buildScss(file)));
    }
);

/**
 * Copy font files
 */

copy(path.join(scssVendorDir, 'font'), path.join(rootPath, 'css', 'font'));
