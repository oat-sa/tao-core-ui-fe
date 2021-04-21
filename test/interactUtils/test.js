define(['jquery', 'lodash', 'interact', 'ui/interactUtils', 'core/mouseEvent'], function(
    $,
    _,
    interact,
    interactUtils,
    triggerMouseEvent
) {
    'use strict';

    QUnit.module('tapOn(), javascript element');

    QUnit.test('fire mousedown and mouseup events', function(assert) {
        var ready = assert.async();
        assert.expect(3);

        var button = document.getElementById('button');
        button.addEventListener('pointerdown', function pointerdown() {
            assert.ok(true, 'pointerdown has been fired');
        });
        button.addEventListener('pointerup', function pointerup() {
            assert.ok(true, 'pointerup has been fired');
        });

        interactUtils.tapOn(button, function() {
            assert.ok(true, 'callback has been fired');
            ready();
        });
    });

    QUnit.test('triggers interact tap event', function(assert) {
        var ready = assert.async();
        assert.expect(2);

        var button = document.getElementById('button');
        interact(button).on('tap', function tap() {
            assert.ok(true, 'tap has been triggered');
        });

        interactUtils.tapOn(button, function() {
            assert.ok(true, 'callback has been fired');
            ready();
        });
    });

    QUnit.module('tapOn(), jquery element');

    QUnit.test('fire mousedown and mouseup events', function(assert) {
        var ready = assert.async();
        assert.expect(3);

        var button = document.getElementById('button'),
            $button = $('#button');

        button.addEventListener('pointerdown', function pointerdown() {
            assert.ok(true, 'pointerdown has been fired');
        });
        button.addEventListener('pointerup', function pointerup() {
            assert.ok(true, 'pointerup has been fired');
        });

        interactUtils.tapOn($button, function() {
            assert.ok(true, 'callback has been fired');
            ready();
        });
    });

    QUnit.test('triggers interact tap event', function(assert) {
        var ready = assert.async();
        assert.expect(2);

        var button = document.getElementById('button'),
            $button = $('#button');

        interact(button).on('tap', function tap() {
            assert.ok(true, 'tap has been triggered');
        });

        interactUtils.tapOn($button, function() {
            assert.ok(true, 'callback has been fired');
            ready();
        });
    });

    QUnit.module('moveElement(), restoreElementPosition()');

    QUnit.test('move and restore js element position', function(assert) {
        assert.expect(4);

        var dragged = document.getElementById('dragged');

        interactUtils.moveElement(dragged, 5, 15);

        assert.equal(dragged.getAttribute('data-x'), 5, 'data-x has been set');
        assert.equal(dragged.getAttribute('data-y'), 15, 'data-x has been set');

        // Doesn\'t work in PhantomJS
        // assert.equal(dragged.style.transform, 'translate(5px, 15px)', 'element has been moved with css transform');
        // assert.equal(dragged.style.webkitTransform, 'translate(5px, 15px)', 'element has been moved with css webkitTransform');

        interactUtils.restoreOriginalPosition(dragged);

        assert.equal(dragged.getAttribute('data-x'), 0, 'data-x has been set');
        assert.equal(dragged.getAttribute('data-y'), 0, 'data-x has been set');

        // Doesn\'t work in PhantomJS
        // assert.equal(dragged.style.transform, 'translate(0px, 0px)', 'element has been moved with css transform');
        // assert.equal(dragged.style.webkitTransform, 'translate(0px, 0px)', 'element has been moved with css webkitTransform');
    });

    QUnit.test('move and restore jQuery element position', function(assert) {
        assert.expect(4);

        var dragged = document.getElementById('dragged'),
            $dragged = $('#dragged');

        interactUtils.moveElement($dragged, 5, 15);

        assert.equal(dragged.getAttribute('data-x'), 5, 'data-x has been set');
        assert.equal(dragged.getAttribute('data-y'), 15, 'data-x has been set');

        // Doesn\'t work in PhantomJS
        // assert.equal(dragged.style.transform, 'translate(5px, 15px)', 'element has been moved with css transform');
        // assert.equal(dragged.style.webkitTransform, 'translate(5px, 15px)', 'element has been moved with css webkitTransform');

        interactUtils.restoreOriginalPosition($dragged);

        assert.equal(dragged.getAttribute('data-x'), 0, 'data-x has been set');
        assert.equal(dragged.getAttribute('data-y'), 0, 'data-x has been set');

        // Doesn\'t work in PhantomJS
        // assert.equal(dragged.style.transform, 'translate(0px, 0px)', 'element has been moved with css transform');
        // assert.equal(dragged.style.webkitTransform, 'translate(0px, 0px)', 'element has been moved with css webkitTransform');
    });

    QUnit.module('iframe drag fix');

    QUnit.test('registered callback is triggered when mouse leave browser window', function(assert) {
        var ready = assert.async();
        assert.expect(1);

        interactUtils.iFrameDragFixOn(function() {
            assert.ok(true, 'callback has been fired');
            ready();
        });

        triggerMouseEvent(window, 'mouseleave', {});

        interactUtils.iFrameDragFixOff();

        triggerMouseEvent(window, 'mouseleave', {}); // Triggers an error if event listener hasn\'t been removed
    });
});
