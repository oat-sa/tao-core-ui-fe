define(['lodash', 'jquery', 'ui/themeLoader'], function(_, $, themeLoader) {
    'use strict';

    var config = {
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

    var pink = 'rgb(255, 192, 203)';
    var blue = 'rgb(0, 0, 255)';
    var green = 'rgb(0, 128, 0)';
    var red = 'rgb(255, 0, 0)';

    var eventTriggered = '';

    $(document)
        .off('themechange.themeloader')
        .on('themechange.themeloader', function(e, data) {
            eventTriggered = data;
        });

    QUnit.module('Theme Loader API');

    QUnit.test('module', function(assert) {
        assert.expect(2);
        assert.ok(typeof themeLoader !== 'undefined', 'The module exports something');
        assert.ok(typeof themeLoader === 'function', 'The module exports a function');
    });

    QUnit.test('config format', function(assert) {
        assert.expect(4);

        assert.throws(
            function() {
                themeLoader();
            },
            TypeError,
            'A config parameter is required'
        );

        assert.throws(
            function() {
                themeLoader({});
            },
            TypeError,
            'A config parameter with a base property is required'
        );

        assert.throws(
            function() {
                themeLoader({
                    base: ''
                });
            },
            TypeError,
            'A config parameter with available themes property is required'
        );

        assert.throws(
            function() {
                themeLoader({
                    base: '',
                    available: [{}]
                });
            },
            TypeError,
            'Themes should contain path and id'
        );

        //Does not fail
        themeLoader(config);
    });

    QUnit.test('loader api', function(assert) {
        var loader = themeLoader(config);

        assert.expect(4);

        assert.ok(typeof loader === 'object', 'The theme loader returns an object');
        assert.ok(typeof loader.load === 'function', 'The loader exposes a method load');
        assert.ok(typeof loader.unload === 'function', 'The loader exposes a method unload');
        assert.ok(typeof loader.change === 'function', 'The loader exposes a method change');
    });

    QUnit.module('Theme loading', {
        afterEach: function(assert) {
            $('head')
                .find('link[data-type^="custom-theme"]')
                .remove();
        }
    });

    QUnit.test('load', function(assert) {
        var ready = assert.async();
        var loader = themeLoader(config);
        var $container = $('#qti-item');

        assert.expect(6);

        assert.equal($container.length, 1, 'The container exists');

        loader.load();
        setTimeout(function() {
            var $styleSheets = $('link[data-type^="custom-theme"]');
            assert.ok($styleSheets.length > 0, 'The styleSheets have been inserted');
            assert.equal($styleSheets.length, 3, 'All styleSheets have been inserted');

            assert.equal($container.css('background-color'), pink, 'The base style is loaded and computed');
            assert.equal($container.css('color'), blue, 'The theme style is loaded and computed');

            setTimeout(function() {
                assert.equal(
                    eventTriggered,
                    loader.getActiveTheme(),
                    'The themechange event has been triggered along with the correct parameters'
                );
                ready();
            }, 250);
        }, 50);
    });

    QUnit.test('preload', function(assert) {
        var ready = assert.async();
        var preloadConfig = _.cloneDeep(config);
        var $styleSheets = $('link[data-type^="custom-theme"]');
        var $container = $('#qti-item');
        var loader;

        preloadConfig.available.push({
            id: 'red',
            path: 'red.css',
            name: 'Red'
        });
        loader = themeLoader(preloadConfig);

        assert.expect(7);

        $styleSheets.remove();
        $styleSheets = $('link[data-type^="custom-theme"]');
        assert.equal($styleSheets.length, 0, 'All styleSheets have been removed');
        assert.equal($container.length, 1, 'The container exists');

        loader.load(true);
        setTimeout(function() {
            $styleSheets = $('link[data-type^="custom-theme"]');
            assert.equal($styleSheets.length, 4, 'All styleSheets have been inserted');
            $styleSheets.each(function() {
                assert.equal(this.getAttribute('disabled'), 'disabled', 'The loaded styleSheet is disabled');
            });

            ready();
        }, 50);
    });

    QUnit.test('unload', function(assert) {
        var ready = assert.async();
        var loader = themeLoader(config);
        var $container = $('#qti-item');

        assert.expect(11);

        assert.equal($container.length, 1, 'The container exists');

        loader.load();
        setTimeout(function() {
            var $styleSheets = $('link[data-type^="custom-theme"]');
            assert.ok($styleSheets.length > 0, 'The styleSheets have been inserted');
            assert.equal($styleSheets.length, 3, 'All styleSheets have been inserted');

            assert.equal($container.css('background-color'), pink, 'The base style is loaded and computed');
            assert.equal($container.css('color'), blue, 'The theme style is loaded and computed');

            loader.unload();

            setTimeout(function() {
                assert.equal($('link[data-type^="custom-theme"]').length, 3, 'The stylesheets are still there');
                assert.ok($('link[data-id="base"]').prop('disabled'), 'The base stylesheet is disabled');
                assert.ok($('link[data-id="green"]').prop('disabled'), 'The green stylesheet is disabled');
                assert.ok($('link[data-id="blue"]').prop('disabled'), 'The blue stylesheet is disabled');

                assert.notEqual($container.css('background-color'), pink, 'The base style is  unloaded');
                assert.notEqual($container.css('color'), blue, 'The theme style is unloaded');

                ready();
            }, 10);
        }, 50);
    });

    QUnit.test('change', function(assert) {
        var ready = assert.async();
        var loader = themeLoader(config);
        var $container = $('#qti-item');

        assert.expect(9);

        assert.equal($container.length, 1, 'The container exists');

        loader.load();
        setTimeout(function() {
            var $styleSheets = $('link[data-type^="custom-theme"]');
            assert.ok($styleSheets.length > 0, 'The styleSheets have been inserted');
            assert.equal($styleSheets.length, 3, 'All styleSheets have been inserted');

            assert.equal($container.css('background-color'), pink, 'The base style is loaded and computed');
            assert.equal($container.css('color'), blue, 'The theme style is loaded and computed');

            loader.change('green');

            setTimeout(function() {
                assert.equal($container.css('background-color'), pink, 'The base style is still loaded');
                assert.equal($container.css('color'), green, 'The new theme style is loaded and computed');
                assert.equal(loader.getActiveTheme(), 'green', 'The new theme became the active theme');

                setTimeout(function() {
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

    QUnit.test('change back to default', function(assert) {
        var ready = assert.async();
        var loader = themeLoader(config);
        var $container = $('#qti-item');

        assert.expect(11);

        assert.equal($container.length, 1, 'The container exists');

        loader.load();
        setTimeout(function() {
            var $styleSheets = $('link[data-type^="custom-theme"]');
            assert.ok($styleSheets.length > 0, 'The styleSheets have been inserted');
            assert.equal($styleSheets.length, 3, 'All styleSheets have been inserted');

            assert.equal($container.css('background-color'), pink, 'The base style is loaded and computed');
            assert.equal($container.css('color'), blue, 'The theme style is loaded and computed');

            loader.change('green');

            setTimeout(function() {
                assert.equal($container.css('background-color'), pink, 'The base style is still loaded');
                assert.equal($container.css('color'), green, 'The new theme style is loaded and computed');

                loader.change('default');

                setTimeout(function() {
                    assert.equal($container.css('background-color'), pink, 'The base style is loaded and computed');
                    assert.equal($container.css('color'), blue, 'The default theme style is loaded');
                    assert.equal(loader.getActiveTheme(), 'blue', 'The active theme has been reset to default');

                    setTimeout(function() {
                        assert.equal(
                            eventTriggered,
                            loader.getActiveTheme(),
                            'The themechange event has been triggered along with the correct parameters'
                        );
                        ready();
                    }, 250);
                }, 50);
            }, 50);
        }, 50);
    });

    QUnit.test('reload and change', function(assert) {
        var ready = assert.async();
        var loader = themeLoader(config);
        var $container = $('#qti-item');

        assert.expect(16);

        assert.equal($container.length, 1, 'The container exists');

        loader.load();
        setTimeout(function() {
            var $styleSheets = $('link[data-type^="custom-theme"]');
            assert.ok($styleSheets.length > 0, 'The styleSheets have been inserted');
            assert.equal($styleSheets.length, 3, 'All styleSheets have been inserted');

            assert.equal($container.css('background-color'), pink, 'The base style is loaded and computed');
            assert.equal($container.css('color'), blue, 'The theme style is loaded and computed');

            loader.unload();

            setTimeout(function() {
                var loader2;

                assert.equal($('link[data-type^="custom-theme"]').length, 3, 'The stylesheets are stil there');
                assert.ok($('link[data-id="base"]').prop('disabled'), 'The base stylesheet is disabled');
                assert.ok($('link[data-id="blue"]').prop('disabled'), 'The blue stylesheet is disabled');
                assert.ok($('link[data-id="green"]').prop('disabled'), 'The green stylesheet is disabled');

                loader2 = themeLoader(config);
                loader2.load();

                setTimeout(function() {
                    assert.ok(!$('link[data-id="base"]').prop('disabled'), 'The base stylesheet is now enabled');
                    assert.ok(!$('link[data-id="blue"]').prop('disabled'), 'The blue stylesheet is now enabled');
                    assert.ok($('link[data-id="green"]').prop('disabled'), 'The green stylesheet is disabled');

                    loader2.change('green');

                    setTimeout(function() {
                        assert.equal($container.css('background-color'), pink, 'The base style is still loaded');
                        assert.equal($container.css('color'), green, 'The new theme style is loaded and computed');
                        assert.equal(loader2.getActiveTheme(), 'green', 'The new theme became the active theme');

                        setTimeout(function() {
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
