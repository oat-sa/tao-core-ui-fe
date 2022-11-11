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

    function defineUserAgent(value, navigator = window.navigator) {
        const userAgent = {
            value,
            writable: false,
            configurable: true,
            enumerable: true
        };
        try {
            Object.defineProperty(window.navigator, 'userAgent', userAgent);
        } catch (e) {
            window.navigator = Object.create(navigator, { userAgent });
        }
    }

    return function userAgentMockFactory() {
        let backupUserAgent = null;
        let backupNavigator = null;

        return {
            setUserAgent(userAgent) {
                if (!backupUserAgent) {
                    backupNavigator = window.navigator;
                    backupUserAgent = window.navigator.userAgent;
                }
                if (window.navigator.userAgent !== userAgent) {
                    defineUserAgent(userAgent);
                }
            },
            restore() {
                if (backupUserAgent) {
                    defineUserAgent(backupUserAgent, backupNavigator);
                }
            }
        };
    };
});
