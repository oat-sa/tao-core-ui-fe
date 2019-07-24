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
 * Copyright (c) 2019 (original work) Open Assessment Technologies SA ;
 */
/**
 * @author Jean-Sébastien Conan <jean-sebastien.conan@vesperiagroup.com>
 */
define([
    'jquery',
    'lodash',
    'ui/tabs'
], function($, _, tabsFactory) {
    'use strict';

    QUnit.module('tabs');

    QUnit.test('module', function(assert) {
        assert.expect(3);

        assert.equal(typeof tabsFactory, 'function', 'The tabs module exposes a function');
        assert.equal(typeof tabsFactory(), 'object', 'The tabs factory produces an object');
        assert.notStrictEqual(
            tabsFactory(),
            tabsFactory(),
            'The tabs factory provides a different object on each call'
        );
    });

    var $qunitFixture = $('#qunit-fixture');

    var testTabsApi = [
        { name: 'init' },
        { name: 'destroy' },
        { name: 'render' },
        { name: 'show' },
        { name: 'hide' },
        { name: 'enable' },
        { name: 'disable' },
        { name: 'is' },
        { name: 'setState' },
        { name: 'getElement' },
        { name: 'getContainer' },
        { name: 'getTemplate' },
        { name: 'setTemplate' },
        { name: 'setTabs' },
        { name: 'getTabs' },
        { name: 'connectTabs' },
        { name: 'activateTabByName' },
        { name: 'activateTabByIndex' },
        { name: 'showDataPanel' }
    ];

    QUnit.cases.init(testTabsApi).test('instance API ', function(data, assert) {
        var instance = tabsFactory();
        assert.expect(1);
        assert.equal(
            typeof instance[data.name],
            'function',
            'The tabs instance exposes a "' + data.name + '" function'
        );
        instance.destroy();
    });

    QUnit.test('init', function(assert) {
        var config = {
        };
        var instance = tabsFactory(config);

        assert.expect(1);

        assert.equal(instance.is('rendered'), false, 'The tabs instance must not be rendered');

        instance.destroy();
    });

    QUnit.test('rendering', function(assert) {
        var config = {
            renderTo: $qunitFixture,
            tabs: [
                { label: 'first', name: 'tab1' },
                { label: 'second', name: 'tab2' },
                { label: 'third', name: 'tab3' },
            ]
        };
        var instance = tabsFactory(config);
        var $tabsDom = $('.tab-group', $qunitFixture);

        assert.expect(10);

        assert.equal(instance.is('rendered'), true, 'The tabs instance must be rendered');
        assert.equal($tabsDom.length, 1, '1 .tab-group was rendered');
        assert.equal($tabsDom.find('li.tab').length, 3, '3 <li>s were rendered');
        assert.equal($tabsDom.find('li.tab button').length, 3, '3 <button>s were rendered');
        assert.equal($tabsDom.find('li.tab button').eq(0).html(), 'first', '<button> text as defined');
        assert.equal($tabsDom.find('li.tab button').eq(1).html(), 'second', '<button> text as defined');
        assert.equal($tabsDom.find('li.tab button').eq(2).html(), 'third', '<button> text as defined');
        assert.ok($tabsDom.find('li.tab').eq(0).hasClass('active'), 'First tab is activated');
        assert.notOk($tabsDom.find('li.tab').eq(1).hasClass('active'), 'Second tab is deactivated');
        assert.notOk($tabsDom.find('li.tab').eq(2).hasClass('active'), 'Third tab is deactivated');

        instance.destroy();
    });

    QUnit.test('setTabs', function(assert) {
        var config = {
        };
        var tabs = [
            { label: 'set1' },
            { label: 'set2' }
        ];
        var instance = tabsFactory(config);
        var ret = instance.setTabs(tabs);

        assert.expect(2);

        assert.deepEqual(instance.getTabs(), tabs, 'The tabs were set internally');
        assert.deepEqual(ret, instance, 'setTabs() returns the same instance');

        instance.destroy();
    });

    QUnit.test('connectTabs', function(assert) {
        var config = {
            renderTo: $qunitFixture,
            tabs: [
                { label: 'tabToConnect', name: '' }
            ]
        };
        var instance = tabsFactory(config);
        var $firstBtn = $('.tab-group button:first-of-type', $qunitFixture);

        assert.expect(2);

        instance.on('activate-tab.*', function(value) {
            assert.ok(true, 'An activate-tab event was fired upon clicking');
            assert.strictEqual(value, 0, 'The param passed with the event matches the tab index');
        });

        $firstBtn.trigger('click');

        instance.destroy();
    });

    QUnit.test('activateTabByName', function(assert) {
        var config = {
            renderTo: $qunitFixture,
            tabs: [
                { label: 'first', name: 'tab1' },
                { label: 'second', name: 'tab2' },
                { label: 'third', name: 'tab3' },
            ]
        };
        var instance = tabsFactory(config);
        var $tabsDom = $('.tab-group', $qunitFixture);

        assert.expect(7);

        var ret = instance.activateTabByName('tab2');
        assert.deepEqual(ret, instance, 'activateTabByName() returns the same instance');
        assert.equal($('.tab.active', $tabsDom).length, 1, 'Only 1 tab is active');
        assert.equal($('.tab.active button', $tabsDom).html(), 'second', 'second tab is active');

        instance.activateTabByName('tab3');
        assert.equal($('.tab.active', $tabsDom).length, 1, 'Only 1 tab is active');
        assert.equal($('.tab.active button', $tabsDom).html(), 'third', 'third tab is active');

        instance.activateTabByName('tab1');
        assert.equal($('.tab.active', $tabsDom).length, 1, 'Only 1 tab is active');
        assert.equal($('.tab.active button', $tabsDom).html(), 'first', 'first tab is active');

        instance.destroy();
    });

    QUnit.test('onClick callback (call=true)', function(assert) {
        var config = {
            renderTo: $qunitFixture,
            tabs: [
                {
                    label: 'first',
                    name: 'tab1',
                    onClick: function() {
                        assert.ok(true, 'The passed onClick callback was called');
                    }
                }
            ]
        };
        var instance = tabsFactory(config);

        assert.expect(1);

        instance.activateTabByName('tab1'); // call

        instance.destroy();
    });

    QUnit.test('onClick callback (call=false)', function(assert) {
        var config = {
            renderTo: $qunitFixture,
            tabs: [
                {
                    label: 'first',
                    name: 'tab1',
                    onClick: function() {
                        assert.ok(false, 'The passed onClick callback was called');
                    }
                }
            ]
        };
        var instance = tabsFactory(config);

        assert.expect(1);

        instance.activateTabByName('tab1', false); // no call
        assert.ok(true, 'Test ran without triggering onClick callback');

        instance.destroy();
    });

    QUnit.test('activeTabIndex param', function(assert) {
        var config = {
            renderTo: $qunitFixture,
            tabs: [
                { label: 'first', name: 'tab1' },
                { label: 'second', name: 'tab2' }
            ],
            activeTabIndex: 1
        };
        var instance = tabsFactory(config);
        var $tabsDom = $('.tab-group', $qunitFixture);

        assert.expect(2);

        assert.equal($('.tab.active', $tabsDom).length, 1, 'Only 1 tab is active');
        assert.equal($('.tab.active button', $tabsDom).html(), 'second', 'second tab is active');

        instance.destroy();
    });

    QUnit.test('showHideTargets param (true)', function(assert) {
        var $qunitFixture2 =  $('#qunit-fixture2');
        var config = {
            renderTo: $('nav', $qunitFixture2),
            tabs: [
                { label: 'first', name: 'tab1' },
                { label: 'second', name: 'tab2' }
            ],
            showHideTargets: true
        };
        var instance = tabsFactory(config);

        var $secondBtn = $('.tab-group button', $qunitFixture2).eq(1);
        var $firstPanel = $('[data-panel="panel-tab1"]', $qunitFixture2);
        var $secondPanel = $('[data-panel="panel-tab2"]', $qunitFixture2);

        instance.on('show-panel.*', function(name) {
            assert.ok(true, 'The show-panel event fired');
            assert.equal(name, 'tab2', 'The event was fired with a value matching the tab name');
        });

        assert.expect(7);

        assert.equal(instance.is('rendered'), true, 'The tabs instance must be rendered');
        assert.notOk($firstPanel.hasClass("hidden"), 'Panel 1 is visible');
        assert.ok($secondPanel.hasClass("hidden"), 'Panel 2 is hidden');

        $secondBtn.trigger('click');
        // panels toggled
        assert.ok($firstPanel.hasClass("hidden"), 'Panel 1 is hidden');
        assert.notOk($secondPanel.hasClass("hidden"), 'Panel 2 is visible');

        instance.destroy();
    });

    QUnit.test('showHideTargets param (false)', function(assert) {
        var config = {
            renderTo: $qunitFixture,
            tabs: [
                { label: 'first', name: 'tab1' },
                { label: 'second', name: 'tab2' }
            ],
            showHideTargets: false
        };
        var instance = tabsFactory(config);
        var $secondBtn = $('.tab-group button', $qunitFixture).eq(1);
        var $firstPanel = $('<div data-panel="panel-tab1">Panel 1</div>');
        var $secondPanel = $('<div data-panel="panel-tab2">Panel 2</div>');

        assert.expect(2);

        $firstPanel.appendTo($qunitFixture);
        $secondPanel.appendTo($qunitFixture);

        $secondBtn.trigger('click');

        // panels not toggled
        assert.notOk($firstPanel.hasClass("hidden"), 'Panel 1 is visible');
        assert.notOk($secondPanel.hasClass("hidden"), 'Panel 2 is visible');

        instance.destroy();
    });

    QUnit.test('visual', function(assert) {
        var config = {
            renderTo: $('#visual-fixture nav'),
            tabs: [
                { label: 'TAO Local', name: 'tao-local', onClick: () => console.log('visual 1st cb') },
                { label: 'TAO Remote', name: 'tao-remote', onClick: () => console.log('visual 2nd cb') },
                { label: 'LTI-based', name: 'lti-based', onClick: () => console.log('visual 3rd cb') }
            ]
        };

        var instance = tabsFactory(config);

        assert.ok(true, 'visual test ran');
    });

});
