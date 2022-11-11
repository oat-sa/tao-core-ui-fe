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
 * @author Jean-Sébastien Conan <jean-sebastien@taotesting.com>
 */
define([
    'jquery',
    'lodash',
    'ui/form/widget/widget',
    'ui/form/widget/providers/textBox',
    'ui/form/widget/providers/hidden'
], function (
    $,
    _,
    widgetFactory,
    widgetTextBoxProvider,
    widgetHiddenProvider
) {
    'use strict';

    widgetFactory.registerProvider('text', widgetTextBoxProvider);
    widgetFactory.registerProvider('hidden', widgetHiddenProvider);

    QUnit.module('Factory');

    QUnit.test('module', function (assert) {
        function getInstance() {
            return widgetFactory('#fixture-api', {widget: 'hidden', uri: 'foo'})
                .on('ready', function () {
                    this.destroy();
                });
        }

        assert.expect(3);

        assert.equal(typeof widgetFactory, 'function', 'The module exposes a function');
        assert.equal(typeof getInstance(), 'object', 'The factory produces an object');
        assert.notStrictEqual(getInstance(), getInstance(), 'The factory provides a different object on each call');
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
    ]).test('inherited API ', function (data, assert) {
        var instance = widgetFactory('#fixture-api', {widget: 'hidden', uri: 'foo'})
            .on('ready', function () {
                this.destroy();
            });
        assert.expect(1);
        assert.equal(typeof instance[data.title], 'function', `The instance exposes a "${  data.title  }" function`);
    });

    QUnit.cases.init([
        {title: 'on'},
        {title: 'off'},
        {title: 'trigger'},
        {title: 'spread'}
    ]).test('event API ', function (data, assert) {
        var instance = widgetFactory('#fixture-api', {widget: 'hidden', uri: 'foo'})
            .on('ready', function () {
                this.destroy();
            });
        assert.expect(1);
        assert.equal(typeof instance[data.title], 'function', `The instance exposes a "${  data.title  }" function`);
    });

    QUnit.cases.init([
        {title: 'getUri'},
        {title: 'getValue'},
        {title: 'getRawValue'},
        {title: 'setValue'},
        {title: 'reset'},
        {title: 'validate'},
        {title: 'getWidgetElement'}
    ]).test('component API ', function (data, assert) {
        var instance = widgetFactory('#fixture-api', {widget: 'hidden', uri: 'foo'})
            .on('ready', function () {
                this.destroy();
            });
        assert.expect(1);
        assert.equal(typeof instance[data.title], 'function', `The instance exposes a "${  data.title  }" function`);
    });

    QUnit.module('Life cycle');

    QUnit.cases.init([{
        title: 'missing config'
    }, {
        title: 'bad config type',
        config: 'widget'
    }, {
        title: 'missing uri',
        config: {
            widget: 'hidden'
        }
    }, {
        title: 'empty uri',
        config: {
            widget: 'hidden',
            uri: ''
        }
    }, {
        title: 'missing type',
        config: {
            uri: 'foo'
        }
    }, {
        title: 'empty type',
        config: {
            widget: '',
            uri: 'foo'
        }
    }]).test('error ', function (data, assert) {
        var $container = $('#fixture-error');

        assert.expect(1);

        assert.throws(function() {
            widgetFactory($container, data.config);
        }, 'The factory should raise an error');
    });

    QUnit.test('init default', function (assert) {
        var ready = assert.async();
        var $container = $('#fixture-init');
        var instance = widgetFactory($container, {widget: 'hidden', uri: 'foo'});

        assert.expect(1);

        instance
            .after('init', function () {
                assert.equal(this, instance, 'The instance has been initialized');
            })
            .on('ready', function () {
                this.destroy();
            })
            .on('destroy', function () {
                ready();
            })
            .on('error', function (err) {
                assert.ok(false, 'The operation should not fail!');
                assert.pushResult({
                    result: false,
                    message: err
                });
                ready();
            });
    });

    QUnit.test('render', function (assert) {
        var ready = assert.async();
        var $container = $('#fixture-render');
        var config = {
            widget: 'hidden',
            uri: 'foo',
            label: 'Foo',
            value: 10
        };
        var instance;

        assert.expect(6);

        assert.equal($container.children().length, 0, 'The container is empty');

        instance = widgetFactory($container, config)
            .on('init', function () {
                assert.equal(this, instance, 'The instance has been initialized');
            })
            .on('ready', function () {
                assert.equal($container.children().length, 1, 'The container contains an element');
                assert.equal($container.children().is('input[type="hidden"]'), true, 'The container contains the expected element');
                assert.equal($container.find('input[type="hidden"]').attr('name'), config.uri, 'The component contains the expected field');
                assert.equal($container.find('input[type="hidden"]').val(), config.value, 'The component contains the expected value');

                this.destroy();
            })
            .on('destroy', function () {
                ready();
            })
            .on('error', function (err) {
                assert.ok(false, 'The operation should not fail!');
                assert.pushResult({
                    result: false,
                    message: err
                });
                ready();
            });
    });

    QUnit.test('show', function (assert) {
        var ready = assert.async();
        var $container = $('#fixture-show');
        var config = {
            widget: 'hidden',
            uri: 'foo',
            label: 'Foo',
            value: 10
        };
        var instance;

        assert.expect(8);

        assert.equal($container.children().length, 0, 'The container is empty');

        instance = widgetFactory($container, config)
            .on('init', function () {
                assert.equal(this, instance, 'The instance has been initialized');
            })
            .on('ready', function () {
                assert.equal($container.children().length, 1, 'The container contains an element');
                assert.equal($container.children().is('input[type="hidden"]'), true, 'The container contains the expected element');
                assert.equal($container.find('input[type="hidden"]').attr('name'), config.uri, 'The component contains the expected field');

                assert.equal($container.find('input[type="hidden"]:visible').length, 0, 'The component is not visible');

                instance.hide();
                assert.equal($container.find('input[type="hidden"]:visible').length, 0, 'The component is hidden');

                instance.show();
                assert.equal($container.find('input[type="hidden"]:visible').length, 0, 'The component is still not visible');

                instance.destroy();
            })
            .on('destroy', function () {
                ready();
            })
            .on('error', function (err) {
                assert.ok(false, 'The operation should not fail!');
                assert.pushResult({
                    result: false,
                    message: err
                });
                ready();
            });
    });

    QUnit.test('enable', function (assert) {
        var ready = assert.async();
        var $container = $('#fixture-enable');
        var config = {
            widget: 'hidden',
            uri: 'foo',
            label: 'Foo',
            value: 10
        };
        var instance;

        assert.expect(8);

        assert.equal($container.children().length, 0, 'The container is empty');

        instance = widgetFactory($container, config)
            .on('init', function () {
                assert.equal(this, instance, 'The instance has been initialized');
            })
            .on('ready', function () {
                Promise.resolve()
                    .then(function () {
                        assert.equal($container.children().length, 1, 'The container contains an element');
                        assert.equal($container.children().is('input[type="hidden"]'), true, 'The container contains the expected element');
                        assert.equal($container.find('input[type="hidden"]').attr('name'), config.uri, 'The component contains the expected field');

                        assert.equal($container.find('input[type="hidden"]:enabled').length, 1, 'The field is enabled');
                    })
                    .then(function () {
                        return new Promise(function (resolve) {
                            instance
                                .off('.test')
                                .after('disable.test', function () {
                                    assert.equal($container.find('input[type="hidden"]:enabled').length, 0, 'The field is disabled');
                                    resolve();
                                })
                                .disable();
                        });
                    })
                    .then(function () {
                        return new Promise(function (resolve) {
                            instance
                                .off('.test')
                                .after('enable.test', function () {
                                    assert.equal($container.find('input[type="hidden"]:enabled').length, 1, 'The field is enabled again');
                                    resolve();
                                })
                                .enable();
                        });
                    })
                    .catch(function (err) {
                        assert.ok(false, 'The operation should not fail!');
                        assert.pushResult({
                            result: false,
                            message: err
                        });
                    })
                    .then(function () {
                        instance
                            .off('.test')
                            .destroy();
                    });
            })
            .on('destroy', function () {
                ready();
            })
            .on('error', function (err) {
                assert.ok(false, 'The operation should not fail!');
                assert.pushResult({
                    result: false,
                    message: err
                });
                ready();
            });
    });

    QUnit.test('destroy', function (assert) {
        var ready = assert.async();
        var $container = $('#fixture-destroy');
        var instance;

        assert.expect(4);

        assert.equal($container.children().length, 0, 'The container is empty');

        instance = widgetFactory($container, {widget: 'hidden', uri: 'foo'})
            .on('init', function () {
                assert.equal(this, instance, 'The instance has been initialized');
            })
            .on('ready', function () {
                assert.equal($container.children().length, 1, 'The container contains an element');
                this.destroy();
            })
            .after('destroy', function () {
                assert.equal($container.children().length, 0, 'The container is now empty');
                ready();
            })
            .on('error', function (err) {
                assert.ok(false, 'The operation should not fail!');
                assert.pushResult({
                    result: false,
                    message: err
                });
                ready();
            });
    });

    QUnit.module('API');

    QUnit.test('properties', function (assert) {
        var ready = assert.async();
        var $container = $('#fixture-properties');
        var config = {
            widget: 'hidden',
            uri: 'foo',
            value: 'bar'
        };
        var instance;

        assert.expect(6);

        instance = widgetFactory($container, config)
            .on('init', function () {
                assert.equal(this, instance, 'The instance has been initialized');
                assert.equal(this.getUri(), config.uri, 'The expected uri is returned');
                assert.equal(this.getValue(), config.value, 'The expected value is returned');
                assert.equal(this.getRawValue(), config.value, 'The expected raw value is returned');
                assert.equal(this.getWidgetElement(), null, 'There is no form element yet');
            })
            .on('ready', function () {
                assert.ok(this.getWidgetElement().is($container.find(`[name="${  config.uri  }"]`)), 'The expected form element is returned');
                this.destroy();
            })
            .after('destroy', function () {
                ready();
            })
            .on('error', function (err) {
                assert.ok(false, 'The operation should not fail!');
                assert.pushResult({
                    result: false,
                    message: err
                });
                ready();
            });
    });

    QUnit.test('change', function (assert) {
        var ready = assert.async();
        var $container = $('#fixture-change');
        var instance;

        assert.expect(15);

        assert.equal($container.children().length, 0, 'The container is empty');

        instance = widgetFactory($container, {widget: 'hidden', uri: 'foo'})
            .on('init', function () {
                assert.equal(this, instance, 'The instance has been initialized');
            })
            .on('ready', function () {
                Promise.resolve()
                    .then(function () {
                        assert.equal($container.children().length, 1, 'The container contains an element');
                        assert.equal($container.children().is('input[type="hidden"]'), true, 'The container contains the expected element');
                        assert.equal($container.find('input[type="hidden"]').attr('name'), 'foo', 'The component contains the expected field');
                        assert.equal(instance.getValue(), '', 'Empty value');
                        assert.equal(instance.getRawValue(), '', 'Empty raw value');

                        return new Promise(function (resolve) {
                            instance
                                .off('.test')
                                .on('change.test', function (value, uri) {
                                    assert.equal(uri, 'foo', 'The change event has been triggered');
                                    assert.equal(value, 'test', 'The expected value is there');
                                    resolve();
                                })
                                .setValue('test');
                        });
                    })
                    .then(function () {
                        return new Promise(function (resolve) {
                            assert.equal(instance.getValue(), 'test', 'The value is set');
                            assert.equal(instance.getRawValue(), 'test', 'The raw value is set');
                            instance
                                .off('.test')
                                .on('change.test', function (value, uri) {
                                    assert.equal(uri, 'foo', 'The change event has been triggered');
                                    assert.equal(value, 'top', 'The expected value is there');
                                    resolve();
                                });

                            $container.find('input[type="hidden"]').val('top').change();
                        });
                    })
                    .then(function () {
                        return new Promise(function (resolve) {
                            instance
                                .off('.test')
                                .on('change.test', function () {
                                    assert.ok(false, 'The change event should not be triggered');
                                    resolve();
                                });

                            _.delay(function() {
                                instance.off('.test');
                                assert.ok(true, 'The change event has not been triggered');
                                resolve();
                            }, 200);

                            $container.find('input[type="hidden"]').change();
                        });
                    })
                    .then(function () {
                        return new Promise(function (resolve) {
                            instance
                                .off('.test')
                                .on('change.test', function () {
                                    assert.ok(false, 'The change event should not be triggered');
                                    resolve();
                                });

                            _.delay(function() {
                                instance.off('.test');
                                assert.ok(true, 'The change event has not been triggered');
                                resolve();
                            }, 200);

                            $container.find('input[type="hidden"]').blur();
                        });
                    })
                    .catch(function (err) {
                        assert.ok(false, 'The operation should not fail!');
                        assert.pushResult({
                            result: false,
                            message: err
                        });
                    })
                    .then(function () {
                        instance
                            .off('.test')
                            .destroy();
                    });
            })
            .on('destroy', function () {
                ready();
            })
            .on('error', function (err) {
                assert.ok(false, 'The operation should not fail!');
                assert.pushResult({
                    result: false,
                    message: err
                });
                ready();
            });
    });

    QUnit.test('values', function (assert) {
        var ready = assert.async();
        var $container = $('#fixture-value');
        var instance;

        assert.expect(10);

        assert.equal($container.children().length, 0, 'The container is empty');

        instance = widgetFactory($container, {widget: 'hidden', uri: 'foo', value: 'bar'})
            .on('init', function () {
                assert.equal(this, instance, 'The instance has been initialized');
            })
            .on('ready', function () {
                Promise.resolve()
                    .then(function () {
                        assert.equal($container.children().length, 1, 'The container contains an element');
                        assert.equal($container.children().is('input[type="hidden"]'), true, 'The container contains the expected element');
                        assert.equal($container.find('input[type="hidden"]').attr('name'), 'foo', 'The component contains the expected field');
                        assert.equal(instance.getValue(), 'bar', 'Init value');
                        assert.equal(instance.getRawValue(), 'bar', 'Init raw value');

                        return new Promise(function (resolve) {
                            instance
                                .off('.test')
                                .on('change.test', function (value, uri) {
                                    assert.equal(uri, 'foo', 'The change event has been triggered');
                                    assert.equal(value, 'test', 'The expected value is there');
                                    assert.equal(this.getRawValue(), value, 'The expected raw value is there');
                                    resolve();
                                })
                                .setValue('test');
                        });
                    })
                    .catch(function (err) {
                        assert.ok(false, 'The operation should not fail!');
                        assert.pushResult({
                            result: false,
                            message: err
                        });
                    })
                    .then(function () {
                        instance
                            .off('.test')
                            .destroy();
                    });
            })
            .on('destroy', function () {
                ready();
            })
            .on('error', function (err) {
                assert.ok(false, 'The operation should not fail!');
                assert.pushResult({
                    result: false,
                    message: err
                });
                ready();
            });
    });

    QUnit.test('validate', function (assert) {
        var ready = assert.async();
        var $container = $('#fixture-validate');
        var instance;

        assert.expect(7);

        assert.equal($container.children().length, 0, 'The container is empty');

        instance = widgetFactory($container, {widget: 'hidden', uri: 'foo'})
            .on('init', function () {
                assert.equal(this, instance, 'The instance has been initialized');
            })
            .on('ready', function () {
                assert.equal($container.children().length, 1, 'The container contains an element');
                assert.equal($container.children().is('input[type="hidden"]'), true, 'The container contains the expected element');
                assert.equal($container.find('input[type="hidden"]').attr('name'), 'foo', 'The component contains the expected field');

                instance.validate()
                    .then(function () {
                        assert.ok(true, 'The field is valid');
                    })
                    .catch(function () {
                        assert.ok(false, 'The form should be valid');
                    })
                    .then(function () {
                        instance.setValidator({
                            id: 'required',
                            predicate: function() {
                                return false;
                            }
                        });
                        return instance.validate()
                            .then(function () {
                                assert.ok(false, 'The form should not be valid');
                            })
                            .catch(function () {
                                assert.ok(true, 'The form has been rejected');
                            });
                    })
                    .catch(function (err) {
                        assert.ok(false, 'The operation should not fail!');
                        assert.pushResult({
                            result: false,
                            message: err
                        });
                    })
                    .then(function () {
                        instance.destroy();
                    });
            })
            .on('destroy', function () {
                ready();
            })
            .on('error', function (err) {
                assert.ok(false, 'The operation should not fail!');
                assert.pushResult({
                    result: false,
                    message: err
                });
                ready();
            });
    });

    QUnit.test('reset', function (assert) {
        var ready = assert.async();
        var $container = $('#fixture-reset');
        var instance;

        assert.expect(11);

        assert.equal($container.children().length, 0, 'The container is empty');

        instance = widgetFactory($container, {widget: 'hidden', uri: 'foo', value: 'bar'})
            .on('init', function () {
                assert.equal(this, instance, 'The instance has been initialized');
            })
            .on('ready', function () {
                Promise.resolve()
                    .then(function () {
                        assert.equal($container.children().length, 1, 'The container contains an element');
                        assert.equal($container.children().is('input[type="hidden"]'), true, 'The container contains the expected element');
                        assert.equal($container.find('input[type="hidden"]').attr('name'), 'foo', 'The component contains the expected field');
                        assert.equal(instance.getValue(), 'bar', 'Init value');
                        assert.equal(instance.getRawValue(), 'bar', 'Init raw value');

                        return new Promise(function (resolve) {
                            instance
                                .off('.test')
                                .on('change.test', function (value, uri) {
                                    assert.equal(uri, 'foo', 'The change event has been triggered');
                                    assert.equal(value, '', 'The expected value is there');
                                    resolve();
                                })
                                .reset();
                        });
                    })
                    .then(function () {
                        assert.equal(instance.getValue(), '', 'The value has been reset');
                        assert.equal(instance.getRawValue(), '', 'The raw value has been reset');
                    })
                    .catch(function (err) {
                        assert.ok(false, 'The operation should not fail!');
                        assert.pushResult({
                            result: false,
                            message: err
                        });
                    })
                    .then(function () {
                        instance
                            .off('.test')
                            .destroy();
                    });
            })
            .on('destroy', function () {
                ready();
            })
            .on('error', function (err) {
                assert.ok(false, 'The operation should not fail!');
                assert.pushResult({
                    result: false,
                    message: err
                });
                ready();
            });
    });

    QUnit.module('Visual');

    QUnit.test('Visual test', function (assert) {
        var ready = assert.async();
        var $container = $('#visual-test .test');
        var $outputChange = $('#visual-test .change-output');
        var visible = widgetFactory($container, {
            widget: 'text',
            uri: 'visibleFoo',
            value: 'bar',
            label: 'Visible field'
        });
        var hidden = widgetFactory($container, {
            widget: 'hidden',
            uri: 'hiddenFoo',
            value: ''
        });

        assert.expect(2);

        assert.equal($container.children().length, 0, 'The container is empty');
        Promise.all([
            new Promise(function(resolve) {
                visible
                    .on('ready', resolve)
                    .on('change', function (value, uri) {
                        $outputChange.val(`value of [${  uri  }] changed to "${  value  }"\n${  $outputChange.val()}`);
                        hidden.setValue(`hidden ${value}`);
                    });
            }),
            new Promise(function(resolve) {
                hidden
                    .on('ready', resolve)
                    .on('change', function (value, uri) {
                        $outputChange.val(`value of [${  uri  }] changed to "${  value  }"\n${  $outputChange.val()}`);
                    });
            })
        ])
            .catch(function(err) {
                assert.ok(false, 'The operation should not fail!');
                assert.pushResult({
                    result: false,
                    message: err
                });
            })
            .then(function() {
                assert.equal($container.children().length, 2, 'The container contains an element');
                ready();
            });
    });
});
