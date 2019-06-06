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

const HttpServer = require('http-server');
const fs = require('fs');
const path = require('path');

const HOST = process.env.HOST || '127.0.0.1';
const PORT = process.env.PORT || '8082';
const ROOT = path.resolve(__dirname, '..');

module.exports = new Promise(resolve =>
    new HttpServer.createServer({
        root: ROOT,
        cache: -1,
        before: [
            (req, res) => {
                if (req.method === 'POST') {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    fs.readFile(path.join(__dirname, '..', req.url), (err, data) => {
                        if (err) throw err;
                        res.end(data.toString());
                    });
                } else {
                    res.emit('next');
                }
            }
        ]
    }).listen(PORT, HOST, err => {
        if (err) {
            console.log(err);
            process.exit(-1);
        }

        console.log(`Server is listening on http://${HOST}:${PORT}/ and serving ${ROOT}`);

        resolve({ host: HOST, port: PORT });
    })
);
