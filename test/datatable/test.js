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
 * Copyright (c) 2019-2020 (original work) Open Assessment Technologies SA ;
 */

define([
    'jquery',
    'lodash',
    'json!test/ui/datatable/data.json',
    'json!test/ui/datatable/largedata.json',
    'ui/datatable',
    'jquery.mockjax'
], function($, _, dataset, largeDataset) {
    'use strict';

    $.mockjaxSettings.logger = null;
    $.mockjaxSettings.responseTime = 1;

    QUnit.testDone(function() {
        $.mockjax.clear();
    });

    QUnit.module('DataTable Test', {
        afterEach: function(assert) {
            //Reset the container
            $('#container-1').empty().off('.datatable');
        }
    });

    QUnit.test('Plugin', function(assert) {
        assert.expect(1);
        assert.ok(typeof $.fn.datatable === 'function', 'The datatable plugin is registered');
    });

    QUnit.test('Initialization', function(assert) {
        var ready = assert.async();
        assert.expect(3);

        var $elt = $('#container-1');
        var firstUrl = '/test/datatable/data.json';
        var secondUrl = '/test/datatable/largedata.json';
        assert.ok($elt.length === 1, 'Test the fixture is available');

        $elt.one('create.datatable', function() {
            assert.ok($elt.find('.datatable').length === 1, 'the layout has been inserted');

            // *** Check the reinit of the datatable
            $elt.one('create.datatable', function() {
                assert.ok(false, 'The create event must not be triggered when reinit');
            });

            $elt.one('load.datatable', function() {
                var data = $elt.data('ui.datatable');
                assert.equal(data && data.url, secondUrl, 'The options must be updated by reinit');
                ready();
            });

            $elt.datatable({
                url: secondUrl
            });

            // *** End reinit check
        });
        $elt.datatable({
            url: firstUrl
        });
    });

    QUnit.test('Tool buttons', (assert) => {
        const done = assert.async();
        const $container = $('#container-1');
        assert.expect(3);

        $container.on('create.datatable', function() {
            $('.tool-test', $container).trigger('click');
            $('.tool-disabled', $container).addClass('disabled').trigger('click');

            assert.equal($('.tool-3', $container).length, 1, 'Tool without id should generate class as tool-${index}');

            assert.verifySteps(['Tool button is clicked']);
            done();
        });

        $container.datatable({
            url: '/test/datatable/data.json',
            model: [{
                    id: 'login',
                    label: 'Login',
                    sortable: true
                }, {
                    id: 'name',
                    label: 'Name',
                    sortable: true
            }],
            tools: [{
                    id: 'test',
                    label: 'tool button',
                    action() {
                        assert.step('Tool button is clicked')
                    }
                }, {
                    id: 'disabled',
                    label: 'disabled tool button',
                    action() {
                        assert.step('Disabled tool button is clicked')
                    }
                },
                {
                    id: 'without-action',
                    label: 'Without action handler',
                },
                {
                    label: 'Tool without id',
                }
            ]
        });
    });

    QUnit.test('Options', function(assert) {
        var ready = assert.async();
        assert.expect(5);

        var $elt = $('#container-1');
        var firstOptions = {
            url: '/test/datatable/data.json'
        };
        var secondOptions = {
            url: '/test/datatable/largedata.json',
            tools: [{
                id: 'test',
                label: 'TEST'
            }]
        };
        assert.ok($elt.length === 1, 'Test the fixture is available');

        $elt.on('create.datatable', function() {
            assert.ok($elt.find('.datatable').length === 1, 'the layout has been inserted');

            var data = $elt.data('ui.datatable') || {};
            assert.equal(data.url, firstOptions.url, 'The options must be set');

            $elt.datatable('options', secondOptions);

            data = $elt.data('ui.datatable') || {};
            assert.equal(data.url, secondOptions.url, 'The url option must be updated');
            assert.deepEqual(data.tools, secondOptions.tools, 'The tools options must be added');

            ready();
        });
        $elt.datatable(firstOptions);
    });

    QUnit.test('Option readonly', function(assert){
        const done = assert.async();
        const $container = $('#container-1');
        assert.expect(3);

        $container.on('create.datatable', function() {
            assert.equal($('[data-item-identifier="1"] button.disabled', $container).length, 3, 'All action buttons are disabled for readonly="true"');
            assert.ok($('[data-item-identifier="2"] button.disabled', $container).length === 1 && $('[data-item-identifier="2"] button.view', $container).hasClass('disabled'), 'Specific action button is disabled for readonly={ 2: { view: true}}');
            assert.equal($('[data-item-identifier="3"] button.disabled', $container).length, 0, 'No action buttons are disabled');

            done();
        });

        $container.datatable({
            url: '/test/datatable/data.json',
            model: [{
                id: 'name',
                label: 'Name',
            },{
                id: 'activate',
                type: 'actions',
                actions: [{
                    id: 'activate',
                    label: 'Activate'
                }, {
                    id: 'view',
                    label: 'View'
                }, {
                    id: 'delete',
                    label: 'Delete'
                }]
            }],
        }, {
            data: [{
                id: 1,
                name: 'John',
                email: 'john.smith@mail.com'
            }, {
                id: 2,
                name: 'Jane',
                email: 'jane.doe@mail.com'
            }, {
                id: 3,
                name: 'Tom',
                email: 'tom.doe@mail.com'
            }],
            readonly: {
                1: true,
                2: {
                    'view': true,
                    'delete': false
                },
                3: false
            },
        });
    });

    QUnit.test('Option requestInterceptor', function(assert){
        const $container = $('#container-1');
        const done = assert.async();

        $.mockjax(function() {
            assert.ok(false, 'AJAX request must be intercepted');
            done();
        });

        $container.on('load.datatable', function() {
            assert.verifySteps(['intercept'])
            done();
        });

        $container.datatable({
            url: '/test/datatable/data.json',
            model: [{
                id: 'name',
                label: 'Name',
            }],
            requestInterceptor: function(){
                return new Promise(function(resolve, reject){
                    assert.step('intercept');
                    resolve({
                        data: [{
                            id: 1,
                            name: 'John',
                            email: 'john.smith@mail.com'
                        }, {
                            id: 2,
                            name: 'Jane',
                            email: 'jane.doe@mail.com'
                        }]
                    });

                })
            }
        });
    });

    QUnit.test('Option requestInterceptor failed', function(assert){
        const $container = $('#container-1');
        const done = assert.async();
        assert.expect(1);

        $container.on('error.datatable', function(error) {
            assert.ok(true, 'Interceptor is failed');
            done();
        });

        $container.datatable({
            url: '/test/datatable/data.json',
            model: [{
                id: 'name',
                label: 'Name',
            }],
            requestInterceptor: function(){
                return new Promise(function(resolve, reject){
                    reject('Failed');
                })
            }
        });
    });

    QUnit.test('Model loading using AJAX', function(assert) {
        var ready3 = assert.async();
        var ready2 = assert.async();
        var ready1 = assert.async();
        assert.expect(11);

        var $elt = $('#container-1');
        assert.ok($elt.length === 1, 'Test the fixture is available');

        var ready = assert.async();

        $elt.on('create.datatable', function() {
            assert.ok($elt.find('.datatable').length === 1, 'the layout has been inserted');
            assert.ok($elt.find('.datatable thead th').length === 6, 'the table contains 6 heads elements');
            assert.equal($elt.find('.datatable thead th:eq(0) div').text(), 'Login', 'the login label is created');
            assert.equal($elt.find('.datatable thead th:eq(1) div').text(), 'Name', 'the name label is created');
            assert.equal($elt.find('.datatable thead th:eq(0) div').data('sort-by'), 'login', 'the login col is sortable');
            ready();
        });
        $elt.on('query.datatable', function(event, ajaxConfig) {
            assert.equal(typeof ajaxConfig, 'object', 'the query event is triggered and provides an object');
            assert.equal(typeof ajaxConfig.url, 'string', 'the query event provides an object containing the target url');
            assert.equal(typeof ajaxConfig.data, 'object', 'the query event provides an object containing the request parameters');
            ready1();
        });
        $elt.on('beforeload.datatable', function(event, response) {
            assert.equal(typeof response, 'object', 'the beforeload event is triggered and provides the response data');
            ready2();
        });
        $elt.on('load.datatable', function(event, response) {
            assert.equal(typeof response, 'object', 'the load event is triggered and provides the response data');
            ready3();
        });
        $elt.datatable({
            url: '/test/datatable/data.json',
            'model': [{
                id: 'login',
                label: 'Login',
                sortable: true
            }, {
                id: 'name',
                label: 'Name',
                sortable: true
            }, {
                id: 'email',
                label: 'Email',
                sortable: true
            }, {
                id: 'roles',
                label: 'Roles',
                sortable: false
            }, {
                id: 'dataLg',
                label: 'Data Language',
                sortable: true
            }, {
                id: 'guiLg',
                label: 'Interface Language',
                sortable: true
            }]
        });
    });

    QUnit.test('Model loading using predefined data', function(assert) {
        var ready3 = assert.async();
        var ready2 = assert.async();
        var ready1 = assert.async(2);
        assert.expect(12);

        var $elt = $('#container-1');
        assert.ok($elt.length === 1, 'Test the fixture is available');

        var ready = assert.async();

        $elt.on('create.datatable', function() {
            assert.ok($elt.find('.datatable').length === 1, 'the layout has been inserted');
            assert.ok($elt.find('.datatable thead th').length === 6, 'the table contains 6 heads elements');
            assert.equal($elt.find('.datatable thead th:eq(0) div').text(), 'Login', 'the login label is created');
            assert.equal($elt.find('.datatable thead th:eq(1) div').text(), 'Name', 'the name label is created');
            assert.equal($elt.find('.datatable thead th:eq(0) div').data('sort-by'), 'login', 'the login col is sortable');
            ready();
        });
        $elt.on('query.datatable', function(event, ajaxConfig) {
            assert.ok(false, 'the query event must not be triggered!');
        });
        $elt.on('beforeload.datatable', function(event, response) {
            assert.equal(typeof response, 'object', 'the beforeload event is triggered and provides the response data');
            ready1();
        });
        $elt.one('load.datatable', function(event, response) {
            assert.equal(typeof response, 'object', 'the load event is triggered and provides the response data');
            assert.equal($elt.find('.datatable tbody tr').length, dataset.data.length, 'the lines from the small dataset are rendered');

            ready2();

            // *** Check the refresh with predefined data
            _.defer(function() {
                $elt.one('load.datatable', function(event, response) {
                    assert.equal(typeof response, 'object', 'the load event is triggered and provides the response data');
                    assert.equal($elt.find('.datatable tbody tr').length, largeDataset.data.length, 'the lines from the large dataset are rendered');
                    ready3();
                });

                $elt.datatable('refresh', largeDataset);
            });
        });
        $elt.datatable({
            url: '/test/datatable/data.json',
            'model': [{
                id: 'login',
                label: 'Login',
                sortable: true
            }, {
                id: 'name',
                label: 'Name',
                sortable: true
            }, {
                id: 'email',
                label: 'Email',
                sortable: true
            }, {
                id: 'roles',
                label: 'Roles',
                sortable: false
            }, {
                id: 'dataLg',
                label: 'Data Language',
                sortable: true
            }, {
                id: 'guiLg',
                label: 'Interface Language',
                sortable: true
            }]
        }, dataset);
    });

    QUnit.test('Model loading with the "action" type property using predefined data', function(assert) {
        var ready3 = assert.async();
        var ready2 = assert.async();
        var ready1 = assert.async(2);
        assert.expect(15);

        var $elt = $('#container-1');
        assert.ok($elt.length === 1, 'Test the fixture is available');

        var ready = assert.async();

        $elt.on('create.datatable', function() {
            assert.ok($elt.find('.datatable').length === 1, 'the layout has been inserted');
            assert.equal($elt.find('.datatable thead th').length, 8, 'the table contains 8 heads elements');
            assert.equal($elt.find('.datatable thead th:eq(6) div').text(), 'Pause', 'the Pause label is created');
            assert.equal($elt.find('.datatable thead th:eq(7) div').text(), 'Administration', 'the Administration label is created');

            $('[data-item-identifier="1"] button.run:eq(0)', $elt).trigger('click');
            $('[data-item-identifier="3"] button.run:eq(0)', $elt).trigger('click');
            $('[data-item-identifier="2"] button.pause:eq(1)', $elt).click();
            $('[data-item-identifier="2"] button.pause:eq(0)', $elt).click();
            $('[data-item-identifier="1"] .administration button.disabled', $elt).trigger('click');

            ready();
        });
        $elt.on('query.datatable', function(event) {
            assert.ok(false, 'the query event must not be triggered!');
        });
        $elt.on('beforeload.datatable', function(event, response) {
            assert.equal(typeof response, 'object', 'the beforeload event is triggered and provides the response data');
            ready1();
        });
        $elt.one('load.datatable', function(event, response) {
            assert.equal(typeof response, 'object', 'the load event is triggered and provides the response data');
            assert.equal($elt.find('.datatable tbody tr').length, dataset.data.length, 'the lines from the small dataset are rendered');

            ready2();

            // *** Check the refresh with predefined data
            _.defer(function() {
                $elt.one('load.datatable', function(event, response) {
                    assert.equal(typeof response, 'object', 'the load event is triggered and provides the response data');
                    assert.equal($elt.find('.datatable tbody tr').length, largeDataset.data.length, 'the lines from the large dataset are rendered');
                    ready3();
                });

                $elt.datatable('refresh', largeDataset);
            });
        });

        $elt.datatable({
            url: '/test/datatable/data.json',
            'model': [{
                id: 'login',
                label: 'Login',
                sortable: true
            }, {
                id: 'name',
                label: 'Name',
                sortable: true
            }, {
                id: 'email',
                label: 'Email',
                sortable: true
            }, {
                id: 'roles',
                label: 'Roles',
                sortable: false
            }, {
                id: 'dataLg',
                label: 'Data Language',
                sortable: true
            }, {
                id: 'guiLg',
                label: 'Interface Language',
                sortable: true
            }, {
                id: 'pauseCl',
                label: 'Pause',
                type: 'actions',
                actions: [{
                    id: 'pause',
                    icon: 'pause',
                    label: 'Pause me',
                    title: 'Press to pause process',
                    action: function(id) {
                        assert.ok(true, 'In the pause action, id: ' + id);
                    }
                }]
            }, {
                id: 'administration',
                label: 'Administration',
                type: 'actions',
                actions: [{
                    id: 'run',
                    icon: 'play',
                    label: 'Play',
                    title: 'Run action',
                    action: function(id) {
                        assert.ok(true, 'In the run action, id: ' + id);
                    }
                }, {
                    id: 'pause',
                    icon: 'pause',
                    label: 'Pause me',
                    title: 'Press to pause process',
                    action: function(id) {
                        assert.ok(true, 'In the pause action, id: ' + id);
                    }
                }, {
                    id: 'stop',
                    icon: 'stop',
                    label: 'Stop',
                    title: 'Press to stop process',
                    action: function() {
                        assert.ok(true, 'In the stop action');
                    }
                }, {
                    id: 'disabled',
                    icon: 'disabled',
                    label: 'Disabled',
                    title: 'Press to disabled button',
                    disabled: true,
                    action: function() {
                        assert.step('Action on disabled button is called');
                    }
                }]
            }]
        }, dataset);
    });

    QUnit.test('Model loading with actions column', function(assert) {
        var ready3 = assert.async();
        var ready2 = assert.async();
        var ready1 = assert.async(2);
        assert.expect(14);

        var $elt = $('#container-1');
        assert.ok($elt.length === 1, 'Test the fixture is available');

        var ready = assert.async();

        $elt.on('create.datatable', function() {
            assert.ok($elt.find('.datatable').length === 1, 'the layout has been inserted');
            assert.equal($elt.find('.datatable thead th').length, 8, 'the table contains 8 heads elements');
            assert.equal($elt.find('.datatable thead th:eq(7)').text(), 'Actions', 'the Actions label is created');
            assert.equal($elt.find('.datatable thead th:eq(6) > div').html(), '', 'Column type "action" without actions');

            $('[data-item-identifier="1"] button.run:eq(0)', $elt).trigger('click');
            $('[data-item-identifier="3"] button.run:eq(0)', $elt).trigger('click');
            $('[data-item-identifier="2"] button.pause:eq(1)', $elt).click();
            $('[data-item-identifier="2"] button.pause:eq(0)', $elt).click();
            $('[data-item-identifier="1"] button.disabled', $elt).trigger('click');
            $('[data-item-identifier="1"] button.no-handles-provided', $elt).trigger('click');

            ready();
        });
        $elt.on('query.datatable', function(event) {
            assert.ok(false, 'the query event must not be triggered!');
        });
        $elt.on('beforeload.datatable', function(event, response) {
            assert.equal(typeof response, 'object', 'the beforeload event is triggered and provides the response data');
            ready1();
        });
        $elt.one('load.datatable', function(event, response) {
            assert.equal(typeof response, 'object', 'the load event is triggered and provides the response data');
            assert.equal($elt.find('.datatable tbody tr').length, dataset.data.length, 'the lines from the small dataset are rendered');

            ready2();

            // *** Check the refresh with predefined data
            _.defer(function() {
                $elt.one('load.datatable', function(event, response) {
                    assert.equal(typeof response, 'object', 'the load event is triggered and provides the response data');
                    assert.equal($elt.find('.datatable tbody tr').length, largeDataset.data.length, 'the lines from the large dataset are rendered');
                    ready3();
                });

                $elt.datatable('refresh', largeDataset);
            });
        });
        $elt.datatable({
            url: '/test/datatable/data.json',
            actions: [{
                id: 'run',
                icon: 'play',
                label: 'Play',
                title: 'Run action',
                action: function(id) {
                    assert.ok(true, 'In the run action, id: ' + id);
                }
            }, {
                id: 'pause',
                icon: 'pause',
                label: 'Pause me',
                title: 'Press to pause process',
                action: function(id) {
                    assert.ok(true, 'In the pause action, id: ' + id);
                }
            }, {
                id: 'stop',
                icon: 'stop',
                label: 'Stop',
                title: 'Press to stop process',
                action: function() {
                    assert.ok(true, 'In the stop action');
                },
            }, {
                id: 'disabled',
                icon: 'disabled',
                label: 'disabled',
                title: 'disabled',
                action: function() {
                    assert.notOk(true, 'Is not clickable');
                }
            }, {
                id: 'no-handles-provided',
                icon: 'no-handles-provided',
                label: 'no-handles-provided',
            }],
            'model': [{
                id: 'login',
                label: 'Login',
                sortable: true
            }, {
                id: 'name',
                label: 'Name',
                sortable: true
            }, {
                id: 'email',
                label: 'Email',
                sortable: true
            }, {
                id: 'roles',
                label: 'Roles',
                sortable: false
            }, {
                id: 'dataLg',
                label: 'Data Language',
                sortable: true
            }, {
                id: 'guiLg',
                label: 'Interface Language',
                sortable: true
            }, {
                id: 'empty-actions',
                type: 'action'
            }]
        }, dataset);
    });

    QUnit.test('Render actions option from Object', function(assert) {
        const done = assert.async();
        const $container = $('#container-1');

        assert.expect(4);

        $container.on('create.datatable', function() {
            const $firstRowActions = $('[data-item-identifier="1"] .actions')

            assert.equal($firstRowActions.find('.edit, .delete').length, 2, 'Action buttons is rendered');
            assert.equal($firstRowActions.find('.icon-edit, .icon-delete').length, 2, 'Action buttons has icons');

            $firstRowActions.find('.edit').trigger('click');
            $firstRowActions.find('.delete').trigger('click');

            done();
        }).datatable({
            url: '/test/datatable/data.json',
            actions: {
                edit: function() {
                    assert.ok(true, 'Click on edit button is triggered the handler');
                },
                delete: function(){
                    assert.ok(true, 'Click on delete button is triggered the handler');
                }
            }
        }, dataset);
    });

    QUnit.test('Data rendering', function(assert) {
        var ready3 = assert.async(2);
        var ready2 = assert.async(2);
        var ready1 = assert.async();
        assert.expect(13);

        var renderCalled = false;
        var $elt = $('#container-1');
        assert.ok($elt.length === 1, 'Test the fixture is available');

        var ready = assert.async();

        $elt.on('create.datatable', function() {
            assert.ok($elt.find('.datatable').length === 1, 'the layout has been inserted');
            assert.ok($elt.find('.datatable thead th').length === 6, 'the table contains 6 heads elements');
            assert.equal($elt.find('.datatable thead th:eq(0) div').text(), 'Login', 'the login label is created');
            assert.equal($elt.find('.datatable thead th:eq(1) div').text(), 'Name', 'the name label is created');
            assert.equal($elt.find('.datatable thead th:eq(0) div').data('sort-by'), 'login', 'the login col is sortable');
            ready();
        });
        $elt.on('query.datatable', function(event, ajaxConfig) {
            assert.equal(typeof ajaxConfig, 'object', 'the query event is triggered and provides an object');
            assert.equal(typeof ajaxConfig.url, 'string', 'the query event provides an object containing the target url');
            assert.equal(typeof ajaxConfig.data, 'object', 'the query event provides an object containing the request parameters');
            ready1();
        });
        $elt.on('beforeload.datatable', function(event, response) {
            assert.equal(typeof response, 'object', 'the beforeload event is triggered and provides the response data');
            ready2();
        });
        $elt.on('load.datatable', function(event, response) {
            assert.equal(typeof response, 'object', 'the load event is triggered and provides the response data');
            ready3();

            if (!renderCalled) {
                renderCalled = true;
                setTimeout(function() {
                    $elt.datatable('render', response);
                }, 1);
            }
        });
        $elt.datatable({
            url: '/test/datatable/data.json',
            'model': [{
                id: 'login',
                label: 'Login',
                sortable: true
            }, {
                id: 'name',
                label: 'Name',
                sortable: true
            }, {
                id: 'email',
                label: 'Email',
                sortable: true
            }, {
                id: 'roles',
                label: 'Roles',
                sortable: false
            }, {
                id: 'dataLg',
                label: 'Data Language',
                sortable: true
            }, {
                id: 'guiLg',
                label: 'Interface Language',
                sortable: true
            }]
        });
    });

    QUnit.test('Render empty table on failed ajax request', function(assert) {
        const done = assert.async();
        const $container = $('#container-1');
        assert.expect(2);

        $.mockjax(function() {
            return {
                status: 404,
                statusText: 'Not Found',
            }
        });

        $container.on('create.datatable', function() {
            assert.ok($('.datatable', $container).length === 1, 'the layout has been inserted');
        })
        .on('error.datatable', function(event, error) {
            assert.equal(error.message, 'Not Found', 'Request is failed with an error message');
            done();
        })
        .datatable({
            url: '/failed-request',
            model: [{
                id: 'login',
                label: 'Login'
            }]
        });
    });

    QUnit.test('Render empty table on empty successful response', function(assert) {
        const done = assert.async();
        const $container = $('#container-1');
        assert.expect(1);

        $.mockjax(function() {
            return {
                status: 200,
                statusText: 'OK',
                responseText: undefined
            }
        });

        $container.on('create.datatable', function() {
            assert.ok($('.datatable', $container).length === 1, 'the layout has been inserted');
            done();
        })
        .datatable({
            url: '/empty-response',
            model: [{
                id: 'login',
                label: 'Login'
            }]
        });
    });

    QUnit.test('Selection disabled', function(assert) {
        var ready = assert.async();
        assert.expect(4);

        var $elt = $('#container-1');
        assert.ok($elt.length === 1, 'Test the fixture is available');

        $elt.on('create.datatable', function() {
            assert.ok($elt.find('.datatable').length === 1, 'the layout has been inserted');
            assert.ok($elt.find('.checkboxes').length === 0, 'there is no selection checkboxes');
            assert.ok($elt.datatable('selection').length === 0, 'the selection is empty');
            ready();
        });
        $elt.datatable({
            url: '/test/datatable/data.json',
            'model': [{
                id: 'login',
                label: 'Login',
                sortable: true
            }, {
                id: 'name',
                label: 'Name',
                sortable: true
            }, {
                id: 'email',
                label: 'Email',
                sortable: true
            }, {
                id: 'roles',
                label: 'Roles',
                sortable: false
            }, {
                id: 'dataLg',
                label: 'Data Language',
                sortable: true
            }, {
                id: 'guiLg',
                label: 'Interface Language',
                sortable: true
            }]
        });
    });

    QUnit.test('Selection enabled', function(assert) {
        var ready = assert.async();
        assert.expect(11);

        var $elt = $('#container-1');
        assert.ok($elt.length === 1, 'Test the fixture is available');

        $elt.on('create.datatable', function() {
            assert.ok($elt.find('.datatable').length === 1, 'the layout has been inserted');
            assert.equal($elt.find('.checkboxes').length, 4, 'there are selection checkboxes');
            assert.equal($elt.datatable('selection').length, 0, 'the selection is empty');

            $elt.find('td.checkboxes input').trigger('click');
            assert.equal($elt.datatable('selection').length, 3, 'select each line: the selection is full');

            $elt.find('th.checkboxes input').trigger('click');
            assert.equal($elt.datatable('selection').length, 0, 'click on the checkall button: the selection is empty');

            $elt.find('th.checkboxes input').trigger('click');
            assert.equal($elt.datatable('selection').length, 3, 'click on the checkall button: the selection is full');

            $elt.find('td.checkboxes input').first().trigger('click');
            assert.equal($elt.datatable('selection').length, 2, 'unselect a line: the selection contains all items but the unchecked item');

            $elt.find('th.checkboxes input').trigger('click');
            assert.equal($elt.datatable('selection').length, 3, 'click on the checkall button: the selection is full');

            $elt.find('td.checkboxes input').trigger('click');
            assert.equal($elt.datatable('selection').length, 0, 'unselect each line: the selection is empty');

            $elt.find('td.checkboxes input').first().trigger('click');
            assert.equal($elt.datatable('selection').length, 1, 'select a line: the selection contains only the checked item');

            ready();
        });
        $elt.datatable({
            url: '/test/datatable/data.json',
            selectable: true,
            'model': [{
                id: 'login',
                label: 'Login',
                sortable: true
            }, {
                id: 'name',
                label: 'Name',
                sortable: true
            }, {
                id: 'email',
                label: 'Email',
                sortable: true
            }, {
                id: 'roles',
                label: 'Roles',
                sortable: false
            }, {
                id: 'dataLg',
                label: 'Data Language',
                sortable: true
            }, {
                id: 'guiLg',
                label: 'Interface Language',
                sortable: true
            }]
        });
    });

    QUnit.test('Selection with massAction buttons', (assert) => {
        const done = assert.async();
        const $container = $('#container-1');

        assert.expect(5);

        $container.on('create.datatable', function() {
            const $massActionButton = $('.tool-mass-action', $container);
            const $selectAll = $('th.checkboxes input', $container);

            assert.equal($massActionButton.length, 1, 'Mass action button is exist in tools');
            assert.ok($massActionButton.hasClass('invisible'), 'Mass action button is invisible');

            $('td.checkboxes input', $container).first().trigger('click');
            assert.notOk($massActionButton.hasClass('invisible'), 'Mass action button is visible once one row is selected');

            $selectAll.trigger('click');
            assert.notOk($massActionButton.hasClass('invisible'), 'Mass action button is visible when all rows are selected');

            $selectAll.trigger('click');
            assert.ok($massActionButton.hasClass('invisible'), 'Mass action button is invisible when all rows are unselected');

            done();
        })
        .datatable({
            url: '/test/datatable/data.json',
            selectable: true,
            model: [{
                id: 'login',
                label: 'Login',
                sortable: true
            }, {
                id: 'name',
                label: 'Name',
                sortable: true
            }, {
                id: 'email',
                label: 'Email',
                sortable: true
            }, {
                id: 'roles',
                label: 'Roles',
                sortable: false
            }, {
                id: 'dataLg',
                label: 'Data Language',
                sortable: true
            }, {
                id: 'guiLg',
                label: 'Interface Language',
                sortable: true
            }],
            tools: [{
                id: 'mass-action',
                label: 'Mass action',
                massAction: true,
                action: function() {
                    assert.notOk(true, 'Is not clickable');
                }
            }]
        });
    });

    QUnit.test('Selectable rows', function(assert) {
        var ready = assert.async();
        assert.expect(10);

        var $elt = $('#container-1');
        assert.ok($elt.length === 1, 'Test the fixture is available');

        $elt.on('create.datatable', function() {
            assert.ok($elt.find('.datatable').length === 1, 'the layout has been inserted');
            assert.ok($elt.find('.datatable thead th').length === 7, 'the table contains 7 heads elements');

            $('td.actions', $elt).trigger('click');
            $elt.find('.datatable tbody tr:eq(1) td:eq(1)').trigger('click');
        });

        $elt.datatable({
            url: '/test/datatable/data.json',
            rowSelection: true,
            'model': [{
                id: 'login',
                label: 'Login',
                sortable: true
            }, {
                id: 'name',
                label: 'Name',
                sortable: true
            }, {
                id: 'email',
                label: 'Email',
                sortable: true
            }, {
                id: 'roles',
                label: 'Roles',
                sortable: false
            }, {
                id: 'dataLg',
                label: 'Data Language',
                sortable: true
            }, {
                id: 'guiLg',
                label: 'Interface Language',
                sortable: true
            }, {
                id: 'actions',
                type: 'action',
                actions: [
                    {
                        id: 'start',
                        label: 'start',
                        action: function(){
                            assert.notOk(true, 'Action should be disabled');
                        }
                    }
                ]
            }],
            listeners: {
                selected: function() {
                    assert.ok(true, 'the handler was attached and caused');
                    assert.equal($elt.find('.datatable tbody tr.selected td:eq(0)').text(), 'jdoe', 'the login field in selected row is correct');
                    assert.equal($elt.find('.datatable tbody tr.selected td:eq(1)').text(), 'John Doe', 'the name field in selected row is correct');
                    assert.equal($elt.find('.datatable tbody tr.selected td:eq(2)').text(), 'jdoe@nowhere.org', 'the mail field in selected row is correct');
                    assert.equal($elt.find('.datatable tbody tr.selected td:eq(3)').text(), 'Items Manager', 'the roles field in selected row is correct');
                    assert.equal($elt.find('.datatable tbody tr.selected td:eq(4)').text(), 'English', 'the dataLg field in selected row is correct');
                    assert.equal($elt.find('.datatable tbody tr.selected td:eq(5)').text(), 'English', 'the guiLg field in selected row is correct');
                    ready();
                }
            }
        });
    });

    QUnit.test('Default filtering enabled', function(assert) {
        var ready = assert.async();
        assert.expect(10);

        var $elt = $('#container-1');
        assert.ok($elt.length === 1, 'Test the fixture is available');
        var dom;

        $elt.on('create.datatable', function() {
            assert.ok($elt.find('.datatable').length === 1, 'the layout has been inserted');
            assert.ok($elt.find('.datatable thead th').length === 6, 'the table contains 6 heads elements');
            assert.ok($elt.find('.datatable-wrapper aside.filter').length, 'the filter is enabled');

            var $filterInput = $elt.find('.datatable-wrapper aside.filter input');
            var eventKeyPressH = $.Event( "keypress", { which: 72 } );
            var eventKeyPressEnter = $.Event( "keypress", { which: 13 });

            $filterInput.val('abcdef');
            $filterInput.trigger(eventKeyPressH);

            assert.equal($filterInput.val(), 'abcdef', 'Filter inputs value is not changed on typing');
            assert.ok($elt.find('.datatable-wrapper aside.filter').length, 'the filter is enabled');

            $filterInput.trigger(eventKeyPressEnter);

            dom = $elt.find('tbody').get();
        });

        $elt.on('filter.datatable', function(event, options) {
            assert.equal(options.filterquery, 'abcdef', 'the filter set right search query');
            assert.deepEqual(options.filtercolumns, ['login', 'name'], 'the filter set right columns');

            $elt.on('load.datatable', function() {
                assert.equal($elt.find('.datatable-wrapper aside.filter input').hasClass('focused'), true, 'the filter is focusable after refreshing');
                assert.notEqual(dom, $elt.find('tbody').get(), 'content has been changed');
                ready();
            });
        });

        $elt.datatable({
            url: '/test/datatable/data.json',
            filter: {
                columns: ['login', 'name']
            },
            'model': [{
                id: 'login',
                label: 'Login',
                sortable: true
            }, {
                id: 'name',
                label: 'Name',
                sortable: true
            }, {
                id: 'email',
                label: 'Email',
                sortable: true
            }, {
                id: 'roles',
                label: 'Roles',
                sortable: false
            }, {
                id: 'dataLg',
                label: 'Data Language',
                sortable: true
            }, {
                id: 'guiLg',
                label: 'Interface Language',
                sortable: true
            }]
        });
    });

    QUnit.test('Column filtering (input) enabled', function(assert) {
        var ready = assert.async();
        assert.expect(10);

        var $elt = $('#container-1');
        var dom;
        assert.ok($elt.length === 1, 'Test the fixture is available');

        $elt.on('create.datatable', function() {
            assert.ok($elt.find('.datatable').length === 1, 'the layout has been inserted');
            assert.ok($elt.find('.datatable thead th').length === 6, 'the table contains 6 heads elements');
            assert.equal($elt.find('.datatable thead th:eq(0) aside.filter').data('column'), 'login', 'the login col is filterable');
            assert.equal($elt.find('.datatable thead th:eq(2) aside.filter').data('column'), 'email', 'the email col is filterable');
            assert.equal($elt.find('.datatable thead th:eq(2) input').attr('placeholder'), 'Search by email', 'Email filter input has right placeholder');

            dom = $elt.find('tbody').get();
            $elt.find('aside.filter[data-column="login"] input').val('abcdef');
            $elt.find('aside.filter[data-column="login"] button').trigger('click');
        });

        $elt.on('filter.datatable', function(event, options) {
            assert.equal(options.filtercolumns, 'login', 'the filter set right column');
            assert.equal(options.filterquery, 'abcdef', 'the filter set right search query');
            assert.notEqual(dom, $elt.find('tbody').get(), 'content has been changed');
            $elt.on('load.datatable', function() {
                assert.equal($elt.find('aside.filter[data-column="login"] input').hasClass('focused'), true, 'the login column filter is focusable after refreshing');
                ready();
            });

        });

        $elt.datatable({
            url: '/test/datatable/data.json',
            filter: true,
            'model': [{
                id: 'login',
                label: 'Login',
                sortable: true,
                filterable: true
            }, {
                id: 'name',
                label: 'Name',
                sortable: true
            }, {
                id: 'email',
                label: 'Email',
                sortable: true,
                filterable: {
                    placeholder: 'Search by email'
                }
            }, {
                id: 'roles',
                label: 'Roles',
                sortable: false
            }, {
                id: 'dataLg',
                label: 'Data Language',
                sortable: true
            }, {
                id: 'guiLg',
                label: 'Interface Language',
                sortable: true
            }]
        });
    });

    QUnit.test('Column filtering (select) enabled', function(assert) {
        var ready = assert.async();
        assert.expect(10);

        var $elt = $('#container-1');
        var dom;
        assert.ok($elt.length === 1, 'Test the fixture is available');

        $elt.on('create.datatable', function() {
            assert.ok($elt.find('.datatable').length === 1, 'the layout has been inserted');
            assert.ok($elt.find('.datatable thead th').length === 6, 'the table contains 6 heads elements');
            assert.equal($elt.find('.datatable thead th:eq(1) aside.filter').data('column'), 'name', 'the name col is filterable');
            assert.equal($elt.find('.datatable thead th:eq(2) aside.filter').data('column'), 'email', 'the email col is filterable');
            dom = $elt.find('tbody').get();

            assert.ok($elt.find('aside.filter[data-column="name"] select').hasClass('test'), 'filter callback has been called');

            $elt.find('aside.filter[data-column="name"] select').val('John Doe');
            $elt.find('aside.filter[data-column="name"] select').trigger('change');
        });

        $elt.on('filter.datatable', function(event, options) {
            assert.equal(options.filtercolumns, 'name', 'the filter set right column');
            assert.equal(options.filterquery, 'John Doe', 'the filter set right search query');
            $elt.on('load.datatable', function() {
                assert.equal($elt.find('aside.filter[data-column="name"] select').val(), 'John Doe', 'the name column filter has proper value after refreshing');
                assert.notEqual(dom, $elt.find('tbody').get(), 'content has been changed');
                ready();
            });

        });

        $elt.datatable({
            url: '/test/datatable/data.json',
            filter: true,
            'model': [{
                id: 'login',
                label: 'Login',
                sortable: true
            }, {
                id: 'name',
                label: 'Name',
                sortable: true,
                filterable: true,
                customFilter: {
                    template: '<select><option selected></option><option value="Smith">Smith</option><option value="John Doe">Doe</option> </select>',
                    callback: function($filter) {
                        $filter.addClass("test");
                    }
                }
            }, {
                id: 'email',
                label: 'Email',
                sortable: true,
                filterable: true
            }, {
                id: 'roles',
                label: 'Roles',
                sortable: false
            }, {
                id: 'dataLg',
                label: 'Data Language',
                sortable: true
            }, {
                id: 'guiLg',
                label: 'Interface Language',
                sortable: true
            }]
        });
    });

    QUnit.test('Transform', function(assert) {
        var ready = assert.async(2);
        var ready1 = assert.async();

        var $elt = $('#container-1');
        var renderFullName = function(row) {
            return row.firstname + ' ' + row.lastname;
        };
        var transform = function(value, row, field, index, data) {
            assert.equal(typeof row, 'object', 'The row is provided');
            assert.equal(typeof field, 'object', 'The field is provided');
            assert.equal(typeof index, 'number', 'The row index is provided');
            assert.equal(typeof data, 'object', 'The dataset is provided');
            assert.equal(data, dataset, 'The provided dataset is the right dataset');

            assert.equal(row, dataset[index], 'The provided row is the exact row at index');
            assert.equal(typeof field.id, 'string', 'The field id is provided');
            assert.equal(value, row[field.id], 'The right value is provided');

            ready();
            return renderFullName(row);
        };
        var model = [{
            id: 'fullName',
            label: 'Full name',
            transform: transform
        }, {
            id: 'email',
            label: 'Email',
            transform: true
        }];
        var dataset = [{
            id: 1,
            firstname: 'John',
            lastname: 'Smith',
            email: 'john.smith@mail.com'
        }, {
            id: 1,
            firstname: 'Jane',
            lastname: 'Doe',
            email: 'jane.doe@mail.com'
        }];

        assert.expect(26);

        assert.ok($elt.length === 1, 'Test the fixture is available');

        $elt.on('create.datatable', function() {
            assert.ok($elt.find('.datatable').length === 1, 'the layout has been inserted');
            assert.ok($elt.find('.datatable thead th').length === 2, 'the table contains 2 heads elements');
            assert.equal($elt.find('.datatable thead th:eq(0)').text().trim(), model[0].label, 'The first column contains the right header');
            assert.equal($elt.find('.datatable thead th:eq(1)').text().trim(), model[1].label, 'The second column contains the right header');

            assert.equal($elt.find('.datatable tbody tr').length, dataset.length, 'The table contains the same lines number as in the dataset');

            assert.equal($elt.find('.datatable tbody tr:eq(0) td:eq(0)').text().trim(), renderFullName(dataset[0]), 'The first line contains the right full name');
            assert.equal($elt.find('.datatable tbody tr:eq(0) td:eq(1)').text().trim(), dataset[0].email, 'The first line contains the right email');

            assert.equal($elt.find('.datatable tbody tr:eq(1) td:eq(0)').text().trim(), renderFullName(dataset[1]), 'The second line contains the right full name');
            assert.equal($elt.find('.datatable tbody tr:eq(1) td:eq(1)').text().trim(), dataset[1].email, 'The second line contains the right email');

            ready1();
        });

        $elt.datatable({
            model: model
        }, {
            data: dataset
        });
    });

    QUnit.cases.init([
        {
            paginationStrategyTop: 'none',
            paginationStrategyBottom: 'none',
            paginationTopChildrenLength: 0,
            paginationBottomChildrenLength: 0
        },
        {
            paginationStrategyTop: 'simple',
            paginationStrategyBottom: 'simple',
            paginationTopChildrenLength: 2,
            paginationBottomChildrenLength: 2
        },
        {
            paginationStrategyTop: 'pages',
            paginationStrategyBottom: 'pages',
            paginationTopChildrenLength: 2,
            paginationBottomChildrenLength: 2
        }
    ])
    .test('Pagination strategy', function(strategy, assert) {
        const done = assert.async();
        const $container = $('#container-1');
        const {
            paginationStrategyTop,
            paginationStrategyBottom,
            paginationTopChildrenLength,
            paginationBottomChildrenLength
        } = strategy;

        assert.expect(2);

        $container.one('create.datatable', () => {
            assert.equal( $('.datatable-pagination-top').children().length, paginationTopChildrenLength, 'Top pagination content is rendered')
            assert.equal( $('.datatable-pagination-bottom').children().length, paginationBottomChildrenLength, 'Bottom pagination content is rendered')
            done();
        });


        $container.datatable({
            url: '/test/datatable/largedata.json',
            rows: 5,
            paginationStrategyTop,
            paginationStrategyBottom
        });
    })

    QUnit.test('Pagination', function(assert) {
        const done = assert.async();
        const $container = $('#container-1');

        assert.expect(4);

        $container.on('create.datatable', function() {
            const $pagesButtons = $container.find('.pages .page');
            const $previousButton = $container.find('.previous');
            const $nextButton = $container.find('.next');

            assert.ok($pagesButtons.eq(0).hasClass('active'), 'The first page is active on table created');

            $container.one('setpage.datatable', function() {
                assert.ok($('.pages .page', $container).eq(2).hasClass('active'), 'The third page is active after click on pagination button');
            });

            $container.one('backward.datatable', function() {
                assert.ok($('.pages .page', $container).eq(1).hasClass('active'), 'The first page is active after click on next button');
            });

            $container.one('forward.datatable', function() {
                assert.ok($('.pages .page', $container).eq(2).hasClass('active'), 'The second page is active after click on previous button');
                done();
            });

            $pagesButtons.eq(2).trigger('click');
            $previousButton.trigger('click');
            $nextButton.trigger('click');
        });

        $container.datatable({
            url: '/test/datatable/largedata.json',
            rowSelection: true,
            rows: 5,
            paginationStrategyTop: 'none',
            paginationStrategyBottom: 'pages',
            model: [{
                id: 'login',
                label: 'Login',
                sortable: true
            }]
        });
    });

    QUnit.test('Endless listeners on events', function(assert) {
        var ready = assert.async();
        assert.expect(5);

        var $elt = $('#container-1');
        assert.ok($elt.length === 1, 'Test the fixture is available');

        $elt.on('create.datatable', function() {
            assert.ok($elt.find('.datatable').length === 1, 'the layout has been inserted');
            assert.ok($elt.find('.datatable thead th').length === 6, 'the table contains 6 heads elements');

            // Run listener
            $elt.find('.datatable tbody tr:eq(1) td:eq(1)').trigger('click');

            // Sort list
            // and here we had render once again
            var eventPressKey = $.Event('keyup', { keyCode: 72 });
            $elt.find('.datatable thead tr:nth-child(1) th:eq(0) div').trigger(eventPressKey);
            $elt.find('.datatable thead tr:nth-child(1) th:eq(0) div').click();
        });

        $elt.datatable({
            url: '/test/datatable/data.json',
            rowSelection: true,
            'model': [{
                id: 'login',
                label: 'Login',
                sortable: true
            }, {
                id: 'name',
                label: 'Name',
                sortable: true
            }, {
                id: 'email',
                label: 'Email',
                sortable: true
            }, {
                id: 'roles',
                label: 'Roles',
                sortable: false
            }, {
                id: 'dataLg',
                label: 'Data Language',
                sortable: true
            }, {
                id: 'guiLg',
                label: 'Interface Language',
                sortable: true
            }],
            listeners: {
                selected: function selectRow(e) {
                    assert.ok(true, 'the handler was attached and caused');
                },
                sort: function() {
                    $elt.on('load.datatable', function() {
                        $elt.find('.datatable tbody tr:eq(1) td:eq(1)').trigger('click');
                        ready();
                    });
                }
            }
        });
    });

    QUnit.test('Before load event', function(assert) {
        var ready = assert.async();
        assert.expect(5);

        var firstLoad = true;
        var dataSetRef;

        var $elt = $('#container-1');
        assert.ok($elt.length === 1, 'Test the fixture is available');

        $elt.on('beforeload.datatable', function(e, loadedDataSet) {
            if (firstLoad) {
                assert.equal(typeof loadedDataSet, 'object', 'The beforeload gives us an object');
                assert.deepEqual(loadedDataSet, dataset, 'The dataset is correct');

                dataSetRef = loadedDataSet;
                firstLoad = false;
                $elt.datatable('refresh');
            } else {
                assert.ok(loadedDataSet !== dataSetRef, 'The given dataset is a copy');
                assert.deepEqual(loadedDataSet, dataSetRef, 'The dataset is correct');
                ready();
            }
        })
        .datatable({
            url: '/test/datatable/data.json',
            'model': [{
                id: 'login',
                label: 'Login',
                sortable: true
            }, {
                id: 'name',
                label: 'Name',
                sortable: true
            }, {
                id: 'email',
                label: 'Email',
                sortable: true
            }, {
                id: 'roles',
                label: 'Roles',
                sortable: false
            }, {
                id: 'dataLg',
                label: 'Data Language',
                sortable: true
            }, {
                id: 'guiLg',
                label: 'Interface Language',
                sortable: true
            }]
        });
    });

    QUnit.cases.init([
        {
            updateSortOptions: {
                sortBy: 'id',
                asc: true,
                sortType: ''
            },
            expectedOptions: {
                sortBy: 'id',
                sortOrder: 'asc',
                sortType: ''
            },
            message: 'Sort direction is set to true'
        },
        {
            updateSortOptions: {
                sortBy: 'id',
                asc: false,
                sortType: ''
            },
            expectedOptions: {
                sortBy: 'id',
                sortOrder: 'desc',
                sortType: ''
            },
            message: 'Sort direction is set to false'
        },
        {
            initSortOptions: {
                sortorder: 'asd',
                sortby: 'id'
            },
            updateSortOptions: {
                sortBy: 'id',
                asc: undefined,
                sortType: 'id'
            },
            expectedOptions: {
                sortBy: 'id',
                sortOrder: 'desc',
                sortType: 'id'
            },
            message: 'Sort order is changed from "asc" to "desc"'
        },
        {
            initSortOptions: {
                sortorder: 'desc',
            },
            updateSortOptions: {
                sortBy: 'name',
                asc: undefined,
                sortType: 'asc'
            },
            expectedOptions: {
                sortBy: 'name',
                sortOrder: 'asc',
                sortType: 'asc'
            },
            message: 'First time sort by "name"'
        },
        {
            initSortOptions: {
                sortorder: 'desc',
            },
            updateSortOptions: {
                sortBy: 'username',
                asc: undefined,
                sortType: 'asc'
            },
            expectedOptions: {
                sortBy: 'username',
                sortOrder: 'asc',
                sortType: 'asc'
            },
            message: 'Sort login using the sort identifier "username"'
        }
    ]).test('Sort options', (cases, assert) => {
        const done = assert.async();
        const $container = $('#container-1');

        $container.on('create.datatable', function() {
            const { sortBy, asc, sortType } = cases.updateSortOptions;

            $container.datatable('sort', sortBy, asc, sortType);
        })
        .one('sort.datatable', function(e, sortBy, sortOrder, sortType) {
            assert.propEqual({ sortBy, sortOrder, sortType }, cases.expectedOptions, cases.message);
            done();
        })
        .datatable(Object.assign({
            url: '/test/datatable/data.json',
            'model': [{
                id: 'login',
                sortId: 'username',
                label: 'Login',
                sortable: true,
                sorttype: 'string'
            }, {
                id: 'name',
                label: 'Name',
                sortable: true
            }]
        }, cases.initSortOptions));
    });

    QUnit.cases.init([
        {
            title: "regular sort options",
            sortBy: 'login',
            model: [{
                id: 'login',
                label: 'Login',
                sortable: true,
                sorttype: 'string'
            }, {
                id: 'name',
                label: 'Name',
                sortable: true
            }, {
                id: 'email',
                label: 'Email',
                sortable: false
            }]
        },
        {
            title: "using a different sort identifier",
            sortBy: 'username',
            model: [{
                id: 'login',
                sortId: 'username',
                label: 'Login',
                sortable: true,
                sorttype: 'string'
            }, {
                id: 'name',
                label: 'Name',
                sortable: true
            }, {
                id: 'email',
                label: 'Email',
                sortable: false
            }]
        }
    ]).test('Sortable headers', function(data, assert) {
        var ready = assert.async();
        var $container = $('#container-1');

        assert.expect(14);

        assert.equal($container.length, 1, 'Test the fixture is available');

        $container.on('create.datatable', function() {

            var $loginHead = $('.datatable thead th:nth-child(1) > div', $container);
            var $emailHead = $('.datatable thead th:nth-child(3) > div', $container);

            $loginHead.trigger('click');

            assert.equal($loginHead.length, 1, 'The login head exists');
            assert.equal($loginHead.text().trim(), 'Login', 'The login head contains the right text');
            assert.ok($loginHead.hasClass('sortable'), 'The login column is sortable');
            assert.equal($loginHead.data('sort-by'), data.sortBy, 'The sort by data is correct');
            assert.equal($loginHead.data('sort-type'), 'string', 'The sort type is correct');

            assert.equal($emailHead.length, 1, 'The email head exists');
            assert.equal($emailHead.text().trim(), 'Email', 'The email head contains the right text');
            assert.ok(!$emailHead.hasClass('sortable'), 'The email column is not sortable');
            assert.ok(!$emailHead.data('sort-by'), 'The sort by data does not exist');
            assert.ok(!$emailHead.data('sort-type'), 'The sort type does not exist');

        })
        .on('sort.datatable', function(e, sortby, sortorder, sorttype) {

            assert.equal(sortby, data.sortBy, 'The sort by data passed via event');
            assert.notEqual(sortorder, undefined, 'The sort order passed via event');
            assert.equal(sorttype, 'string', 'The sort type passed via event');

            ready();
        })
        .datatable({
            url: '/test/datatable/data.json',
            sortby: false,
            model: data.model
        });
    });

    QUnit.test('Hidden columns', function(assert) {
        var ready = assert.async();
        var $container = $('#container-1');

        assert.expect(5);

        assert.equal($container.length, 1, 'Test the fixture is available');

        $container.on('create.datatable', function() {

            var $headerCells = $('.datatable thead th', $container);

            assert.equal($headerCells.length, 3, 'The login head exists');
            assert.equal($headerCells.eq(0).text().trim(), 'Login');
            assert.equal($headerCells.eq(1).text().trim(), 'Email');
            assert.equal($headerCells.eq(2).text().trim(), 'Data Language');

            ready();
        })
            .datatable({
                url: '/test/datatable/data.json',
                'model': [{
                    id: 'login',
                    label: 'Login',
                    sortable: true,
                    visible: true
                }, {
                    id: 'name',
                    label: 'Name',
                    sortable: true,
                    visible: false
                }, {
                    id: 'email',
                    label: 'Email',
                    sortable: false
                }, {
                    id: 'roles',
                    label: 'Roles',
                    sortable: false,
                    visible: function() {
                        return false;
                    }
                }, {
                    id: 'guiLg',
                    label: 'Data Language',
                    sortable: false,
                    visible: function() {
                        return true;
                    }
                }]
            });
    });

    QUnit.test('pageSizeSelector disabled by default', function(assert){
        var ready = assert.async();
        var $container = $('#container-1');

        assert.expect(1);

        var url = '/test/datatable/largedata.json';

        $container.one('create.datatable', function(){
            assert.ok($container.find('.toolbox-container').length === 0, 'pageSizeSelector is not rendered by default');

            ready();
        });

        $container.datatable({
            url : url,
            'model' : [{
                id: 'login',
                label: 'Login',
                sortable: true,
                visible: true
            }, {
                id: 'name',
                label: 'Name',
                sortable: true,
                visible: false
            }, {
                id: 'email',
                label: 'Email',
                sortable: false
            }, {
                id: 'roles',
                label: 'Roles',
                sortable: false,
                visible: function () {
                    return false;
                }
            }, {
                id: 'guiLg',
                label: 'Data Language',
                sortable: false,
                visible: function () {
                    return true;
                }
            }]
        });
    });

    QUnit.test('render pageSizeSelector', function(assert){
        var ready = assert.async();
        var $container = $('#container-1');

        assert.expect(3);

        var url = '/test/datatable/largedata.json';

        $container.one('create.datatable', function(){
            assert.ok($container.find('.datatable-header').length === 1, 'datatableHeader is rendered');
            assert.ok($container.find('.toolbox-container').length === 1, 'pageSizeSelector is rendered');
            assert.equal($container.find('.toolbox-container select').val(), 50, 'rows option is used as default value for pageSizeSelector');

            ready();
        });

        $container.datatable({
            url : url,
            'model' : [{
                id: 'login',
                label: 'Login',
                sortable: true,
                visible: true
            }, {
                id: 'name',
                label: 'Name',
                sortable: true,
                visible: false
            }, {
                id: 'email',
                label: 'Email',
                sortable: false
            }, {
                id: 'roles',
                label: 'Roles',
                sortable: false,
                visible: function () {
                    return false;
                }
            }, {
                id: 'guiLg',
                label: 'Data Language',
                sortable: false,
                visible: function () {
                    return true;
                }
            }],
            pageSizeSelector: true,
            rows: 50,
        });
    });

    QUnit.cases.init([
        {
            initialData: {
                data: [{
                    id: 1,
                    delivery: 1,
                    status: 'paused'
                },
                {
                    id: 2,
                    delivery: 2,
                    status: 'awaiting'
                },
                {
                    id: 3,
                    delivery: 3,
                    status: 'in progress'
                }]
            },
            newData: {
                data: [{
                    id: 1,
                    delivery: 1,
                    status: 'awaiting'
                },
                {
                    id: 2,
                    delivery: 2,
                    status: 'awaiting'
                },
                {
                    id: 3,
                    delivery: 3,
                    status: 'awaiting'
                }]
            }
        }
    ]).test('Atomic update', function(param, assert){
        const ready = assert.async();
        const $container = $('#container-1');
        const url = '/test/datatable/largedata.json';

        assert.expect(5);

        $container.one('create.datatable', function(){
            const statusColumn1 = $container.find('.status').eq(0)

            assert.equal(statusColumn1.text(), 'paused', 'The first delivery status is set');

            $container.one('load.datatable', function(){
                assert.equal(statusColumn1.text(), 'awaiting', 'The first delivery status is changed');
                assert.equal(statusColumn1.get(0), $container.find('.status').get(0), 'The DOM elements for table cells is not changed');

                $container.one('load.datatable', function(){
                    const firstStatusRow = $container.find('.status').get(0);
                    assert.notEqual(statusColumn1.get(0), firstStatusRow, 'Force update should be applied since number of rows is decreased');

                    $container.one('load.datatable', function(){
                        assert.notEqual(firstStatusRow, $container.find('.status').get(0), 'Force update should be applied since the order of rows is changed');
                        ready();
                    });

                    $container.datatable('refresh', {
                        data: [
                        {
                            id: 2,
                            delivery: 2,
                            status: 'awaiting'
                        },
                        {
                            id: 1,
                            delivery: 1,
                            status: 'awaiting'
                        }]
                    });
                });

                $container.datatable('refresh', {
                    data: [{
                        id: 1,
                        delivery: 1,
                        status: 'awaiting'
                    },
                    {
                        id: 2,
                        delivery: 2,
                        status: 'awaiting'
                    }]
                });


            });

            $container.datatable('refresh', param.newData);
        });

        $container.datatable({
            url : url,
            atomicUpdate: true,
            rows: 50,
            model : [{
                id: 'id',
                label: 'delivery',
                sortable: true,
                visible: true
            }, {
                id: 'status',
                label: 'status',
                sortable: true,
                visible: true
            }, {
                id: 'pauseCl',
                label: 'Pause',
                type: 'actions',
                actions: [{
                    id: 'pause',
                    icon: 'pause',
                    label: 'Pause me',
                    title: 'Press to pause process',
                },
                {
                    icon: 'play',
                    label: 'Without id',
                    disabled: true,
                    action: function(id) {
                        console.log('ACTION IS CALLED', id)
                        assert.ok(true, 'In the pause action, id: ' + id);
                    }
                },
                {
                    title: 'Without id, label, icon',
                    action: function(id) {
                        console.log('ACTION IS CALLED', id)
                        assert.ok(true, 'In the pause action, id: ' + id);
                    }
                },
                {
                    id: 'hidden',
                    icon: 'hidden',
                    label: 'hidden',
                    hidden: true,
                    action: function(id) {
                        console.log('ACTION IS CALLED', id)
                        assert.ok(true, 'In the pause action, id: ' + id);
                    }
                },
                {
                    id: 'hidden-without-label-and-icon',
                    action: function(id) {
                        assert.ok(true, 'In the pause action, id: ' + id);
                    }
                },{
                    id: 'disabled',
                    icon: 'disabled',
                    label: 'disabled',
                    title: 'Disabled',
                    disabled: true,
                    action: function(id) {
                        assert.ok(true, 'In the pause action, id: ' + id);
                    }
                },
                {
                    id: 'disabled-without-title',
                    icon: 'disabled',
                    label: 'disabled',
                    disabled: function(){return true},
                    action: function(id) {
                        assert.ok(true, 'In the pause action, id: ' + id);
                    }
                }
            ],
            }]
        },
            {
                id: 'administration',
                label: 'Administration',
                type: 'actions',
                data: [{
                    id: 1,
                    delivery: 1,
                    status: 'paused',
                    actions: [ {
                        id: 'pause',
                        icon: 'pause',
                        label: 'Pause me',
                        title: 'Press to pause process',
                        disabled: function(){return true},
                        action: function(id) {
                            assert.ok(true, 'In the pause action, id: ' + id);
                        }
                    }]
                },
                {
                    id: 2,
                    delivery: 2,
                    status: 'awaiting'
                },
                {
                    id: 3,
                    delivery: 3,
                    status: 'in progress'
                }],
                actions: [{
                    id: 'run',
                    icon: 'play',
                    label: 'Play',
                    title: 'Run action',
                    action: function(id) {
                        console.log('ACTION', 1)
                        assert.ok(true, 'In the run action, id: ' + id);
                    }
                }, {
                    id: 'pause',
                    icon: 'pause',
                    label: 'Pause me',
                    disabled: true,
                    action: function(id) {
                        console.log('ACTION', 2)
                        assert.ok(true, 'In the pause action, id: ' + id);
                    }
                }, {
                    icon: 'stop',
                    label: 'Stop',
                    title: 'Press to stop process',
                    action: function() {
                        console.log('ACTION', 3)
                        assert.ok(true, 'In the stop action');
                    }
                }]
            }
        );
    });

    QUnit.test('Plugin "highlightRows"', function(assert){
        var ready = assert.async();
        var $container = $('#container-1');
        var url = '/test/datatable/largedata.json';

        $container.one('create.datatable', function(){
            const rowIdsToHightLight = ['1', '2'];
            $container.datatable('highlightRows', rowIdsToHightLight);

            assert.equal($container.find('tr.highlight').length, 2, 'The first delivery status is changed');
            ready();
        });

        $container.datatable({
            url : url,
            'model' : [{
                id: 'login',
                label: 'Login',
                sortable: true,
                visible: true
            }, {
                id: 'name',
                label: 'Name',
                sortable: true,
                visible: false
            }, {
                id: 'email',
                label: 'Email',
                sortable: false
            }, {
                id: 'roles',
                label: 'Roles',
                sortable: false,
                visible: function () {
                    return false;
                }
            }, {
                id: 'guiLg',
                label: 'Data Language',
                sortable: false,
                visible: function () {
                    return true;
                }
            }],
            pageSizeSelector: true,
            rows: 50,
        });
    })

    QUnit.test('Plugin "addRowClass"', function(assert){
        const ready = assert.async();
        const $container = $('#container-1');
        const url = '/test/datatable/largedata.json';
        assert.expect(2);

        $container.one('create.datatable', function(){
            const $firstRow = $container.find('tr[data-item-identifier="1"]');

            $container.datatable('addRowClass', '1', 'fake-class');
            $container.datatable('addRowClass', '1', 'fake-class');
            $container.datatable('addRowClass', '1', 'fake-class');

            assert.equal($firstRow.hasClass('fake-class'), true, 'Class is removed from the given row');
            assert.equal($firstRow.attr('class'), 'fake-class', 'Class is added once to the given row');

            ready();
        });

        $container.datatable({
            url : url,
            'model' : [{
                id: 'login',
                label: 'Login',
                sortable: true,
                visible: true
            }, {
                id: 'name',
                label: 'Name',
                sortable: true,
                visible: false
            }, {
                id: 'email',
                label: 'Email',
                sortable: false
            }, {
                id: 'roles',
                label: 'Roles',
                order: 10,
                sortable: false,
                visible: function () {
                    return false;
                }
            }, {
                id: 'guiLg',
                label: 'Data Language',
                sortable: false,
                visible: function () {
                    return true;
                }
            }],
            pageSizeSelector: true,
            rows: 50,
        });
    })

    QUnit.test('Plugin "removeRowClass"', function(assert){
        const ready = assert.async();
        const $container = $('#container-1');
        const url = '/test/datatable/largedata.json';
        assert.expect(1);

        $container.one('create.datatable', function(){
            const $firstRow = $container.find('tr[data-item-identifier="1"]');

            $firstRow.addClass('fake-class');
            $container.datatable('removeRowClass', '1', 'fake-class');
            $container.datatable('removeRowClass', '1', 'remove-no-existing-class');

            assert.equal($firstRow.hasClass('fake-class'), false, 'Class is removed from given row');
            ready();
        });

        $container.datatable({
            url : url,
            'model' : [{
                id: 'login',
                label: 'Login',
                sortable: true,
                visible: true
            }, {
                id: 'name',
                label: 'Name',
                sortable: true,
                visible: false
            }, {
                id: 'email',
                label: 'Email',
                sortable: false
            }, {
                id: 'roles',
                label: 'Roles',
                sortable: false,
                visible: function () {
                    return false;
                }
            }, {
                id: 'guiLg',
                label: 'Data Language',
                sortable: false,
                visible: function () {
                    return true;
                }
            }],
            pageSizeSelector: true,
            rows: 50,
        });
    })

    QUnit.test('It does not render the element is removed while loading', function(assert) {
        assert.expect(2);

        var $container = $('#container-2');
        var $elt = $('.table-container', $container);
        assert.ok($elt.length === 1, 'Test the fixture is available');

        var ready = assert.async();

        $elt.on('query.datatable', () => {
            assert.ok(true, 'The table starts loading');
            $container.html('')
        });
        $elt.on('render', () => {
            assert.ok(false, 'The datable');
            ready();
        });
        $elt.datatable({
            url: '/test/datatable/data.json',
            'model': [{
                id: 'login',
                label: 'Login',
                sortable: true
            }, {
                id: 'name',
                label: 'Name',
                sortable: true
            }, {
                id: 'email',
                label: 'Email',
                sortable: true
            }, {
                id: 'roles',
                label: 'Roles',
                sortable: false
            }, {
                id: 'dataLg',
                label: 'Data Language',
                sortable: true
            }, {
                id: 'guiLg',
                label: 'Interface Language',
                sortable: true
            }]
        });
        setTimeout(() => ready(), 5);
    });
});
