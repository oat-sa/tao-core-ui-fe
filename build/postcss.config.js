const path = require('path');
const { rootPath } = require('./path');

module.exports = {
    plugins: [
        require('@csstools/postcss-sass')({
            includePaths: [path.resolve(rootPath, 'scss')]
        }),
        require('autoprefixer')
    ]
};
