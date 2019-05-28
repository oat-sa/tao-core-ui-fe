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

const glob = require('glob');
const path = require('path');
const { runQunitPuppeteer, printResultSummary, printFailedTests } = require('node-qunit-puppeteer');
const promiseLimit = require('promise-limit');

const webServer = require('./webserver');

const { testDir } = require('./path');

const TESTNAME = process.argv[2] || '*';

let hasFailed = false;
const limit = promiseLimit(5);

webServer.then(({ host, port }) =>
    Promise.all(
        glob.sync(path.join(testDir, '**', TESTNAME, '**', 'test.html')).map(testFile => {
            const test = path.relative(testDir, testFile);
            const qunitArgs = {
                // Path to qunit tests suite
                targetUrl: `http://${host}:${port}/test/${test}`,
                // (optional, 30000 by default) global timeout for the tests suite
                timeout: 30000,
                // (optional, false by default) should the browser console be redirected or not
                redirectConsole: false
            };

            return limit(() =>
                runQunitPuppeteer(qunitArgs)
                    .then(result => {
                        if (TESTNAME === '*') {
                            process.stdout.write('.');
                        } else {
                            process.stdout.write(`${testFile} `);
                            printResultSummary(result, console);
                            console.log();
                        }

                        if (result.stats.failed > 0) {
                            console.log(`\n${testFile}`);
                            printFailedTests(result, console);
                            hasFailed = true;
                        }
                    })
                    .catch(ex => {
                        console.error(testFile);
                        console.error(ex);
                    })
            );
        })
    ).then(() => {
        console.log();
        process.exit(hasFailed ? -1 : 0);
    })
);
