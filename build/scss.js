const fs = require('fs');
const path = require('path');
const glob = require('glob');
const postcss = require('postcss');
const postcssScss = require('postcss-scss');
const promiseLimit = require('promise-limit');
const { srcDir } = require('./path');
const postcssConfig = require('./postcss.config');

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

glob(path.join(srcDir, '**', '[^_]*.scss'), (err, files) => {
    if (err) {
        throw err;
    }

    files.forEach(file => limit(() => buildScss(file)));
});
