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
define(['core/eventifier', 'test/mediaplayer/mocks/playerMock'], function (eventifier, playerMockFactory) {
    'use strict';

    const reYoutube = /([?&\/]v[=\/])([\w-]+)([&\/]?)/;
    const extractYoutubeId = url => {
        const res = reYoutube.exec(url);
        return (res && res[2]) || url;
    };

    function youtubeMockFactory($container, config = {}) {
        const player = playerMockFactory($container, config);

        let initWidth;
        let initHeight;

        return eventifier({
            ...player,
            init() {
                this.on('ready', () => {
                    if (initWidth && initHeight) {
                        this.setSize(initWidth, initHeight);
                    }
                });
                return player.init.call(this);
            },
            setSize(width, height) {
                player.setSize.call(this, width, height);

                if (!this.getMedia()) {
                    initWidth = width;
                    initHeight = height;
                }
            },
            addMedia(src, type) {
                return player.addMedia.call(this, src, type, extractYoutubeId(src));
            }
        });
    }

    return youtubeMockFactory;
});
