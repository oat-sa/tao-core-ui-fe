define(['jquery', 'ui/previewer'], function($, previewer) {
    'use strict';

    QUnit.module('Previewer Stand Alone Test');
    QUnit.test('plugin', function(assert) {
        assert.expect(1);
        assert.ok(typeof $.fn.previewer === 'function', 'The Previewer plugin is registered');
    });

    QUnit.test('Initialization', function(assert) {
        var ready = assert.async();
        assert.expect(3);
        var $fixture = $('#qunit-fixture');
        var $elt = $('#p1', $fixture);
        assert.ok($elt.length === 1, 'Test the fixture is available');

        $elt.on('create.previewer', function() {
            assert.ok(typeof $elt.data('ui.previewer') === 'object', 'The element is runing the plugin');
            assert.ok($elt.hasClass('previewer'), 'The element has the right css clas');
            ready();
        });
        $elt.previewer({
            url: 'https://www.taotesting.com/wp-content/uploads/2019/04/video-poster-100x50.png',
            type: 'image/png'
        });
    });

    QUnit.test('Image preview', function(assert) {
        var ready = assert.async();
        assert.expect(5);

        var options = {
            url: 'https://www.taotesting.com/wp-content/uploads/2019/04/video-poster-100x50.png',
            mime: 'image/png',
            width: 50,
            height: 50
        };
        var $fixture = $('#qunit-fixture');
        var $elt = $('#p1', $fixture);

        assert.ok($elt.length === 1, 'Test the fixture is available');

        $elt.on('create.previewer', function() {
            assert.equal($elt.find('img').length, 1, 'The image element is created');
            assert.equal($elt.find('img').attr('src'), options.url, 'The image src is set');
            assert.equal($elt.find('img').width(), options.width, 'The image width is set');
            assert.equal($elt.find('img').height(), options.height, 'The image height is set');
            ready();
        });
        $elt.previewer(options);
    });

    QUnit.test('Data Attribute', function(assert) {
        var ready = assert.async();
        assert.expect(5);

        var options = {
            url: 'https://www.taotesting.com/wp-content/uploads/2019/04/tao-bg.mp4',
            mime: 'video/mp4'
        };
        var $fixture = $('body');
        var $elt = $('#p2', $fixture);

        assert.ok($elt.length === 1, 'Test the fixture is available');

        $elt.on('create.previewer', function() {
            setTimeout(function() {
                assert.equal($elt.find('video').length, 1, 'The video element is created');
                assert.equal($elt.find('video source').length, 1, 'The video source element is created');
                assert.equal($elt.find('video source').attr('src'), options.url, 'The video src is set');
                assert.equal($elt.find('.mediaplayer').length, 1, 'The media element player is set up');
                ready();
            }, 1000);
        });
        previewer($fixture);
    });
});
