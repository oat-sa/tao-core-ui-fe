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
 * @author Martin Nicholson <martin@taotesting.com>
 */
define([
    'jquery',
    'lodash',
    'ui/tabs'
], function ($, _, tabsFactory) {
    'use strict';

    function getInstance(fixture, config) {
        return tabsFactory(fixture, config)
            .on('ready', function () {
                this.destroy();
            });
    }

    QUnit.module('Tabs Factory');

    QUnit.test('module', function (assert) {
        var instance = getInstance('#fixture-api');
        var instance2 = getInstance('#fixture-api');

        assert.expect(3);
        assert.strictEqual(typeof tabsFactory, 'function', 'The module exposes a function');
        assert.strictEqual(typeof instance, 'object', 'The factory produces an object');
        assert.notStrictEqual(instance, instance2, 'The factory provides a different object on each call');
    });

    QUnit.cases.init([
        {title: 'init'},
        {title: 'destroy'},
        {title: 'render'},
        {title: 'setSize'},
        {title: 'show'},
        {title: 'hide'},
        {title: 'enable'},
        {title: 'disable'},
        {title: 'is'},
        {title: 'setState'},
        {title: 'getContainer'},
        {title: 'getElement'},
        {title: 'getTemplate'},
        {title: 'setTemplate'},
        {title: 'getConfig'}
    ]).test('inherited API', function (data, assert) {
        var instance = getInstance('#fixture-api');

        assert.expect(1);
        assert.strictEqual(typeof instance[data.title], 'function', 'The tabs instance exposes a "' + data.title + '" function');
    });


    QUnit.cases.init([
        {title: 'on'},
        {title: 'off'},
        {title: 'trigger'},
        {title: 'spread'}
    ]).test('event API ', function (data, assert) {
        var instance = getInstance('#fixture-api');

        assert.expect(1);
        assert.strictEqual(typeof instance[data.title], 'function', 'The tabs instance exposes a "' + data.title + '" function');
    });

    QUnit.cases.init([
        {title: 'setTabs'},
        {title: 'getTabs'},
        {title: 'getActiveTab'},
        {title: 'getActiveTabIndex'},
        {title: 'getDefaultActiveTab'},
        {title: 'setActiveTab'},
        {title: 'setActiveTabIndex'},
        {title: 'disableTab'},
        {title: 'enableTab'},
        {title: 'showTabContent'}
    ]).test('tabs API ', function (data, assert) {
        var instance = getInstance('#fixture-api');

        assert.expect(1);
        assert.strictEqual(typeof instance[data.title], 'function', 'The tabs instance exposes a "' + data.title + '" function');
    });

    QUnit.module('Tabs Life cycle');

    QUnit.cases.init([{
        title: 'default',
        expected: {
            tabs: [],
            active: null,
            activeIndex: -1
        }
    }, {
        title: 'empty',
        config: {},
        expected: {
            tabs: [],
            active: null,
            activeIndex: -1
        }
    }, {
        title: 'tabs',
        config: {
            tabs: [
                {name: 'tab1', label: 'Tab 1'},
                {name: 'tab2', label: 'Tab 2'}
            ]
        },
        expected: {
            tabs: [
                {name: 'tab1', label: 'Tab 1'},
                {name: 'tab2', label: 'Tab 2'}
            ],
            active: 'tab1',
            activeIndex: 0
        }
    }, {
        title: 'activeTab',
        config: {
            activeTab: 'tab2',
            tabs: [
                {name: 'tab1', label: 'Tab 1'},
                {name: 'tab2', label: 'Tab 2'}
            ]
        },
        expected: {
            tabs: [
                {name: 'tab1', label: 'Tab 1'},
                {name: 'tab2', label: 'Tab 2'}
            ],
            active: 'tab2',
            activeIndex: 1
        }
    }, {
        title: 'activeTabIndex',
        config: {
            activeTabIndex: 1,
            tabs: [
                {name: 'tab1', label: 'Tab 1'},
                {name: 'tab2', label: 'Tab 2'}
            ]
        },
        expected: {
            tabs: [
                {name: 'tab1', label: 'Tab 1'},
                {name: 'tab2', label: 'Tab 2'}
            ],
            active: 'tab2',
            activeIndex: 1
        }
    }]).test('init', function (data, assert) {
        var ready = assert.async();
        var $container = $('#fixture-init');
        var instance = tabsFactory($container, data.config);

        assert.expect(5);

        instance
            .on('init', function () {
                assert.strictEqual(this, instance, 'The instance has been initialized');
                assert.strictEqual(data.expected.active, instance.getDefaultActiveTab(), 'The default tab is as expected');
                assert.strictEqual(data.expected.active, instance.getActiveTab(), 'The expected tab name is active');
                assert.strictEqual(data.expected.activeIndex, instance.getActiveTabIndex(), 'The expected tab index is active');
                assert.deepEqual(data.expected.tabs, instance.getTabs(), 'The expected tabs are set');
            })
            .on('ready', function () {
                instance.destroy();
            })
            .on('destroy', ready)
            .on('error', function (err) {
                assert.pushResult({
                    result: false,
                    message: err
                });
                ready();
            });
    });

    QUnit.cases.init([{
        title: 'default'
    }, {
        title: 'empty',
        config: {}
    }, {
        title: 'tabs',
        config: {
            tabs: [
                {name: 'tab1', label: 'Tab 1', icon: 'globe'},
                {name: 'tab2', label: 'Tab 2', cls: 'foo'},
                {name: 'tab3', label: 'Tab 3', disabled: 'true'},
                {name: 'tab4', icon: 'flag'}
            ]
        },
        active: 'tab1'
    }, {
        title: 'activeTab',
        config: {
            activeTab: 'tab2',
            tabs: [
                {name: 'tab1', label: 'Tab 1', icon: 'globe'},
                {name: 'tab2', label: 'Tab 2', cls: 'foo'},
                {name: 'tab3', label: 'Tab 3', disabled: 'true'},
                {name: 'tab4', icon: 'flag'}
            ]
        },
        active: 'tab2'
    }, {
        title: 'activeTabIndex',
        config: {
            activeTabIndex: 3,
            tabs: [
                {name: 'tab1', label: 'Tab 1', icon: 'globe'},
                {name: 'tab2', label: 'Tab 2', cls: 'foo'},
                {name: 'tab3', label: 'Tab 3', disabled: 'true'},
                {name: 'tab4', icon: 'flag'}
            ]
        },
        active: 'tab4'
    }]).test('render', function (data, assert) {
        var ready = assert.async();
        var $container = $('#fixture-render');
        var numberOfTabs = data.config && data.config.tabs && data.config.tabs.length || 0;
        var instance;
        var index;
        var tab;

        assert.expect(7 + numberOfTabs * 6);
        assert.equal($container.children().length, 0, 'The container is empty');

        instance = tabsFactory($container, data.config)
            .on('init', function () {
                assert.strictEqual(this, instance, 'The instance has been initialized');
            })
            .on('ready', function () {
                assert.strictEqual($container.children().length, 1, 'The container contains an element');
                assert.strictEqual($container.children().is('.tab-group'), true, 'The container contains the expected element');
                assert.strictEqual($container.find('.tab-group .tab').length, numberOfTabs, 'The component contains ' + numberOfTabs + ' tabs');

                if (numberOfTabs) {
                    assert.strictEqual($container.find('.tab-group .tab.active').length, 1, 'The component contains an active tab');
                    assert.strictEqual($container.find('.tab-group .tab.active').attr('data-tab-name'), data.active, 'The expected tab is active');
                } else {
                    assert.strictEqual($container.find('.tab-group .tab.active').length, 0, 'The component does not contain an active tab');
                    assert.strictEqual($container.find('.tab-group').children().length, 0, 'No tab is rendered');
                }

                for (index = 0; index < numberOfTabs; index++) {
                    tab = data.config.tabs[index];
                    assert.deepEqual(instance.getTabs()[index], tab, 'The instance contains the expected tab at index ' + index);
                    assert.strictEqual(
                        $container.find('.tab[data-tab-name="' + tab.name + '"] .action').length,
                        1,
                        'The tab ' + tab.name + ' has an action element'
                    );
                    if (tab.cls) {
                        assert.strictEqual(
                            $container.find('.tab[data-tab-name="' + tab.name + '"].' + tab.cls).length,
                            1,
                            'The tab ' + tab.name + ' is rendered with the expected class'
                        );
                    } else {
                        assert.strictEqual(
                            $container.find('.tab[data-tab-name="' + tab.name + '"]').length,
                            1,
                            'The tab ' + tab.name + ' is rendered'
                        );
                    }
                    if (tab.disabled) {
                        assert.strictEqual(
                            $container.find('.tab[data-tab-name="' + tab.name + '"] .action:disabled').length,
                            1,
                            'The tab ' + tab.name + ' is rendered disabled'
                        );
                    } else {
                        assert.strictEqual(
                            $container.find('.tab[data-tab-name="' + tab.name + '"] .action:disabled').length,
                            0,
                            'The tab ' + tab.name + ' is rendered enabled'
                        );
                    }
                    if (tab.icon) {
                        assert.strictEqual(
                            $container.find('.tab[data-tab-name="' + tab.name + '"] .icon-' + tab.icon).length,
                            1,
                            'The tab ' + tab.name + ' contains an icon'
                        );
                    } else {
                        assert.strictEqual(
                            $container.find('.tab[data-tab-name="' + tab.name + '"] .icon').length,
                            0,
                            'The tab ' + tab.name + ' does not contain an icon'
                        );
                    }
                    if (tab.label) {
                        assert.strictEqual(
                            $container.find('.tab[data-tab-name="' + tab.name + '"]').text().trim(),
                            tab.label,
                            'The tab ' + tab.name + ' contains the expected label'
                        );
                    } else {
                        assert.strictEqual(
                            $container.find('.tab[data-tab-name="' + tab.name + '"]').text().trim(),
                            '',
                            'The tab ' + tab.name + ' does not contain a label'
                        );
                    }
                }

                instance.destroy();
            })
            .on('destroy', ready)
            .on('error', function (err) {
                assert.pushResult({
                    result: false,
                    message: err
                });
                ready();
            });
    });

    QUnit.cases.init([{
        title: 'hide lone tab, without active',
        config: {
            hideLoneTab: true,
            tabs: [
                {name: 'tab1', label: 'TAB #1'}
            ]
        }
    }, {
        title: 'hide lone tab, with active',
        config: {
            hideLoneTab: true,
            activeTab: 'tab1',
            tabs: [
                {name: 'tab1', label: 'TAB #1'}
            ]
        }
    }, {
        title: 'several tabs, without active',
        config: {
            hideLoneTab: true,
            tabs: [
                {name: 'tab1', label: 'TAB #1'},
                {name: 'tab2', label: 'TAB #2'},
                {name: 'tab3', label: 'TAB #3', cls: 'foo'}
            ]
        }
    }, {
        title: 'several tabs, with active',
        config: {
            hideLoneTab: true,
            activeTab: 'tab1',
            tabs: [
                {name: 'tab1', label: 'TAB #1'},
                {name: 'tab2', label: 'TAB #2'},
                {name: 'tab3', label: 'TAB #3', cls: 'foo'}
            ]
        }
    }, {
        title: 'show lone tab, without active',
        config: {
            tabs: [
                {name: 'tab1', label: 'TAB #1'}
            ]
        }
    }, {
        title: 'show lone tab, with active',
        config: {
            activeTab: 'tab1',
            tabs: [
                {name: 'tab1', label: 'TAB #1'}
            ]
        }
    }]).test('single tab', (data, assert) => {
        const ready = assert.async();
        const $container = $('#fixture-single');
        const numberOfTabs = data.config.tabs.length;

        assert.expect(7);
        assert.equal($container.children().length, 0, 'The container is empty');

        const instance = tabsFactory($container, data.config)
            .on('init', function () {
                assert.equal(this, instance, 'The instance has been initialized');
            })
            .on('ready', () => {
                assert.equal($container.children().length, 1, 'The container contains an element');
                assert.equal($container.children().is('.tab-group'), true, 'The container contains the expected element');
                assert.equal($container.find('.tab-group .tab').length, numberOfTabs, `The component contains ${numberOfTabs} tabs`);
                assert.equal($container.find('.tab-group .tab.active').length, 1, 'The component contains 1 active tab.');
                if (data.config.hideLoneTab && numberOfTabs === 1) {
                    assert.equal($container.find('.tab-group .tab:hidden').length, 1, 'The tab is hidden.');
                } else {
                    assert.equal($container.find('.tab-group .tab:hidden').length, 0, 'The tab is visible.');
                }

                instance.destroy();
            })
            .on('destroy', () => ready())
            .on('error', err => {
                assert.ok(false, 'The operation should not fail!');
                assert.pushResult({
                    result: false,
                    message: err
                });
                ready();
            });
    });

    QUnit.test('hide', function (assert) {
        var ready = assert.async();
        var $container = $('#fixture-hide');
        var config = {
            activeTab: 'tab2',
            tabs: [
                {name: 'tab1', label: 'Tab 1', icon: 'globe'},
                {name: 'tab2', label: 'Tab 2', cls: 'foo'},
                {name: 'tab3', label: 'Tab 3', disabled: 'true'},
                {name: 'tab4', icon: 'flag'}
            ]
        };
        var instance;

        assert.expect(12);
        assert.equal($container.children().length, 0, 'The container is empty');

        instance = tabsFactory($container, config)
            .on('init', function () {
                assert.strictEqual(this, instance, 'The instance has been initialized');
            })
            .on('ready', function () {
                assert.strictEqual($container.children().length, 1, 'The container contains an element');
                assert.strictEqual($container.children().is('.tab-group'), true, 'The container contains the expected element');
                assert.strictEqual($container.find('.tab-group:visible').length, 1, 'The component is visible');
                assert.strictEqual($container.find('.tab-group .tab:visible').length, config.tabs.length, 'All tabs are visible');

                Promise
                    .resolve()
                    .then(function () {
                        return new Promise(function (resolve) {
                            instance
                                .off('.test')
                                .on('hide.test', function () {
                                    assert.ok(true, 'The hide event has been emitted');
                                    resolve();
                                })
                                .hide();
                        });
                    })
                    .then(function () {
                        return new Promise(function (resolve) {
                            assert.strictEqual($container.find('.tab-group:visible').length, 0, 'The component is hidden');
                            assert.strictEqual($container.find('.tab-group .tab:visible').length, 0, 'All tabs are hidden');

                            instance
                                .off('.test')
                                .on('show.test', function () {
                                    assert.ok(true, 'The show event has been emitted');
                                    resolve();
                                })
                                .show();
                        });
                    })
                    .then(function () {
                        assert.strictEqual($container.find('.tab-group:visible').length, 1, 'The component is visible');
                        assert.strictEqual($container.find('.tab-group .tab:visible').length, config.tabs.length, 'All tabs are visible');
                    })
                    .catch(function (err) {
                        assert.pushResult({
                            result: false,
                            message: err
                        });
                    })
                    .then(function () {
                        instance.destroy();
                    });
            })
            .on('destroy', ready)
            .on('error', function (err) {
                assert.pushResult({
                    result: false,
                    message: err
                });
                ready();
            });
    });

    QUnit.test('disable', function (assert) {
        var ready = assert.async();
        var $container = $('#fixture-disable');
        var config = {
            activeTab: 'tab2',
            tabs: [
                {name: 'tab1', label: 'Tab 1', icon: 'globe'},
                {name: 'tab2', label: 'Tab 2', cls: 'foo'},
                {name: 'tab3', label: 'Tab 3', disabled: 'true'},
                {name: 'tab4', icon: 'flag'}
            ]
        };
        var instance;

        assert.expect(18);
        assert.equal($container.children().length, 0, 'The container is empty');

        instance = tabsFactory($container, config)
            .on('init', function () {
                assert.strictEqual(this, instance, 'The instance has been initialized');
            })
            .on('ready', function () {
                assert.strictEqual($container.children().length, 1, 'The container contains an element');
                assert.strictEqual($container.children().is('.tab-group'), true, 'The container contains the expected element');
                assert.strictEqual($container.find('.tab-group').length, 1, 'The component is rendered');
                assert.strictEqual($container.find('.tab-group.disabled').length, 0, 'The component is enabled');
                assert.strictEqual($container.find('.tab-group .tab').length, config.tabs.length, 'The component contains the expected number of tabs');
                assert.strictEqual($container.find('.tab-group .tab .action:not(:disabled)').length, config.tabs.length - 1, 'The expected number of tabs is enabled');

                Promise
                    .resolve()
                    .then(function () {
                        return new Promise(function (resolve) {
                            instance
                                .off('.test')
                                .on('disable.test', function () {
                                    assert.ok(true, 'The disable event has been emitted');
                                    resolve();
                                })
                                .disable();
                        });
                    })
                    .then(function () {
                        return new Promise(function (resolve) {
                            assert.strictEqual($container.find('.tab-group.disabled').length, 1, 'The component is disabled');
                            assert.strictEqual($container.find('.tab-group .tab .action:disabled').length, config.tabs.length, 'The expected number of tabs is enabled');

                            instance
                                .off('.test')
                                .on('enable.test', function () {
                                    assert.ok(true, 'The enable event has been emitted');
                                    resolve();
                                })
                                .enable();
                        });
                    })
                    .then(function () {
                        return new Promise(function (resolve) {
                            assert.strictEqual($container.find('.tab-group.disabled').length, 0, 'The component is enabled');
                            assert.strictEqual($container.find('.tab-group .tab .action:not(:disabled)').length, config.tabs.length - 1, 'The expected number of tabs is enabled');

                            instance
                                .off('.test')
                                .on('tabenable.test', function (name) {
                                    assert.strictEqual(name, 'tab3', 'The tabenable event has been emitted');
                                    resolve();
                                })
                                .enableTab('tab3');
                        });
                    })
                    .then(function () {
                        return new Promise(function (resolve) {
                            assert.strictEqual($container.find('.tab-group .tab .action:not(:disabled)').length, config.tabs.length, 'The expected number of tabs is enabled');

                            instance
                                .off('.test')
                                .on('tabdisable.test', function (name) {
                                    assert.strictEqual(name, 'tab3', 'The tabdisable event has been emitted');
                                    resolve();
                                })
                                .disableTab('tab3');
                        });
                    })
                    .then(function () {
                        assert.strictEqual($container.find('.tab-group .tab .action:not(:disabled)').length, config.tabs.length - 1, 'The expected number of tabs is enabled');
                    })
                    .catch(function (err) {
                        assert.pushResult({
                            result: false,
                            message: err
                        });
                    })
                    .then(function () {
                        instance.destroy();
                    });
            })
            .on('destroy', ready)
            .on('error', function (err) {
                assert.pushResult({
                    result: false,
                    message: err
                });
                ready();
            });
    });

    QUnit.test('destroy', function(assert) {
        var ready = assert.async();
        var $container = $('#fixture-destroy');
        var instance;

        assert.expect(4);

        assert.equal($container.children().length, 0, 'The container is empty');

        instance = tabsFactory($container)
            .on('init', function () {
                assert.equal(this, instance, 'The instance has been initialized');
            })
            .on('ready', function () {
                assert.equal($container.children().length, 1, 'The container contains an element');
                instance.destroy();
            })
            .after('destroy', function () {
                assert.equal($container.children().length, 0, 'The container is now empty');
                ready();
            })
            .on('error', function (err) {
                assert.pushResult({
                    result: false,
                    message: err
                });
                ready();
            });
    });

    QUnit.module('Tabs API');

    QUnit.test('error', function(assert) {
        var ready = assert.async();
        var $container = $('#fixture-error');
        var instance;

        assert.expect(9);

        assert.equal($container.children().length, 0, 'The container is empty');

        Promise
            .all([
                new Promise(function(resolve) {
                    getInstance($container, {tabs: {}})
                        .on('error', function() {
                            assert.ok(true, 'Wrong tabs setup');
                            resolve();
                        })
                        .on('ready', function() {
                            assert.ok(false, 'Should accept a wrong tabs setup');
                            resolve();
                        });
                }),
                new Promise(function(resolve) {
                    getInstance($container)
                        .on('ready', function() {
                            assert.throws(function() {
                                instance.setTabs({});
                            }, 'Trying to set wrong tabs');
                            resolve();
                        })
                        .on('error', resolve);
                }),
                new Promise(function(resolve) {
                    getInstance($container, {tabs: [{name: 'tab1', label: 'Tab 1'}]})
                        .on('ready', function() {
                            assert.throws(function() {
                                instance.setActiveTab('tab2');
                            }, 'Trying to activate unknown tab name');
                            resolve();
                        })
                        .on('error', resolve);
                }),
                new Promise(function(resolve) {
                    getInstance($container, {tabs: [{name: 'tab1', label: 'Tab 1'}]})
                        .on('ready', function() {
                            assert.throws(function() {
                                instance.setActiveTabIndex(2);
                            }, 'Trying to activate unknown tab index');
                            resolve();
                        })
                        .on('error', resolve);
                }),
                new Promise(function(resolve) {
                    getInstance($container, {tabs: [{name: 'tab1', label: 'Tab 1'}]})
                        .on('ready', function() {
                            assert.throws(function() {
                                instance.enableTab('tab3');
                            }, 'Trying to enable unknown tab');
                            resolve();
                        })
                        .on('error', resolve);
                }),
                new Promise(function(resolve) {
                    getInstance($container, {tabs: [{name: 'tab1', label: 'Tab 1'}]})
                        .on('ready', function() {
                            assert.throws(function() {
                                instance.disableTab('tab3');
                            }, 'Trying to disable unknown tab');
                            resolve();
                        })
                        .on('error', resolve);
                }),
                new Promise(function(resolve) {
                    getInstance($container, {tabs: [{name: 'tab1', label: 'Tab 1'}]})
                        .on('ready', function() {
                            assert.throws(function() {
                                instance.showTabContent('tab3');
                            }, 'Trying to show content of unknown tab');
                            resolve();
                        })
                        .on('error', resolve);
                })
            ])
            .catch(function (err) {
                assert.pushResult({
                    result: false,
                    message: err
                });
            })
            .then(function () {
                assert.equal($container.children().length, 0, 'The container is empty');
            })
            .then(ready);
    });

    QUnit.cases.init([{
        title: 'empty',
        config: {
            tabs: []
        },
        tabs: [
            {name: 'tabA', label: 'Tab A', icon: 'globe'},
            {name: 'tabB', label: 'Tab B', cls: 'foo'},
            {name: 'tabC', label: 'Tab C', disabled: 'true'},
            {name: 'tabD', icon: 'flag'}
        ],
        active: 'tabA',
        activeIndex: 0
    }, {
        title: 'replace tabs',
        config: {
            activeTab: 'tab2',
            tabs: [
                {name: 'tab1', label: 'Tab 1', icon: 'globe'},
                {name: 'tab2', label: 'Tab 2', cls: 'foo'},
                {name: 'tab3', label: 'Tab 3', disabled: 'true'},
                {name: 'tab4', icon: 'flag'}
            ]
        },
        active: 'tabA',
        activeIndex: 0,
        tabs: [
            {name: 'tabA', label: 'Tab A', icon: 'globe'},
            {name: 'tabB', label: 'Tab B', cls: 'foo'},
            {name: 'tabC', label: 'Tab C', disabled: 'true'},
            {name: 'tabD', icon: 'flag'},
            {name: 'tabE', label: 'Tab E', icon: 'flag', cls: 'bar'}
        ]
    }]).test('setTabs', function (data, assert) {
        var ready = assert.async();
        var $container = $('#fixture-settabs');
        var instance;

        assert.expect(10 + data.config.tabs.length + data.tabs.length * 5);
        assert.equal($container.children().length, 0, 'The container is empty');

        instance = tabsFactory($container, data.config)
            .on('init', function () {
                assert.strictEqual(this, instance, 'The instance has been initialized');
            })
            .on('ready', function () {
                assert.strictEqual($container.children().length, 1, 'The container contains an element');
                assert.strictEqual($container.children().is('.tab-group'), true, 'The container contains the expected element');
                assert.strictEqual($container.find('.tab-group .tab').length, data.config.tabs.length, 'The component contains the expected number of tabs');

                data.config.tabs.forEach(function(tab) {
                    assert.strictEqual(
                        $container.find('.tab[data-tab-name="' + tab.name + '"]').length,
                        1,
                        'The tab ' + tab.name + ' is rendered'
                    );
                });

                Promise
                    .resolve()
                    .then(function () {
                        return new Promise(function(resolve) {
                            instance
                                .off('.test')
                                .on('tabsupdate', function (newTabs) {
                                    assert.deepEqual(newTabs, data.tabs, 'The tabs has been updated');
                                    resolve();
                                })
                                .setTabs(data.tabs);
                        });
                    })
                    .then(function () {
                        assert.deepEqual(instance.getTabs(), data.tabs, 'The instance contains the expected tabs');
                        assert.deepEqual(instance.getActiveTab(), data.active, 'The expected tab name is active');
                        assert.deepEqual(instance.getActiveTabIndex(), data.activeIndex, 'The expected tab indx is active');
                        assert.strictEqual($container.find('.tab-group .tab').length, data.tabs.length, 'The component contains the expected number of tabs');

                        data.tabs.forEach(function(tab) {
                            assert.strictEqual(
                                $container.find('.tab[data-tab-name="' + tab.name + '"] .action').length,
                                1,
                                'The tab ' + tab.name + ' has an action element'
                            );
                            if (tab.cls) {
                                assert.strictEqual(
                                    $container.find('.tab[data-tab-name="' + tab.name + '"].' + tab.cls).length,
                                    1,
                                    'The tab ' + tab.name + ' is rendered with the expected class'
                                );
                            } else {
                                assert.strictEqual(
                                    $container.find('.tab[data-tab-name="' + tab.name + '"]').length,
                                    1,
                                    'The tab ' + tab.name + ' is rendered'
                                );
                            }
                            if (tab.disabled) {
                                assert.strictEqual(
                                    $container.find('.tab[data-tab-name="' + tab.name + '"] .action:disabled').length,
                                    1,
                                    'The tab ' + tab.name + ' is rendered disabled'
                                );
                            } else {
                                assert.strictEqual(
                                    $container.find('.tab[data-tab-name="' + tab.name + '"] .action:disabled').length,
                                    0,
                                    'The tab ' + tab.name + ' is rendered enabled'
                                );
                            }
                            if (tab.icon) {
                                assert.strictEqual(
                                    $container.find('.tab[data-tab-name="' + tab.name + '"] .icon-' + tab.icon).length,
                                    1,
                                    'The tab ' + tab.name + ' contains an icon'
                                );
                            } else {
                                assert.strictEqual(
                                    $container.find('.tab[data-tab-name="' + tab.name + '"] .icon').length,
                                    0,
                                    'The tab ' + tab.name + ' does not contain an icon'
                                );
                            }
                            if (tab.label) {
                                assert.strictEqual(
                                    $container.find('.tab[data-tab-name="' + tab.name + '"]').text().trim(),
                                    tab.label,
                                    'The tab ' + tab.name + ' contains the expected label'
                                );
                            } else {
                                assert.strictEqual(
                                    $container.find('.tab[data-tab-name="' + tab.name + '"]').text().trim(),
                                    '',
                                    'The tab ' + tab.name + ' does not contain a label'
                                );
                            }
                        });
                    })
                    .catch(function (err) {
                        assert.pushResult({
                            result: false,
                            message: err
                        });
                    })
                    .then(function () {
                        instance.destroy();
                    });
            })
            .on('destroy', ready)
            .on('error', function (err) {
                assert.pushResult({
                    result: false,
                    message: err
                });
                ready();
            });
    });

    QUnit.test('activate', function (assert) {
        var ready = assert.async();
        var $container = $('#fixture-activate');
        var config = {
            tabs: [
                {name: 'tabA', label: 'Tab A', icon: 'globe'},
                {name: 'tabB', label: 'Tab B', cls: 'foo'},
                {name: 'tabC', label: 'Tab C', disabled: 'true'},
                {name: 'tabD', icon: 'flag'},
                {name: 'tabE', label: 'Tab E', icon: 'flag', cls: 'bar'}
            ]
        };
        var instance;

        assert.expect(30);
        assert.equal($container.children().length, 0, 'The container is empty');

        instance = tabsFactory($container, config)
            .on('init', function () {
                assert.strictEqual(this, instance, 'The instance has been initialized');
            })
            .on('ready', function () {
                assert.strictEqual($container.children().length, 1, 'The container contains an element');
                assert.strictEqual($container.children().is('.tab-group'), true, 'The container contains the expected element');
                assert.strictEqual($container.find('.tab-group .tab').length, config.tabs.length, 'The component contains the expected number of tabs');
                assert.deepEqual(config.tabs, instance.getTabs(), 'The expected tabs are set');

                config.tabs.forEach(function(tab) {
                    assert.strictEqual(
                        $container.find('.tab[data-tab-name="' + tab.name + '"]').length,
                        1,
                        'The tab ' + tab.name + ' is rendered'
                    );
                });

                Promise
                    .resolve()
                    .then(function () {
                        var promises = [];
                        instance.off('.test');

                        assert.strictEqual(instance.getActiveTab(), instance.getDefaultActiveTab(), 'The default tab is activated');
                        assert.strictEqual(instance.getActiveTabIndex(), 0, 'The first tab is activated');
                        assert.ok($container.find('.tab.active').is('[data-tab-name="tabA"]'), 'The tab tabA is active');

                        promises.push(new Promise(function(resolve) {
                            instance.on('tabactivate.test', function (name) {
                                assert.strictEqual(name, 'tabB', 'The expected tab is being activated');
                                resolve();
                            });
                        }));

                        promises.push(new Promise(function(resolve) {
                            instance.on('tabchange.test', function (name) {
                                assert.strictEqual(name, 'tabB', 'The expected tab has been activated');
                                resolve();
                            });
                        }));

                        promises.push(new Promise(function(resolve) {
                            instance.on('tabchange-tabB.test', function () {
                                assert.ok(true, 'The event tabchange-tabB has been emitted');
                                resolve();
                            });
                        }));

                        instance.setActiveTab('tabB');

                        return Promise.all(promises);
                    })
                    .then(function () {
                        var promises = [];
                        instance.off('.test');

                        assert.strictEqual(instance.getActiveTab(), 'tabB', 'The expected tab name is activated');
                        assert.strictEqual(instance.getActiveTabIndex(), 1, 'The expected tab index is activated');
                        assert.ok($container.find('.tab.active').is('[data-tab-name="tabB"]'), 'The tab tabB is active');

                        promises.push(new Promise(function(resolve) {
                            instance.on('tabactivate.test', function (name) {
                                assert.strictEqual(name, 'tabD', 'The expected tab is being activated');
                                resolve();
                            });
                        }));

                        promises.push(new Promise(function(resolve) {
                            instance.on('tabchange.test', function (name) {
                                assert.strictEqual(name, 'tabD', 'The expected tab has been activated');
                                resolve();
                            });
                        }));

                        promises.push(new Promise(function(resolve) {
                            instance.on('tabchange-tabD.test', function () {
                                assert.ok(true, 'The event tabchange-tabD has been emitted');
                                resolve();
                            });
                        }));

                        instance.setActiveTabIndex(3);

                        return Promise.all(promises);
                    })
                    .then(function () {
                        return new Promise(function(resolve) {
                            assert.strictEqual(instance.getActiveTab(), 'tabD', 'The expected tab name is activated');
                            assert.strictEqual(instance.getActiveTabIndex(), 3, 'The expected tab index is activated');
                            assert.ok($container.find('.tab.active').is('[data-tab-name="tabD"]'), 'The tab tabD is active');

                            instance
                                .off('.test')
                                .before('tabactivate.test', function (e, name) {
                                    assert.strictEqual(name, 'tabA', 'The expected tab is being activated');
                                    window.setTimeout(resolve, 300);
                                    return Promise.reject();
                                })
                                .on('tabchange.test', function () {
                                    assert.ok(false, 'The tab should not be activated');
                                })
                                .on('tabchange-tabA.test', function () {
                                    assert.ok(false, 'The event tabchange-tabA should not be emitted');
                                })
                                .setActiveTab('tabA');
                        });
                    })
                    .then(function () {
                        assert.strictEqual(instance.getActiveTab(), 'tabD', 'The expected tab name is still activated');
                        assert.strictEqual(instance.getActiveTabIndex(), 3, 'The expected tab index is still activated');
                        assert.ok($container.find('.tab.active').is('[data-tab-name="tabD"]'), 'The tab tabD is still active');
                    })
                    .catch(function (err) {
                        assert.pushResult({
                            result: false,
                            message: err
                        });
                    })
                    .then(function () {
                        instance.destroy();
                    });
            })
            .on('destroy', ready)
            .on('error', function (err) {
                assert.pushResult({
                    result: false,
                    message: err
                });
                ready();
            });
    });

    QUnit.test('panel selector', function (assert) {
        var ready = assert.async();
        var $container = $('#fixture-panel-selector');
        var config = {
            showHideTarget: $container,
            tabs: [
                {name: 'tabA', label: 'Tab A', icon: 'globe'},
                {name: 'tabB', label: 'Tab B', cls: 'foo'},
                {name: 'tabC', label: 'Tab C', disabled: 'true'},
                {name: 'tabD', icon: 'flag'},
                {name: 'tabE', label: 'Tab E', icon: 'flag', cls: 'bar'}
            ]
        };
        var instance;

        assert.expect(37);
        assert.equal($container.children().length, 5, 'The container is empty');

        instance = tabsFactory($container, config)
            .on('init', function () {
                assert.strictEqual(this, instance, 'The instance has been initialized');
            })
            .on('ready', function () {
                assert.strictEqual($container.children().length, 6, 'The container contains an element');
                assert.strictEqual($container.children().is('.tab-group'), true, 'The container contains the expected element');
                assert.strictEqual($container.find('.tab-group .tab').length, config.tabs.length, 'The component contains the expected number of tabs');
                assert.deepEqual(config.tabs, instance.getTabs(), 'The expected tabs are set');
                assert.strictEqual($container.find('.panel').length, config.tabs.length, 'The expected number of panels is there');

                config.tabs.forEach(function(tab) {
                    assert.strictEqual(
                        $container.find('.tab[data-tab-name="' + tab.name + '"]').length,
                        1,
                        'The tab ' + tab.name + ' is rendered'
                    );
                });

                Promise
                    .resolve()
                    .then(function () {
                        var promises = [];
                        instance.off('.test');

                        assert.strictEqual(instance.getActiveTab(), instance.getDefaultActiveTab(), 'The default tab is activated');
                        assert.strictEqual(instance.getActiveTabIndex(), 0, 'The first tab is activated');
                        assert.ok($container.find('.tab.active').is('[data-tab-name="tabA"]'), 'The tab tabA is active');

                        assert.strictEqual($container.find('.panel:visible').length, 1, 'Only one panel is visible');
                        assert.strictEqual($container.find('.panel[data-tab-content="tabA"]:visible').length, 1, 'The expected panel is visible');

                        promises.push(new Promise(function(resolve) {
                            instance.on('tabactivate.test', function (name) {
                                assert.strictEqual(name, 'tabB', 'The expected tab is being activated');
                                resolve();
                            });
                        }));

                        promises.push(new Promise(function(resolve) {
                            instance.on('tabchange.test', function (name) {
                                assert.strictEqual(name, 'tabB', 'The expected tab has been activated');
                                resolve();
                            });
                        }));

                        instance.setActiveTab('tabB');

                        return Promise.all(promises);
                    })
                    .then(function () {
                        var promises = [];
                        instance.off('.test');

                        assert.strictEqual(instance.getActiveTab(), 'tabB', 'The expected tab name is activated');
                        assert.strictEqual(instance.getActiveTabIndex(), 1, 'The expected tab index is activated');
                        assert.ok($container.find('.tab.active').is('[data-tab-name="tabB"]'), 'The tab tabB is active');

                        assert.strictEqual($container.find('.panel:visible').length, 1, 'Only one panel is visible');
                        assert.strictEqual($container.find('.panel[data-tab-content="tabB"]:visible').length, 1, 'The expected panel is visible');

                        promises.push(new Promise(function(resolve) {
                            instance.on('tabactivate.test', function (name) {
                                assert.strictEqual(name, 'tabD', 'The expected tab is being activated');
                                resolve();
                            });
                        }));

                        promises.push(new Promise(function(resolve) {
                            instance.on('tabchange.test', function (name) {
                                assert.strictEqual(name, 'tabD', 'The expected tab has been activated');
                                resolve();
                            });
                        }));

                        instance.setActiveTabIndex(3);

                        return Promise.all(promises);
                    })
                    .then(function () {
                        return new Promise(function(resolve) {
                            assert.strictEqual(instance.getActiveTab(), 'tabD', 'The expected tab name is activated');
                            assert.strictEqual(instance.getActiveTabIndex(), 3, 'The expected tab index is activated');
                            assert.ok($container.find('.tab.active').is('[data-tab-name="tabD"]'), 'The tab tabD is active');

                            assert.strictEqual($container.find('.panel:visible').length, 1, 'Only one panel is visible');
                            assert.strictEqual($container.find('.panel[data-tab-content="tabD"]:visible').length, 1, 'The expected panel is visible');

                            instance
                                .off('.test')
                                .before('tabactivate.test', function (e, name) {
                                    assert.strictEqual(name, 'tabA', 'The expected tab is being activated');
                                    window.setTimeout(resolve, 300);
                                    return Promise.reject();
                                })
                                .on('tabchange.test', function () {
                                    assert.ok(false, 'The tab should not be activated');
                                })
                                .setActiveTab('tabA');
                        });
                    })
                    .then(function () {
                        assert.strictEqual(instance.getActiveTab(), 'tabD', 'The expected tab name is still activated');
                        assert.strictEqual(instance.getActiveTabIndex(), 3, 'The expected tab index is still activated');
                        assert.ok($container.find('.tab.active').is('[data-tab-name="tabD"]'), 'The tab tabD is still active');

                        assert.strictEqual($container.find('.panel:visible').length, 1, 'Only one panel is visible');
                        assert.strictEqual($container.find('.panel[data-tab-content="tabD"]:visible').length, 1, 'The expected panel is still visible');
                    })
                    .catch(function (err) {
                        assert.pushResult({
                            result: false,
                            message: err
                        });
                    })
                    .then(function () {
                        instance.destroy();
                    });
            })
            .on('destroy', ready)
            .on('error', function (err) {
                assert.pushResult({
                    result: false,
                    message: err
                });
                ready();
            });
    });

    QUnit.test('panel true', function (assert) {
        var ready = assert.async();
        var $container = $('#fixture-panel-true');
        var config = {
            showHideTarget: true,
            tabs: [
                {name: 'tabA', label: 'Tab A', icon: 'globe'},
                {name: 'tabB', label: 'Tab B', cls: 'foo'},
                {name: 'tabC', label: 'Tab C', disabled: 'true'},
                {name: 'tabD', icon: 'flag'},
                {name: 'tabE', label: 'Tab E', icon: 'flag', cls: 'bar'}
            ]
        };
        var instance;

        assert.expect(37);
        assert.equal($container.children().length, 5, 'The container is empty');

        instance = tabsFactory($container, config)
            .on('init', function () {
                assert.strictEqual(this, instance, 'The instance has been initialized');
            })
            .on('ready', function () {
                assert.strictEqual($container.children().length, 6, 'The container contains an element');
                assert.strictEqual($container.children().is('.tab-group'), true, 'The container contains the expected element');
                assert.strictEqual($container.find('.tab-group .tab').length, config.tabs.length, 'The component contains the expected number of tabs');
                assert.deepEqual(config.tabs, instance.getTabs(), 'The expected tabs are set');
                assert.strictEqual($container.find('.panel').length, config.tabs.length, 'The expected number of panels is there');

                config.tabs.forEach(function(tab) {
                    assert.strictEqual(
                        $container.find('.tab[data-tab-name="' + tab.name + '"]').length,
                        1,
                        'The tab ' + tab.name + ' is rendered'
                    );
                });

                Promise
                    .resolve()
                    .then(function () {
                        var promises = [];
                        instance.off('.test');

                        assert.strictEqual(instance.getActiveTab(), instance.getDefaultActiveTab(), 'The default tab is activated');
                        assert.strictEqual(instance.getActiveTabIndex(), 0, 'The first tab is activated');
                        assert.ok($container.find('.tab.active').is('[data-tab-name="tabA"]'), 'The tab tabA is active');

                        assert.strictEqual($container.find('.panel:visible').length, 1, 'Only one panel is visible');
                        assert.strictEqual($container.find('.panel[data-tab-content="tabA"]:visible').length, 1, 'The expected panel is visible');

                        promises.push(new Promise(function(resolve) {
                            instance.on('tabactivate.test', function (name) {
                                assert.strictEqual(name, 'tabB', 'The expected tab is being activated');
                                resolve();
                            });
                        }));

                        promises.push(new Promise(function(resolve) {
                            instance.on('tabchange.test', function (name) {
                                assert.strictEqual(name, 'tabB', 'The expected tab has been activated');
                                resolve();
                            });
                        }));

                        instance.setActiveTab('tabB');

                        return Promise.all(promises);
                    })
                    .then(function () {
                        var promises = [];
                        instance.off('.test');

                        assert.strictEqual(instance.getActiveTab(), 'tabB', 'The expected tab name is activated');
                        assert.strictEqual(instance.getActiveTabIndex(), 1, 'The expected tab index is activated');
                        assert.ok($container.find('.tab.active').is('[data-tab-name="tabB"]'), 'The tab tabB is active');

                        assert.strictEqual($container.find('.panel:visible').length, 1, 'Only one panel is visible');
                        assert.strictEqual($container.find('.panel[data-tab-content="tabB"]:visible').length, 1, 'The expected panel is visible');

                        promises.push(new Promise(function(resolve) {
                            instance.on('tabactivate.test', function (name) {
                                assert.strictEqual(name, 'tabD', 'The expected tab is being activated');
                                resolve();
                            });
                        }));

                        promises.push(new Promise(function(resolve) {
                            instance.on('tabchange.test', function (name) {
                                assert.strictEqual(name, 'tabD', 'The expected tab has been activated');
                                resolve();
                            });
                        }));

                        instance.setActiveTabIndex(3);

                        return Promise.all(promises);
                    })
                    .then(function () {
                        return new Promise(function(resolve) {
                            assert.strictEqual(instance.getActiveTab(), 'tabD', 'The expected tab name is activated');
                            assert.strictEqual(instance.getActiveTabIndex(), 3, 'The expected tab index is activated');
                            assert.ok($container.find('.tab.active').is('[data-tab-name="tabD"]'), 'The tab tabD is active');

                            assert.strictEqual($container.find('.panel:visible').length, 1, 'Only one panel is visible');
                            assert.strictEqual($container.find('.panel[data-tab-content="tabD"]:visible').length, 1, 'The expected panel is visible');

                            instance
                                .off('.test')
                                .before('tabactivate.test', function (e, name) {
                                    assert.strictEqual(name, 'tabA', 'The expected tab is being activated');
                                    window.setTimeout(resolve, 300);
                                    return Promise.reject();
                                })
                                .on('tabchange.test', function () {
                                    assert.ok(false, 'The tab should not be activated');
                                })
                                .setActiveTab('tabA');
                        });
                    })
                    .then(function () {
                        assert.strictEqual(instance.getActiveTab(), 'tabD', 'The expected tab name is still activated');
                        assert.strictEqual(instance.getActiveTabIndex(), 3, 'The expected tab index is still activated');
                        assert.ok($container.find('.tab.active').is('[data-tab-name="tabD"]'), 'The tab tabD is still active');

                        assert.strictEqual($container.find('.panel:visible').length, 1, 'Only one panel is visible');
                        assert.strictEqual($container.find('.panel[data-tab-content="tabD"]:visible').length, 1, 'The expected panel is still visible');
                    })
                    .catch(function (err) {
                        assert.pushResult({
                            result: false,
                            message: err
                        });
                    })
                    .then(function () {
                        instance.destroy();
                    });
            })
            .on('destroy', ready)
            .on('error', function (err) {
                assert.pushResult({
                    result: false,
                    message: err
                });
                ready();
            });
    });

    QUnit.test('click', function (assert) {
        var ready = assert.async();
        var $container = $('#fixture-click');
        var config = {
            tabs: [
                {name: 'tabA', label: 'Tab A', icon: 'globe'},
                {name: 'tabB', label: 'Tab B', cls: 'foo'},
                {name: 'tabC', label: 'Tab C', disabled: 'true'},
                {name: 'tabD', icon: 'flag'},
                {name: 'tabE', label: 'Tab E', icon: 'flag', cls: 'bar'}
            ]
        };
        var instance;

        assert.expect(33);
        assert.equal($container.children().length, 0, 'The container is empty');

        instance = tabsFactory($container, config)
            .on('init', function () {
                assert.strictEqual(this, instance, 'The instance has been initialized');
            })
            .on('ready', function () {
                assert.strictEqual($container.children().length, 1, 'The container contains an element');
                assert.strictEqual($container.children().is('.tab-group'), true, 'The container contains the expected element');
                assert.strictEqual($container.find('.tab-group .tab').length, config.tabs.length, 'The component contains the expected number of tabs');
                assert.deepEqual(config.tabs, instance.getTabs(), 'The expected tabs are set');

                config.tabs.forEach(function(tab) {
                    assert.strictEqual(
                        $container.find('.tab[data-tab-name="' + tab.name + '"]').length,
                        1,
                        'The tab ' + tab.name + ' is rendered'
                    );
                });

                Promise
                    .resolve()
                    .then(function () {
                        var promises = [];
                        instance.off('.test');

                        assert.strictEqual(instance.getActiveTab(), instance.getDefaultActiveTab(), 'The default tab is activated');
                        assert.strictEqual(instance.getActiveTabIndex(), 0, 'The first tab is activated');
                        assert.ok($container.find('.tab.active').is('[data-tab-name="tabA"]'), 'The tab tabA is active');

                        promises.push(new Promise(function(resolve) {
                            instance.on('tabactivate.test', function (name) {
                                assert.strictEqual(name, 'tabB', 'The expected tab is being activated');
                                resolve();
                            });
                        }));

                        promises.push(new Promise(function(resolve) {
                            instance.on('tabchange.test', function (name) {
                                assert.strictEqual(name, 'tabB', 'The expected tab has been activated');
                                resolve();
                            });
                        }));

                        promises.push(new Promise(function(resolve) {
                            instance.on('tabchange-tabB.test', function () {
                                assert.ok(true, 'The event tabchange-tabB has been emitted');
                                resolve();
                            });
                        }));

                        $container.find('[data-tab-name="tabB"]').click();

                        return Promise.all(promises);
                    })
                    .then(function () {
                        var promises = [];
                        instance.off('.test');

                        assert.strictEqual(instance.getActiveTab(), 'tabB', 'The expected tab name is activated');
                        assert.strictEqual(instance.getActiveTabIndex(), 1, 'The expected tab index is activated');
                        assert.ok($container.find('.tab.active').is('[data-tab-name="tabB"]'), 'The tab tabB is active');

                        promises.push(new Promise(function(resolve) {
                            instance.on('tabactivate.test', function (name) {
                                assert.strictEqual(name, 'tabD', 'The expected tab is being activated');
                                resolve();
                            });
                        }));

                        promises.push(new Promise(function(resolve) {
                            instance.on('tabchange.test', function (name) {
                                assert.strictEqual(name, 'tabD', 'The expected tab has been activated');
                                resolve();
                            });
                        }));

                        promises.push(new Promise(function(resolve) {
                            instance.on('tabchange-tabD.test', function () {
                                assert.ok(true, 'The event tabchange-tabD has been emitted');
                                resolve();
                            });
                        }));

                        $container.find('[data-tab-name="tabD"] .icon').click();

                        return Promise.all(promises);
                    })
                    .then(function () {
                        return new Promise(function(resolve) {
                            assert.strictEqual(instance.getActiveTab(), 'tabD', 'The expected tab name is activated');
                            assert.strictEqual(instance.getActiveTabIndex(), 3, 'The expected tab index is activated');
                            assert.ok($container.find('.tab.active').is('[data-tab-name="tabD"]'), 'The tab tabD is active');

                            instance
                                .off('.test')
                                .on('tabactivate.test', function () {
                                    assert.ok(false, 'The tab should not be activating');
                                })
                                .on('tabchange.test', function () {
                                    assert.ok(false, 'The tab should not be activated');
                                })
                                .on('tabchange-tabC.test', function () {
                                    assert.ok(false, 'The event tabchange-tabC should not be emitted');
                                });

                            window.setTimeout(resolve, 300);

                            $container.find('[data-tab-name="tabC"] .action').click();
                        });
                    })
                    .then(function () {
                        return new Promise(function(resolve) {
                            assert.strictEqual(instance.getActiveTab(), 'tabD', 'The expected tab name is activated');
                            assert.strictEqual(instance.getActiveTabIndex(), 3, 'The expected tab index is activated');
                            assert.ok($container.find('.tab.active').is('[data-tab-name="tabD"]'), 'The tab tabD is active');

                            instance
                                .off('.test')
                                .before('tabactivate.test', function (e, name) {
                                    assert.strictEqual(name, 'tabA', 'The expected tab is being activated');
                                    window.setTimeout(resolve, 300);
                                    return Promise.reject();
                                })
                                .on('tabchange.test', function () {
                                    assert.ok(false, 'The tab should not be activated');
                                })
                                .on('tabchange-tabA.test', function () {
                                    assert.ok(false, 'The event tabchange-tabA should not be emitted');
                                });

                            $container.find('[data-tab-name="tabA"] .label').click();
                        });
                    })
                    .then(function () {
                        assert.strictEqual(instance.getActiveTab(), 'tabD', 'The expected tab name is still activated');
                        assert.strictEqual(instance.getActiveTabIndex(), 3, 'The expected tab index is still activated');
                        assert.ok($container.find('.tab.active').is('[data-tab-name="tabD"]'), 'The tab tabD is still active');
                    })
                    .catch(function (err) {
                        assert.pushResult({
                            result: false,
                            message: err
                        });
                    })
                    .then(function () {
                        instance.destroy();
                    });
            })
            .on('destroy', ready)
            .on('error', function (err) {
                assert.pushResult({
                    result: false,
                    message: err
                });
                ready();
            });
    });

    QUnit.module('Tabs Visual');

    QUnit.test('Visual test', function (assert) {
        var ready = assert.async();
        var config = {
            showHideTarget: '#visual-fixture .panels',
            tabs: [
                {label: 'TAO Local', name: 'tao-local'},
                {label: 'TAO Remote', name: 'tao-remote', icon: 'globe'},
                {label: 'LTI-based', name: 'lti-based', disabled: true}
            ]
        };

        assert.expect(1);
        tabsFactory('#visual-fixture nav', config)
            .on('ready', function () {
                assert.ok(true, 'visual test ran');
                ready();
            })
            .on('tabchange', function (name) {
                $('#visual-fixture .output').html('tabchange event for Tab <strong>' + name + '</strong>');
            })
            .on('error', function (err) {
                assert.pushResult({
                    result: false,
                    message: err
                });
                ready();
            });
    });

});
