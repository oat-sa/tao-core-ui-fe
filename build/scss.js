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

const { mkdirp, copy, writeFile, readFile, access, constants } = require('fs-extra');
const path = require('path');
const glob = require('glob');
const postcss = require('postcss');
const postcssScss = require('postcss-scss');
const promiseLimit = require('promise-limit');
const { srcDir, scssVendorDir, rootPath } = require('./path');
const postcssConfig = require('./postcss.config');

const limit = promiseLimit(5);

/**
 * Build scss file with postcss and postcssScss plugin
 * @param {string} scssFile
 * @param {map: Boolean} options
 */
const buildScss = async scssFile => {
    const outputFile = scssFile.replace(/([\/\.])scss(\/|$)/g, '$1css$2');

    // load file content
    let source;
    try {
        source = await readFile(scssFile, 'utf8');
    } catch (e) {
        throw new Error(`File not found: ${scssFile}`);
    }

    // compile scss
    let compiledSource;
    try {
        compiledSource = await postcss(postcssConfig.plugins).process(source, {
            syntax: postcssScss,
            from: scssFile,
            to: outputFile,
            map: { annotation: true }
        });
    } catch (e) {
        console.error(e);
        process.exit(-1);
    }

    // write out css
    return writeOutResult(compiledSource);
};

/**
 * Write out compiled css and source map
 * @param {LazyResult} result
 */
const writeOutResult = async result => {
    const outputFile = result.opts.to;
    const outputFileDir = path.dirname(outputFile);

    // create output directory if it doesn't exist
    try {
        await access(outputFileDir, constants.F_OK);
    } catch (e) {
        await mkdirp(outputFileDir);
    }

    // write out css
    await writeFile(outputFile, result.css, { flag: 'w' });

    // write out map if exist
    if (result.map) {
        await writeFile(`${outputFile}.map`, result.map, { flag: 'w' });
    }
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
