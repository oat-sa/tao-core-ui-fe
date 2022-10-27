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
 * Copyright (c) 2015-2021 (original work) Open Assessment Technologies SA ;
 */
define([
    'jquery',
    'ui/mediaplayer',
    'tpl!test/mediaplayer/sandbox/tpl/sandbox',
    'tpl!test/mediaplayer/sandbox/tpl/button',
    'tpl!test/mediaplayer/sandbox/tpl/boolean',
    'tpl!test/mediaplayer/sandbox/tpl/number',
    'tpl!test/mediaplayer/sandbox/tpl/list',
    'tpl!test/mediaplayer/sandbox/tpl/text'
], function ($, mediaplayer, sandboxTpl, buttonTpl, booleanTpl, numberTpl, listTpl, textTpl) {
    'use strict';

    const samples = {
        audio: '../samples/audio.mp3',
        video: '../samples/video.mp4',
        youtube: '//www.youtube.com/watch?v=YJWSVUPSQqw'
    };

    const defaultConfig = {
        type: 'video',
        url: samples.video,
        volume: 80,
        startMuted: false,
        maxPlays: 0,
        replayTimeout: 0,
        stalledTimeout: 2000,
        canPause: true,
        canSeek: true,
        loop: false,
        autoStart: false,
        autoStartAt: 0,
        preview: true
    };

    const fieldsTpl = {
        button: buttonTpl,
        boolean: booleanTpl,
        number: numberTpl,
        list: listTpl,
        text: textTpl
    };

    const configEntries = [
        {
            name: 'type',
            type: 'list',
            values: ['audio', 'video', 'youtube'],
            value: defaultConfig.type,
            description: 'The type of media to play'
        },
        {
            name: 'preview',
            type: 'boolean',
            value: defaultConfig.preview,
            description: 'Enables the media preview (load media metadata)'
        },
        {
            name: 'canSeek',
            type: 'boolean',
            value: defaultConfig.canSeek,
            description: 'The player allows to reach an arbitrary position within the media using the duration bar'
        },
        {
            name: 'canPause',
            type: 'boolean',
            value: defaultConfig.canPause,
            description: 'The player can be paused'
        },
        {
            name: 'loop',
            type: 'boolean',
            value: defaultConfig.loop,
            description: 'The media will be played continuously'
        },
        {
            name: 'startMuted',
            type: 'boolean',
            value: defaultConfig.startMuted,
            description: 'The player should be initially muted'
        },
        {
            name: 'autoStart',
            type: 'boolean',
            value: defaultConfig.autoStart,
            description: 'The player starts as soon as it is displayed'
        },
        {
            name: 'autoStartAt',
            type: 'number',
            value: defaultConfig.autoStartAt,
            description: 'The time position at which the player should start'
        },
        {
            name: 'maxPlays',
            type: 'number',
            value: defaultConfig.maxPlays,
            description: 'Sets a few number of plays (0 = infinite)'
        },
        {
            name: 'reset',
            type: 'button',
            value: 'Reset'
        },
        {
            name: 'render',
            type: 'button',
            value: 'Render'
        },
        {
            name: 'destroy',
            type: 'button',
            value: 'Destroy'
        }
    ];

    return function sandboxFactory(selector) {
        const $container = $(selector);
        const $sandbox = $(sandboxTpl());
        const $controlBoard = $sandbox.find('.controlboard');
        const $configEdit = $sandbox.find('[name=config]');
        const $configEntries = $sandbox.find('.entries');
        const $source = $sandbox.find('[name=source]');
        const $player = $sandbox.find('.player');

        let config;
        let player;

        const showConfig = () => $configEdit.val(JSON.stringify(config, null, 2));
        const resetConfig = () => (config = { ...defaultConfig });
        const syncConfig = () => {
            Object.keys(config).forEach(name => {
                const value = config[name];
                const $input = $configEntries.find(`[name=${name}]`);
                if ($input.is('[type=checkbox]')) {
                    $input.get(0).checked = value;
                } else {
                    $input.val(value);
                }
            });
        };
        const destroyPlayer = () => {
            if (player) {
                player.destroy();
            }
            player = null;
        };
        const renderPlayer = () => {
            destroyPlayer();
            const playerConfig = {
                ...config,
                debug: true,
                renderTo: $player
            };
            player = mediaplayer(playerConfig);
        };
        const actions = {
            reset() {
                resetConfig();
                showConfig();
                syncConfig();
                renderPlayer();
            },
            render() {
                renderPlayer();
            },
            destroy() {
                destroyPlayer();
            },
            load() {
                const source = $source.val().trim();
                if (source) {
                    config.url = source;
                    showConfig();
                    renderPlayer();
                } else {
                    //eslint-disable-next-line no-alert
                    alert('You must supply a video URL!');
                }
            }
        };

        configEntries.forEach(entry => {
            const tpl = fieldsTpl[entry.type] || booleanTpl;
            const $entry = $(tpl(entry));
            if ('list' === entry.type) {
                $entry.find('select').val(entry.value);
            }
            $configEntries.append($entry);
        });

        $configEdit.on('change', () => {
            try {
                config = JSON.parse($configEdit.val());
            } catch (err) {
                //eslint-disable-next-line no-console
                console.error(err);
            }
        });
        $configEntries.on('change', 'input,select', e => {
            const input = e.target;
            const $input = $(e.target);
            const name = input.name;
            const type = input.type;
            let value;
            try {
                value = JSON.parse($input.val());
            } catch (err) {
                value = $input.val();
            }
            if ('checkbox' === type) {
                value = input.checked;
            }
            if ('type' === name) {
                config.url = samples[value];
            }
            config[name] = value;
            showConfig();
        });
        $controlBoard.on('click', 'input[type=button]', e => {
            const input = e.target;
            const name = input.name;
            const action = actions[name];
            if ('function' === typeof action) {
                action();
            }
        });

        $container.append($sandbox);

        resetConfig();
        showConfig();
        renderPlayer();
    };
});
