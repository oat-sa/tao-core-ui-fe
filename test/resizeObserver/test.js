define(['jquery', 'ui/resizeObserver'], function ($, resizeObserver) {
    'use strict';

    QUnit.module('ResizeObserver Helper');

    QUnit.test('module', function (assert) {
        assert.ok(typeof resizeObserver === 'object', 'The resizeObserver module is available');
        assert.ok(typeof resizeObserver.observe === 'function', 'The observe method is available');
        assert.ok(typeof resizeObserver.unobserve === 'function', 'The unobserve method is available');
    });

    QUnit.test('observe triggers callback on resize', function (assert) {
        const ready = assert.async();
        const $fixture = $('#qunit-fixture');
        const $element = $fixture.find('#test-element');
        let callCount = 0;

        assert.expect(4);

        const callback = function (entry) {
            requestAnimationFrame(() => {
                callCount++;
                if (callCount === 1) {
                    assert.ok(true, 'Initial callback triggered on observe');
                    assert.ok(entry instanceof ResizeObserverEntry, 'Callback receives a ResizeObserverEntry');
                    assert.strictEqual(entry.target, $element.get(0), 'Entry target matches the observed element');
                    $element.css('width', '200px');
                } else if (callCount === 2) {
                    assert.ok(true, 'Callback triggered after resize');
                    resizeObserver.unobserve($element, callback);
                    ready();
                }
            });
        };

        resizeObserver.observe($element, callback);
    });

    QUnit.test('unobserve stops observation', function (assert) {
        const ready = assert.async();
        const $fixture = $('#qunit-fixture');
        const $element = $fixture.find('#test-element');
        let callCount = 0;

        assert.expect(1);

        const callback = function () {
            callCount++;
            if (callCount === 1) {
                resizeObserver.unobserve($element, callback);
                $element.css('width', '300px');
                setTimeout(function () {
                    assert.strictEqual(callCount, 1, 'Callback was not called after unobserve');
                    ready();
                }, 100);
            }
        };

        resizeObserver.observe($element, callback);
    });

    QUnit.test('multiple callbacks on same element', function (assert) {
        const ready = assert.async();
        const $fixture = $('#qunit-fixture');
        const $element = $fixture.find('#test-element');
        let callback1, callback2;
        let callback1Count = 0;
        let callback2Count = 0;

        assert.expect(4);

        const checkDone = function () {
            if (callback2Count === 1) {
                assert.strictEqual(callback1Count, 1, 'First element callback was called');
                assert.strictEqual(callback2Count, 1, 'Second element callback was called');
                resizeObserver.unobserve($element, callback1);
                $element.css('width', '250px');
            } else if (callback2Count === 2) {
                assert.strictEqual(callback1Count, 1, 'First callback stopped after unobserve');
                assert.strictEqual(callback2Count, 2, 'Second callback still receives updates');
                resizeObserver.unobserve($element, callback2);
                ready();
            }
        };

        callback1 = function () {
            requestAnimationFrame(() => {
                callback1Count++;
                checkDone();
            });
        };

        callback2 = function () {
            requestAnimationFrame(() => {
                callback2Count++;
                checkDone();
            });
        };

        resizeObserver.observe($element, callback1);
        resizeObserver.observe($element, callback2);
    });

    QUnit.test('observe multiple elements', function (assert) {
        const ready = assert.async();
        const $fixture = $('#qunit-fixture');
        const $element1 = $fixture.find('#test-element');
        const domElement2 = $fixture.find('#test-element-2').get(0);
        let element1Called = false;
        let element2Called = false;

        assert.expect(2);

        const callback1 = function () {
            element1Called = true;
            checkDone();
        };

        const callback2 = function () {
            element2Called = true;
            checkDone();
        };

        function checkDone() {
            if (element1Called && element2Called) {
                assert.ok(element1Called, 'First element callback was called');
                assert.ok(element2Called, 'Second element callback was called');
                resizeObserver.unobserve($element1, callback1);
                resizeObserver.unobserve(domElement2, callback2);
                ready();
            }
        }

        resizeObserver.observe($element1, callback1);
        resizeObserver.observe(domElement2, callback2);
    });
});
