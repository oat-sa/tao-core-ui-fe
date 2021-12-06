define(['jquery', 'ui/previewer'], function($, previewer) {
    'use strict';

    QUnit.module('Previewer Stand Alone Test');
    QUnit.test('plugin', function(assert) {
        assert.expect(1);
        assert.ok(typeof $.fn.previewer === 'function', 'The Previewer plugin is registered');
    });

    QUnit.test('Initialization', function(assert) {
        const ready = assert.async();
        assert.expect(3);
        const $fixture = $('#qunit-fixture');
        const $elt = $('#p1', $fixture);
        assert.ok($elt.length === 1, 'Test the fixture is available');

        $elt.on('create.previewer', function() {
            assert.ok(typeof $elt.data('ui.previewer') === 'object', 'The element is runing the plugin');
            assert.ok($elt.hasClass('previewer'), 'The element has the right css clas');
            ready();
        });
        $elt.previewer({
            url: '/test/previewer/samples/video-poster-100x50.png',
            type: 'image/png'
        });
    });

    QUnit.test('Image preview', function(assert) {
        const ready = assert.async();
        assert.expect(5);

        const options = {
            url: '/test/previewer/samples/video-poster-100x50.png',
            mime: 'image/png',
            width: 50,
            height: 50
        };
        const $fixture = $('#qunit-fixture');
        const $elt = $('#p1', $fixture);

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
        const ready = assert.async();
        assert.expect(3);

        const options = {
            url: '/test/previewer/samples/video-poster-100x50.png',
            mime: 'image/png'
        };
        const $fixture = $('#p2');
        const $elt = $('[data-preview]', $fixture);

        assert.ok($elt.length === 1, 'Test the fixture is available');

        Promise
            .all([
                new Promise(resolve => {
                    $elt.on('create.previewer', resolve);
                }),
                new Promise(resolve => {
                    $elt.on('update.previewer', resolve);
                })
            ])
            .then(() => {
                assert.equal($elt.find('img').length, 1, 'The video element is created');
                assert.equal($elt.find('img').attr('src'), options.url, 'The video src is set');
            })
            .catch(err => {
                assert.pushResult({
                    result: false,
                    message: err
                });
            })
            .then(ready);

        previewer($fixture);
    });
});
