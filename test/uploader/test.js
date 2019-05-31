define(['jquery', 'ui/uploader', 'css!taoCss/tao-main-style.css'], function($) {
    'use strict';

    QUnit.test('plugin', function(assert) {
        assert.expect(1);
        assert.ok(typeof $.fn.uploader === 'function', 'The uploader plugin is registered');
    });
});
