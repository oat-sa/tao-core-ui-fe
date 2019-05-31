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

import path from 'path';
import glob from 'glob';
import alias from 'rollup-plugin-alias';
import handlebarsPlugin from 'rollup-plugin-handlebars-plus';
import cssResolve from './css-resolve';
import externalAlias from './external-alias';
import resolve from 'rollup-plugin-node-resolve';

const Handlebars = require('@oat-sa/tao-core-libs/src/handlebars');

const originalVisitor = Handlebars.Visitor;
Handlebars.Visitor = function() {
    return originalVisitor.call(this);
};
Handlebars.Visitor.prototype = Object.create(originalVisitor.prototype);
Handlebars.Visitor.prototype.accept = function() {
    try {
        originalVisitor.prototype.accept.apply(this, arguments);
    } catch (e) {}
};

const { srcDir, outputDir, aliases } = require('./path');

const inputs = glob.sync(path.join(srcDir, '**', '*.js'));

const localExternals = inputs.map(input => `ui/${path.relative(srcDir, input).replace(/\.js$/, '')}`);

export default inputs.map(input => {
    const name = path.relative(srcDir, input).replace(/\.js$/, '');
    const dir = path.dirname(path.relative(srcDir, input));

    return {
        input,
        output: {
            dir: path.join(outputDir, dir),
            format: 'amd',
            name
        },
        external: [
            'i18n',
            'lodash',
            'jquery',
            'handlebars',
            'interact',
            'moment',
            'jquery.autocomplete',
            'jquery.fileDownload',
            'context',
            'nouislider',
            'async',
            'iframeNotifier',
            'select2',
            'module',
            'helpers',
            ...localExternals
        ],
        plugins: [
            cssResolve(),
            externalAlias(['core', 'lib', 'util', 'layout']),
            alias({
                resolve: ['.js', '.json', '.tpl'],
                ...aliases
            }),
            resolve(),
            // commonjs(),
            handlebarsPlugin({
                handlebars: {
                    id: 'handlebars',
                    options: {
                        sourceMap: false
                    },
                    module: Handlebars
                },
                helpers: ['build/tpl.js'],
                templateExtension: '.tpl'
            }),
            {
                name: 'mu',
                generateBundle(options, bundle) {
                    if (options.name.indexOf('datetime/picker') !== -1) {
                        bundle['picker.js'].code = bundle['picker.js'].code.replace(
                            /flatpickrLocalization\.hasOwnProperty\('default'\)/,
                            false
                        );
                    }
                }
            }
        ]
    };
});
