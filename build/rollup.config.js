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
import alias from '@rollup/plugin-alias';
import clear from 'rollup-plugin-clear';
import handlebarsPlugin from 'rollup-plugin-handlebars-plus';
import cssResolve from './css-resolve';
import resolve from '@rollup/plugin-node-resolve';
import istanbul from 'rollup-plugin-istanbul';
import babel from '@rollup/plugin-babel';
import wildcardExternal from '@oat-sa/rollup-plugin-wildcard-external';

const { srcDir, outputDir, aliases } = require('./path');
const Handlebars = require('handlebars');

const production = process.env.NODE_ENV === 'production';

const inputs = glob.sync(path.join(srcDir, '**', '*.js'));

/**
 * Define all modules as external, so rollup won't bundle them together.
 */
const localExternals = inputs.map(
    input => `ui/${path
            .relative(srcDir, input)
            .replace(/\\/g, '/')
            .replace(/\.js$/, '')}`
);

export default inputs.map(input => {
    const name = path.relative(srcDir, input).replace(/\.js$/, '');
    const dir = path.dirname(path.relative(srcDir, input));

    return {
        input,
        output: {
            dir: path.join(outputDir, dir),
            format: 'amd',
            sourcemap: !production,
            name
        },
        watch: {
            clearScreen : false
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
            'ckeditor',
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
            clear({
                targets: [outputDir],
                watch: false
            }),
            cssResolve(),
            wildcardExternal(['core/**', 'lib/**', 'util/**', 'layout/**']),
            resolve({
                extensions: ['.js', '.json', '.tpl']
            }),
            alias({
                entries : Object.assign({
                    resolve: ['.js', '.json', '.tpl']
                }, aliases)
            }),
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
            ...(process.env.COVERAGE ? [istanbul({
                exclude: 'build/tpl.js'
            })] : []),
            babel({
                presets: [
                    [
                        '@babel/env',
                        {
                            useBuiltIns: false
                        }
                    ]
                ],
                babelHelpers: 'bundled'
            })
        ]
    };
});
