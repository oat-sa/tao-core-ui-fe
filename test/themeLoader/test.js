define(['lodash', 'jquery', 'ui/themeLoader'], function (_, $, themeLoader) {
    'use strict';

    const getStyleSheets = () => $('link[data-type^="custom-theme"]');

    const config = {
        base: 'base.css',
        default: 'blue',
        available: [
            {
                id: 'blue',
                path: 'blue.css',
                name: 'Blue'
            },
            {
                id: 'green',
                path: 'green.css',
                name: 'Green'
            }
        ]
    };

    const pink = 'rgb(255, 192, 203)';
    const blue = 'rgb(0, 0, 255)';
    const green = 'rgb(0, 128, 0)';
    const red = 'rgb(255, 0, 0)';

    let eventTriggered = '';

    $(document)
        .off('themechange.themeloader')
        .on('themechange.themeloader', (e, data) => eventTriggered = data);

    QUnit.module('Theme Loader API');

    QUnit.test('module', assert => {
        assert.expect(2);
        assert.ok(typeof themeLoader !== 'undefined', 'The module exports something');
        assert.ok(typeof themeLoader === 'function', 'The module exports a function');
    });

    QUnit.test('config format', assert => {
        assert.expect(4);

        assert.throws(
            () => themeLoader(),
            TypeError,
            'A config parameter is required'
        );

        assert.throws(
            () => themeLoader({}),
            TypeError,
            'A config parameter with a base property is required'
        );

        assert.throws(
            () => themeLoader({ base: '' }),
            TypeError,
            'A config parameter with available themes property is required'
        );

        assert.throws(
            () => themeLoader({
                base: '',
                available: [{}]
            }),
            TypeError,
            'Themes should contain path and id'
        );

        //Does not fail
        themeLoader(config);
    });

    QUnit.test('loader api', assert => {
        const loader = themeLoader(config);

        assert.expect(4);

        assert.ok(typeof loader === 'object', 'The theme loader returns an object');
        assert.ok(typeof loader.load === 'function', 'The loader exposes a method load');
        assert.ok(typeof loader.unload === 'function', 'The loader exposes a method unload');
        assert.ok(typeof loader.change === 'function', 'The loader exposes a method change');
    });

    QUnit.module('Theme loading', {
        afterEach() {
            getStyleSheets().remove();
        }
    });

    QUnit.test('load', assert => {
        const ready = assert.async();
        const loader = themeLoader(config);
        const $container = $('#qti-item');

        assert.expect(6);

        assert.equal($container.length, 1, 'The container exists');

        loader.load();
        setTimeout(() => {
            const $styleSheets = getStyleSheets();
            assert.ok($styleSheets.length > 0, 'The styleSheets have been inserted');
            assert.equal($styleSheets.length, 3, 'All styleSheets have been inserted');

            assert.equal($container.css('background-color'), pink, 'The base style is loaded and computed');
            assert.equal($container.css('color'), blue, 'The theme style is loaded and computed');

            setTimeout(() => {
                assert.equal(
                    eventTriggered,
                    loader.getActiveTheme(),
                    'The themechange event has been triggered along with the correct parameters'
                );
                ready();
            }, 250);
        }, 50);
    });

    QUnit.test('preload', assert => {
        const ready = assert.async();
        const preloadConfig = _.cloneDeep(config);
        const $container = $('#qti-item');

        preloadConfig.available.push({
            id: 'red',
            path: 'red.css',
            name: 'Red'
        });
        const loader = themeLoader(preloadConfig);

        assert.expect(7);

        getStyleSheets().remove();
        assert.equal(getStyleSheets().length, 0, 'All styleSheets have been removed');
        assert.equal($container.length, 1, 'The container exists');

        loader.load(true);
        setTimeout(() => {
            const $styleSheets = getStyleSheets();
            assert.equal($styleSheets.length, 4, 'All styleSheets have been inserted');
            $styleSheets.each(function () {
                assert.equal(this.getAttribute('disabled'), 'disabled', 'The loaded styleSheet is disabled');
            });

            ready();
        }, 50);
    });

    QUnit.test('unload', assert => {
        const ready = assert.async();
        const loader = themeLoader(config);
        const $container = $('#qti-item');

        assert.expect(11);

        assert.equal($container.length, 1, 'The container exists');

        loader.load();
        setTimeout(() => {
            const $styleSheets = getStyleSheets();
            assert.ok($styleSheets.length > 0, 'The styleSheets have been inserted');
            assert.equal($styleSheets.length, 3, 'All styleSheets have been inserted');
            assert.equal($container.css('background-color'), pink, 'The base style is loaded and computed');
            assert.equal($container.css('color'), blue, 'The theme style is loaded and computed');

            loader.unload();

            setTimeout(() => {
                assert.equal(getStyleSheets().length, 3, 'The stylesheets are still there');
                assert.ok($('link[data-id="base"]').prop('disabled'), 'The base stylesheet is disabled');
                assert.ok($('link[data-id="green"]').prop('disabled'), 'The green stylesheet is disabled');
                assert.ok($('link[data-id="blue"]').prop('disabled'), 'The blue stylesheet is disabled');

                assert.notEqual($container.css('background-color'), pink, 'The base style is  unloaded');
                assert.notEqual($container.css('color'), blue, 'The theme style is unloaded');

                ready();
            }, 10);
        }, 50);
    });

    QUnit.test('change', assert => {
        const ready = assert.async();
        const loader = themeLoader(config);
        const $container = $('#qti-item');

        assert.expect(9);

        assert.equal($container.length, 1, 'The container exists');

        loader.load();
        setTimeout(() => {
            const $styleSheets = getStyleSheets();
            assert.ok($styleSheets.length > 0, 'The styleSheets have been inserted');
            assert.equal($styleSheets.length, 3, 'All styleSheets have been inserted');

            assert.equal($container.css('background-color'), pink, 'The base style is loaded and computed');
            assert.equal($container.css('color'), blue, 'The theme style is loaded and computed');

            loader.change('green');

            setTimeout(() => {
                assert.equal($container.css('background-color'), pink, 'The base style is still loaded');
                assert.equal($container.css('color'), green, 'The new theme style is loaded and computed');
                assert.equal(loader.getActiveTheme(), 'green', 'The new theme became the active theme');

                setTimeout(() => {
                    assert.equal(
                        eventTriggered,
                        loader.getActiveTheme(),
                        'The themechange event has been triggered along with the correct parameters'
                    );
                    ready();
                }, 250);
            }, 50);
        }, 50);
    });

    QUnit.test('change back to default', assert => {
        const ready = assert.async();
        const loader = themeLoader(config);
        const $container = $('#qti-item');

        assert.expect(11);

        assert.equal($container.length, 1, 'The container exists');

        loader.load();
        setTimeout(() => {
            const $styleSheets = getStyleSheets();
            assert.ok($styleSheets.length > 0, 'The styleSheets have been inserted');
            assert.equal($styleSheets.length, 3, 'All styleSheets have been inserted');

            assert.equal($container.css('background-color'), pink, 'The base style is loaded and computed');
            assert.equal($container.css('color'), blue, 'The theme style is loaded and computed');

            loader.change('green');

            setTimeout(() => {
                assert.equal($container.css('background-color'), pink, 'The base style is still loaded');
                assert.equal($container.css('color'), green, 'The new theme style is loaded and computed');

                loader.change('default');

                setTimeout(() => {
                    assert.equal($container.css('background-color'), pink, 'The base style is loaded and computed');
                    assert.equal($container.css('color'), blue, 'The default theme style is loaded');
                    assert.equal(loader.getActiveTheme(), 'blue', 'The active theme has been reset to default');

                    setTimeout(() => {
                        assert.equal(
                            eventTriggered,
                            loader.getActiveTheme(),
                            'The themechange event has been triggered along with the correct parameters'
                        );
                        ready();
                    }, 250);
                }, 100);
            }, 100);
        }, 100);
    });

    QUnit.test('reload and change', assert => {
        const ready = assert.async();
        const loader = themeLoader(config);
        const $container = $('#qti-item');

        assert.expect(16);

        assert.equal($container.length, 1, 'The container exists');

        loader.load();
        setTimeout(() => {
            const $styleSheets = getStyleSheets();
            assert.ok($styleSheets.length > 0, 'The styleSheets have been inserted');
            assert.equal($styleSheets.length, 3, 'All styleSheets have been inserted');

            assert.equal($container.css('background-color'), pink, 'The base style is loaded and computed');
            assert.equal($container.css('color'), blue, 'The theme style is loaded and computed');

            loader.unload();

            setTimeout(() => {
                assert.equal(getStyleSheets().length, 3, 'The stylesheets are stil there');
                assert.ok($('link[data-id="base"]').prop('disabled'), 'The base stylesheet is disabled');
                assert.ok($('link[data-id="blue"]').prop('disabled'), 'The blue stylesheet is disabled');
                assert.ok($('link[data-id="green"]').prop('disabled'), 'The green stylesheet is disabled');

                const loader2 = themeLoader(config);
                loader2.load();

                setTimeout(() => {
                    assert.ok(!$('link[data-id="base"]').prop('disabled'), 'The base stylesheet is now enabled');
                    assert.ok(!$('link[data-id="blue"]').prop('disabled'), 'The blue stylesheet is now enabled');
                    assert.ok($('link[data-id="green"]').prop('disabled'), 'The green stylesheet is disabled');

                    loader2.change('green');

                    setTimeout(() => {
                        assert.equal($container.css('background-color'), pink, 'The base style is still loaded');
                        assert.equal($container.css('color'), green, 'The new theme style is loaded and computed');
                        assert.equal(loader2.getActiveTheme(), 'green', 'The new theme became the active theme');

                        setTimeout(() => {
                            assert.equal(
                                eventTriggered,
                                loader2.getActiveTheme(),
                                'The themechange event has been triggered along with the correct parameters'
                            );
                            ready();
                        }, 250);
                    }, 50);
                }, 50);
            }, 50);
        }, 50);
    });
});
