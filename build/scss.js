const fs = require('fs');
const path = require('path');
const glob = require('glob');
const postcss = require('postcss');
const postcssScss = require('postcss-scss');
const promiseLimit = require('promise-limit');
const { srcDir, scssVendorDir, rootPath } = require('./path');
const postcssConfig = require('./postcss.config');
const mkdirp = require('mkdirp');

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

console.log(
    path.join(
        rootPath,
        `+(${path.relative(rootPath, srcDir)}|${path.relative(rootPath, scssVendorDir)})`,
        '**',
        '[^_]*.scss'
    )
);
glob(
    path.join(
        rootPath,
        `+(${path.relative(rootPath, scssVendorDir)}|${path.relative(rootPath, srcDir)})`,
        '**',
        '[^_]*.scss'
    ),
    (err, files) => {
        if (err) {
            throw err;
        }

        files.forEach(file => limit(() => buildScss(file)));
    }
);
