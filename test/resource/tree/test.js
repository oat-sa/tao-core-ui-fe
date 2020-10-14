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
 * Copyright (c) 2017 (original work) Open Assessment Technologies SA ;
 */

/**
 * Test the module ui/resource/tree
 *
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */
define([
    'jquery',
    'ui/resource/tree',
    'json!test/ui/resource/tree/root.json',
    'json!test/ui/resource/tree/node.json',
    'css!ui/resource/css/selector'
], function($, resourceTreeFactory, rootData, nodeData) {
    'use strict';

    QUnit.module('API');

    QUnit.test('module', function(assert) {
        assert.expect(3);

        assert.equal(typeof resourceTreeFactory, 'function', 'The resourceTreeFactory module exposes a function');
        assert.equal(typeof resourceTreeFactory(), 'object', 'The resourceTreeFactory produces an object');
        assert.notStrictEqual(
            resourceTreeFactory(),
            resourceTreeFactory(),
            'The resourceTreeFactory provides a different object on each call'
        );
    });

    QUnit.cases
        .init([
            { title: 'init' },
            { title: 'destroy' },
            { title: 'render' },
            { title: 'show' },
            { title: 'hide' },
            { title: 'enable' },
            { title: 'disable' },
            { title: 'is' },
            { title: 'setState' },
            { title: 'getContainer' },
            { title: 'getElement' },
            { title: 'getTemplate' },
            { title: 'setTemplate' }
        ])
        .test('Component API ', function(data, assert) {
            var instance = resourceTreeFactory();
            assert.equal(
                typeof instance[data.title],
                'function',
                'The resourceTree exposes the component method "' + data.title
            );
        });

    QUnit.cases
        .init([{ title: 'on' }, { title: 'off' }, { title: 'trigger' }, { title: 'before' }, { title: 'after' }])
        .test('Eventifier API ', function(data, assert) {
            var instance = resourceTreeFactory();
            assert.equal(
                typeof instance[data.title],
                'function',
                'The resourceTree exposes the eventifier method "' + data.title
            );
        });

    QUnit.cases.init([{ title: 'query' }, { title: 'update' }]).test('Instance API ', function(data, assert) {
        var instance = resourceTreeFactory();
        assert.equal(typeof instance[data.title], 'function', 'The resourceTree exposes the method "' + data.title);
    });

    QUnit.module('Behavior');

    QUnit.test('Lifecycle', function(assert) {
        var ready = assert.async();
        var $container = $('#qunit-fixture');

        assert.expect(2);

        resourceTreeFactory($container, {
            classUri: 'http://bertao/tao.rdf#i1491898694361191'
        })
            .on('init', function() {
                assert.ok(!this.is('rendered'), 'The component is not yet rendered');
            })
            .on('render', function() {
                assert.ok(this.is('rendered'), 'The component is now rendered');

                this.destroy();
            })
            .on('destroy', function() {
                ready();
            });
    });

    QUnit.test('Rendering', function(assert) {
        var ready = assert.async();
        var $container = $('#qunit-fixture');

        assert.expect(12);

        assert.equal($('.resource-tree', $container).length, 0, 'No resource tree in the container');

        resourceTreeFactory($container, {
            classUri: 'http://bertao/tao.rdf#i1491898694361191',
            nodes: rootData
        }).on('render', function() {
            var $element = this.getElement();

            assert.equal($('.resource-tree', $container).length, 1, 'The component has been inserted');
            assert.equal($('.resource-tree', $container)[0], $element[0], 'The component element is correct');

            assert.equal($('> ul > li', $element).length, 1, 'The tree has one root node');
            assert.equal(
                $('> ul > li', $element).data('uri'),
                'http://bertao/tao.rdf#i1491898694361191',
                'The root node uri is correct'
            );
            assert.ok($('> ul > li', $element).hasClass('class'), 'The root node is a class');
            assert.ok($('> ul > li', $element).hasClass('open'), 'The root node is opened');
            assert.ok(!$('> ul > li', $element).hasClass('closed'), 'The root node is open');
            assert.equal(
                $('> ul > li > ul', $element).children('.instance').length,
                5,
                'The root node has 5 instance children'
            );
            assert.equal($('> ul > li > ul', $element).children('.class').length, 4, 'The root node has 4 child class');
            assert.equal(
                $('> ul > li > ul', $element).children('[data-access="partial"]').length,
                2,
                'The root node has 2 children instance with partial access'
            );
            assert.equal(
                $('> ul > li > ul', $element).children('[data-access="denied"]').length,
                2,
                'The root node has 2 children instance with denied access'
            );

            ready();
        });
    });

    QUnit.test('query/update', function(assert) {
        var ready = assert.async();
        var $container = $('#qunit-fixture');

        assert.expect(3);

        resourceTreeFactory($container, {
            classUri: 'http://bertao/tao.rdf#i1491898694361191'
        })
            .on('query', function(params) {
                assert.equal(
                    params.classUri,
                    'http://bertao/tao.rdf#i1491898694361191',
                    'The query has the correct class URI'
                );
                assert.equal($('li', this.getElement()).length, 0, 'The tree contains no nodes');

                this.update(nodeData, params);
            })
            .on('update', function() {
                assert.equal($('li', this.getElement()).length, 3, 'The tree has been updated');

                ready();
            });
    });

    QUnit.test('open closed node', function(assert) {
        var ready = assert.async();
        var $container = $('#qunit-fixture');

        assert.expect(6);

        resourceTreeFactory($container, {
            classUri: 'http://bertao/tao.rdf#i1491898694361191',
            nodes: rootData
        }).on('render', function() {
            var $closedClass = $('[data-uri="http://bertao/tao.rdf#i1491898712953393"]', this.getElement());

            assert.equal($closedClass.length, 1, 'A closed class node has been inserted');
            assert.ok($closedClass.hasClass('closed'), 'The class node is closed');
            assert.equal($closedClass.children('ul').children('li').length, 0, 'The class node is no children');
            assert.equal($closedClass.data('count'), 3, 'The class node expects 3 children');

            this.on('query.foo', function(params) {
                this.off('query.foo');
                this.update(nodeData, params);
            });
            this.on('update', function() {
                assert.ok(!$closedClass.hasClass('closed'), 'The class node is not closed anymore');
                assert.equal($closedClass.children('ul').children('li').length, 3, 'The class node contains children');
                ready();
            });

            $closedClass.click();
        });
    });

    QUnit.test('open empty node', function(assert) {
        var ready = assert.async();
        var $container = $('#qunit-fixture');

        assert.expect(4);

        resourceTreeFactory($container, {
            classUri: 'http://bertao/tao.rdf#i1491898694361191',
            nodes: rootData
        }).on('render', function() {
            var $emptyClass = $('[data-uri="http://bertao/tao.rdf#i1491898702297492"]', this.getElement());

            assert.equal($emptyClass.length, 1, 'An empty class node has been inserted');
            assert.ok($emptyClass.hasClass('empty'), 'The class node is empty');
            assert.equal($emptyClass.children('ul').children('li').length, 0, 'The class node is no children');
            assert.equal($emptyClass.data('count'), 0, 'The class node expects 0 children');

            this.on('query.foo', function() {
                assert.ok(false, 'Should not be here');
                ready();
            });

            $emptyClass.click();
            ready();
        });
    });

    QUnit.test('select nodes', function(assert) {
        const ready = assert.async();
        const $container = $('#qunit-fixture');

        assert.expect(24);

        resourceTreeFactory($container, {
            classUri: 'http://bertao/tao.rdf#i1491898694361191',
            nodes: rootData
        }).on('render', function() {
            let selection = this.getSelection();
            const $node1 = $('[data-uri="http://bertao/tao.rdf#i1491898801542197"]', this.getElement());
            const $node2 = $('[data-uri="http://bertao/tao.rdf#i14918988061562101"]', this.getElement());

            // clickable
            const $nodeInstancePartial = $('[data-uri="http://bertao/tao.rdf#i14918988061562103"]', this.getElement());
            // not clickable
            const $nodeInstanceDenied = $('[data-uri="http://bertao/tao.rdf#i14918988061562102"]', this.getElement());

            function checkNodeInstance ($node) {
                assert.equal($node.length, 1, 'The node1 exists');
                assert.ok($node.hasClass('instance'), 'The node is an instance');
                assert.ok(!$node.hasClass('selected'), 'The node is not selected');
                assert.equal(
                    typeof selection[$node.data('uri')],
                    'undefined',
                    'The selection does not contain the node'
                );
            }

            checkNodeInstance($node1);
            checkNodeInstance($node2);
            checkNodeInstance($nodeInstanceDenied);
            checkNodeInstance($nodeInstancePartial);

            $node1.click();
            $node2.click();
            $nodeInstancePartial.click();
            $nodeInstanceDenied.click();

            selection = this.getSelection();

            assert.ok($node1.hasClass('selected'), 'The node1 is now selected');
            assert.equal(
                typeof selection['http://bertao/tao.rdf#i1491898801542197'],
                'object',
                'The selection contains the node1'
            );
            assert.ok($node2.hasClass('selected'), 'The node2 is now selected');
            assert.equal(
                typeof selection['http://bertao/tao.rdf#i14918988061562101'],
                'object',
                'The selection contains the node2'
            );
            assert.ok($nodeInstancePartial.hasClass('selected'), 'The node instance partial is now selected');
            assert.equal(
                typeof selection['http://bertao/tao.rdf#i14918988061562103'],
                'object',
                'The selection contains the node instance partial'
            );
            assert.ok(!$nodeInstanceDenied.hasClass('selected'), 'The node instance denied is NOT selected');
            assert.equal(
                typeof selection['http://bertao/tao.rdf#i14918988061562102'],
                "undefined",
                'The selection does not contain the node instance denied'
            );

            ready();
        });
    });

    QUnit.test('unique selection', function(assert) {
        var ready = assert.async();
        var $container = $('#qunit-fixture');

        assert.expect(16);

        resourceTreeFactory($container, {
            classUri: 'http://bertao/tao.rdf#i1491898694361191',
            nodes: rootData,
            multiple: false
        }).on('render', function() {
            var selection = this.getSelection();
            var $node1 = $('[data-uri="http://bertao/tao.rdf#i1491898801542197"]', this.getElement());
            var $node2 = $('[data-uri="http://bertao/tao.rdf#i14918988061562101"]', this.getElement());

            assert.equal($node1.length, 1, 'The node1 exists');
            assert.ok($node1.hasClass('instance'), 'The node1 is an instance');
            assert.ok(!$node1.hasClass('selected'), 'The node1 is not selected');
            assert.equal(
                typeof selection['http://bertao/tao.rdf#i1491898801542197'],
                'undefined',
                'The selection does not contain the node1'
            );

            assert.equal($node2.length, 1, 'The node1 exists');
            assert.ok($node2.hasClass('instance'), 'The node1 is an instance');
            assert.ok(!$node2.hasClass('selected'), 'The node1 is not selected');
            assert.equal(
                typeof selection['http://bertao/tao.rdf#i14918988061562101'],
                'undefined',
                'The selection does not contain the noder2'
            );

            $node1.click();

            selection = this.getSelection();

            assert.ok($node1.hasClass('selected'), 'The node1 is now selected');
            assert.equal(
                typeof selection['http://bertao/tao.rdf#i1491898801542197'],
                'object',
                'The selection contains the node1'
            );
            assert.ok(!$node2.hasClass('selected'), 'The node1 is not selected');
            assert.equal(
                typeof selection['http://bertao/tao.rdf#i14918988061562101'],
                'undefined',
                'The selection does not contain the noder2'
            );

            $node2.click();

            selection = this.getSelection();

            assert.ok(!$node1.hasClass('selected'), 'The node1 is not selected anymore');
            assert.equal(
                typeof selection['http://bertao/tao.rdf#i1491898801542197'],
                'undefined',
                'The selection does not contain the node1 anymore'
            );
            assert.ok($node2.hasClass('selected'), 'The node2 is now selected');
            assert.equal(
                typeof selection['http://bertao/tao.rdf#i14918988061562101'],
                'object',
                'The selection contains the node2'
            );

            ready();
        });
    });

    QUnit.test('remove a node', function(assert) {
        var ready = assert.async();
        var $container = $('#qunit-fixture');
        var uri = 'http://bertao/tao.rdf#i1491898801542197';
        var classUri = 'http://bertao/tao.rdf#i1491898694361191';

        assert.expect(11);

        resourceTreeFactory($container, {
            classUri: classUri,
            nodes: rootData
        }).on('render', function() {
            var $classNode = $('[data-uri="' + classUri + '"]', this.getElement());
            var $node = $('[data-uri="' + uri + '"]', this.getElement());

            assert.equal($classNode.length, 1, 'The class node is in the DOM');
            assert.equal($classNode.data('count'), 9, 'The instances count is correct');

            this.after('remove', function(removedUri) {
                assert.equal(removedUri, uri, 'The removedUri is correct');

                assert.ok(!this.hasNode(uri), 'The node is not registerd anymore');
                assert.equal(
                    $('[data-uri="' + uri + '"]', this.getElement()).length,
                    0,
                    'The node is not in the DOM anymore'
                );

                assert.equal($classNode.data('count'), 8, 'The class count has been updated');

                ready();
            });

            assert.ok(!this.hasNode('fooyeh'), 'The fake node is not registered');
            assert.ok(!this.removeNode('fooyeh'), 'Removing a fake node does not work');

            assert.ok(this.hasNode(uri), 'The node is registered');
            assert.equal($node.length, 1, 'The node is in the DOM');

            assert.ok(this.removeNode(uri), 'The removal went well');
        });
    });

    QUnit.module('Visual');

    QUnit.test('playground', function(assert) {
        const ready = assert.async();

        const container = document.getElementById('resource-selector');
        const config = {
            classUri: 'http://bertao/tao.rdf#i1491898694361191',
            nodes: rootData,
            multiple: true,
            icon: 'item'
        };

        assert.expect(1);

        resourceTreeFactory(container, config)
            .on('query', function(params) {
                this.update(nodeData, params);
            })
            .on('render', function() {
                const $selector = $('#resource-selector');
                $selector.css({'opacity': 1});
                assert.ok(true);
                ready();
            });
    });
});
