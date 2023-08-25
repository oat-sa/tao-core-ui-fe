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
 * Copyright (c) 2021 (original work) Open Assessment Technologies SA ;
 */
define(function () {
    'use strict';

    const stores = new Map();

    function storeFactory() {
        const store = new Map();
        return {
            getItem(key) {
                return Promise.resolve(store.get(key));
            },
            setItem(key, value) {
                return Promise.resolve(store.set(key, value));
            },
            removeItem(key) {
                return Promise.resolve(store.delete(key));
            },
            clear() {
                store.clear();
                return Promise.resolve();
            }
        };
    }

    function storeMock(key) {
        if (!stores.has(key)) {
            stores.set(key, storeFactory());
        }
        return Promise.resolve(stores.get(key));
    }

    storeMock.reset = () => stores.clear();

    return storeMock;
});
