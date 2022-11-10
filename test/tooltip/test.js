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
 * Copyright (c) 2015-2018 (original work) Open Assessment Technologies SA ;
 */
/**
 * @author Jean-Sébastien Conan <jean-sebastien.conan@vesperiagroup.com>
 */
define(['jquery', 'lodash', 'ui/tooltip', 'tpl!ui/tooltip/default'], function($, _, tooltip, defaultTpl) {
    'use strict';
    var containerName = 'single';
    var containerNameMultiple = 'multiple';
    var mouseenter = document.createEvent('Events');
    var mouseleave = document.createEvent('Events');
    var themes = ['default', 'dark', 'info', 'warning', 'error', 'success', 'danger', 'when theme not exist'];
    var defaultTheme = defaultTpl({ class: 'tooltip-plain' });

    QUnit.module('tooltip');

    mouseenter.initEvent('mouseenter', true, false);
    mouseleave.initEvent('mouseleave', true, false);

    QUnit.test('Tooltip: component initialization', function(assert) {
        var $single;
        assert.expect(2);
        tooltip.lookup($(`#${  containerName}`));
        $single = $('[data-tooltip]', `#${  containerName}`).first();
        assert.ok($single.data('$tooltip'), 'tooltip got built from given container');
        assert.throws(function() {
            tooltip.lookup();
        }, 'tooltip component throws an exception when called without attributes');
    });
    QUnit.test('Tooltip: component as Tooltip instance', function(assert) {
        var $ref = $('[data-tooltip]', `#${  containerName}`).first();
        var instance;
        assert.expect(1);
        instance = tooltip.create($ref, 'default text');
        assert.ok(instance, 'tooltip got built from given container');
    });

    QUnit.test('Tooltip: component API', function(assert) {
        var $container = $(`#${  containerName}`);
        var $single;
        var instance;
        var wrapperInstance;
        var expectedContent = $('.tooltip-content', $container)[0].cloneNode(true).outerHTML;

        assert.expect(16);

        tooltip.lookup($container);
        $single = $('[data-tooltip]', $container).first();

        wrapperInstance = $single.data('$tooltip');
        instance = tooltip.create($single, 'default text');
        assert.equal(typeof wrapperInstance.show, 'function', 'tooltipAPI: show() defined');
        assert.equal(typeof wrapperInstance.hide, 'function', 'tooltipAPI: hide() defined');
        assert.equal(typeof wrapperInstance.dispose, 'function', 'tooltipAPI: dispose() defined');
        assert.equal(typeof wrapperInstance.toggle, 'function', 'tooltipAPI: toggle() defined');
        assert.equal(typeof wrapperInstance.updateTitleContent, 'function', 'tooltipAPI: updateTitleContent() defined');
        assert.equal(typeof wrapperInstance.options, 'object', 'tooltipAPI: .options defined');
        assert.equal(typeof wrapperInstance._isOpen, 'boolean', 'tooltipAPI: ._isOpen defined');
        assert.equal(typeof instance.show, 'function', 'tooltipAPI: show() defined');
        assert.equal(typeof instance.hide, 'function', 'tooltipAPI: hide() defined');
        assert.equal(typeof instance.dispose, 'function', 'tooltipAPI: dispose() defined');
        assert.equal(typeof instance.toggle, 'function', 'tooltipAPI: toggle() defined');
        assert.equal(typeof instance.updateTitleContent, 'function', 'tooltipAPI: updateTitleContent() defined');
        assert.equal(typeof instance.options, 'object', 'tooltipAPI: .options defined');
        assert.equal(typeof instance._isOpen, 'boolean', 'tooltipAPI: ._isOpen defined');

        assert.equal(
            wrapperInstance.options.title.outerHTML,
            expectedContent,
            'tooltip can recieve DOM element as title content'
        );

        tooltip.lookup($container);
        wrapperInstance = $single.data('$tooltip');
        assert.equal(
            wrapperInstance.options.title.outerHTML,
            expectedContent,
            'tooltip can be rewritten by the executing it several times at the same wrapper.'
        );
    });
    QUnit.cases.init(themes).test('Tooltip: all themes applied', function(data, assert) {
        var $reference = $('#tooltipstered');
        var instance;
        var $single;
        assert.expect(2);
        $reference.attr('data-tooltip-theme', data);
        tooltip.lookup($(`#${  containerName}`));
        $single = $('[data-tooltip]', `#${  containerName}`).first();
        instance = $single.data('$tooltip');

        assert.notEqual(instance.options.template.trim(), '', 'template is not empty string');
        if (data === 'default' || data === 'when theme not exist') {
            assert.equal(instance.options.template, defaultTheme, `${data  }  default template applied`);
        } else {
            assert.notEqual(instance.options.template.trim(), '', `${data  } template applied`);
        }
    });
    QUnit.test('Tooltip: create several tooltips on same page', function(assert) {
        var amount = 3;
        var resultAmount = 0;
        var $container = $(`#${  containerNameMultiple}`);
        assert.expect(1);
        tooltip.lookup($container);
        $('[data-tooltip]', $container).each(function(key, item) {
            if ($(item).data('$tooltip')) {
                resultAmount++;
            }
        });

        assert.equal(resultAmount, amount, 'possibility to have several tooltips on page');
    });

    QUnit.module('physical interactions:');

    QUnit.test('tooltip.lookup()', function(assert) {
        var ready = assert.async();
        var $container = $(`#${  containerName}`);
        var $single = $('[data-tooltip]', `#${  containerName}`).first();

        assert.expect(2);
        tooltip.lookup($container);
        $single[0].dispatchEvent(mouseenter);

        setTimeout(function() {
            var $tooltip = $('.tooltip-blue', $container);
            assert.equal($tooltip.length, 1, 'tooltip binds to DOM');
            $single[0].dispatchEvent(mouseleave);

            setTimeout(function() {
                var $hidden = $('.tooltip-blue', $container);
                var styles = window.getComputedStyle($hidden[0]);
                assert.equal(styles.visibility, 'hidden', 'tooltip became hidden on mouse out');
                ready();
            });
        });
    });

    QUnit.test('tooltip.create()', function(assert) {
        var ready = assert.async();
        var message = 'tooltip create error method';
        var $container = $(`#${  containerName}`);
        var $ref = $('#tooltipstered', $container);

        assert.expect(2);
        tooltip.create($ref, message, { theme: 'info' });
        $ref[0].dispatchEvent(mouseenter);

        setTimeout(function() {
            var $tooltip = $('.tooltip-blue', $container);
            assert.equal($tooltip.length, 1, 'tooltip binds to DOM');
            $ref[0].dispatchEvent(mouseleave);

            setTimeout(function() {
                var $hidden = $('.tooltip-blue', $container);
                var styles = window.getComputedStyle($hidden[0]);
                assert.equal(styles.visibility, 'hidden', 'tooltip became hidden on mouse out');
                ready();
            });
        });
    });

    QUnit.module('user friendly api');

    QUnit.test('tooltip.create({theme:"error"}) ', function(assert) {
        var ready = assert.async();
        var message = 'tooltip create error method';
        var $container = $(`#${  containerName}`);
        var $ref = $('#tooltipstered', $container);
        var errorInstance = tooltip.create($ref, message, { theme: 'error' });

        assert.expect(3);
        assert.ok(errorInstance, 'error tooltip created');
        errorInstance.show();

        setTimeout(function() {
            var $tooltip = $('.tooltip-red', $container);
            assert.equal($tooltip.length, 1, 'tooltip binds to DOM');
            assert.equal($('.tooltip-body', $tooltip).text(), message, 'renders message correctly');
            errorInstance.dispose();
            ready();
        });
    });
    QUnit.test('tooltip.create({theme:"warning"}) ', function(assert) {
        var ready = assert.async();
        var message = 'tooltip create warning method';
        var $container = $(`#${  containerName}`);
        var $ref = $('#tooltipstered', $container);
        var warningInstance = tooltip.create($ref, message, { theme: 'warning' });

        assert.expect(3);
        assert.ok(warningInstance, 'warning tooltip created');
        warningInstance.show();

        setTimeout(function() {
            var $tooltip = $('.tooltip-orange', $container);
            assert.equal($tooltip.length, 1, 'tooltip binds to DOM');
            assert.equal($('.tooltip-body', $tooltip).text(), message, 'renders message correctly');
            warningInstance.dispose();
            ready();
        });
    });
    QUnit.test('tooltip.create({theme:"danger"}) ', function(assert) {
        var ready = assert.async();
        var message = 'tooltip create warning method';
        var $container = $(`#${  containerName}`);
        var $ref = $('#tooltipstered', $container);
        var dangerInstance = tooltip.create($ref, message, { theme: 'danger' });

        assert.expect(3);
        assert.ok(dangerInstance, 'danger tooltip created');
        dangerInstance.show();

        setTimeout(function() {
            var $tooltip = $('.tooltip-danger', $container);
            assert.equal($tooltip.length, 1, 'tooltip binds to DOM');
            assert.equal($('.tooltip-body', $tooltip).text(), message, 'renders message correctly');
            dangerInstance.dispose();
            ready();
        });
    });

    QUnit.test('tooltip.create({theme:"success"}) ', function(assert) {
        var ready = assert.async();
        var message = 'tooltip create warning method';
        var $container = $(`#${  containerName}`);
        var $ref = $('#tooltipstered', $container);
        var successInstance = tooltip.create($ref, message, { theme: 'success' });

        assert.expect(3);
        assert.ok(successInstance, 'success tooltip created');
        successInstance.show();

        setTimeout(function() {
            var $tooltip = $('.tooltip-green', $container);
            assert.equal($tooltip.length, 1, 'tooltip binds to DOM');
            assert.equal($('.tooltip-body', $tooltip).text(), message, 'renders message correctly');
            successInstance.dispose();
            ready();
        });
    });

    QUnit.test('tooltip.create({theme:"info"}) ', function(assert) {
        var ready = assert.async();
        var message = 'tooltip create warning method';
        var $container = $(`#${  containerName}`);
        var $ref = $('#tooltipstered', $container);
        var infoInstance = tooltip.create($ref, message, { theme: 'info' });

        assert.expect(3);
        assert.ok(infoInstance, 'info tooltip created');
        infoInstance.show();

        setTimeout(function() {
            var $tooltip = $('.tooltip-blue', $container);
            assert.equal($tooltip.length, 1, 'tooltip binds to DOM');
            assert.equal($('.tooltip-body', $tooltip).text(), message, 'renders message correctly');
            infoInstance.dispose();
            ready();
        });
    });

    QUnit.module('Visual');

    QUnit.test('playground', function(assert) {
        var $container = $('#visible-fixture');
        var $elm = $('#visible-tooltip', $container);
        var $themeSelect = $('#theme-select', $container);
        assert.expect(1);
        tooltip.lookup($container);
        assert.ok($elm.data('$tooltip'), 'tooltip instance is defined');
        themes.forEach(function(value) {
            $themeSelect.append(`<option value="${  value  }">${  value  }</option>`);
        });

        $('#change-theme', $container).click(function($e) {
            var $ref = $('#visible-tooltip', $container);
            var instance;

            instance = new tooltip.create($ref, $ref.data('$tooltip').options.title, { theme: $themeSelect.val() });
            instance.show();
            $e.preventDefault();
            $e.stopPropagation();
            return false;
        });
        $('#toggle-tooltip', $container).click(function($e) {
            $('#visible-tooltip', $container)
                .data('$tooltip')
                .toggle();
            $e.preventDefault();
            $e.stopPropagation();
            return false;
        });
    });
});
