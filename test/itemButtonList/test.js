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
 * Copyright (c) 2021 (original work) Open Assessment Technologies SA ;
 */

define([
    'jquery',
    'lodash',
    'ui/itemButtonList'
], function($, _, itemButtonList) {
    'use strict';

    QUnit.module('ItemButtonList Factory');

    QUnit.test('module', function(assert) {
        assert.expect(3);

        assert.equal(typeof itemButtonList, 'function', 'The itemButtonList module exposes a function');
        assert.equal(typeof itemButtonList(), 'object', 'The itemButtonList factory produces an object');
        assert.notStrictEqual(itemButtonList(), itemButtonList(), 'The itemButtonList factory provides a different object on each call');
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
        const instance = itemButtonList();
        assert.expect(1);
        assert.equal(
            typeof instance[data.title],
            'function',
            `The itemButtonList instance exposes a "${data.title}" function`
        );
    });

    QUnit.cases.init([
        {title: 'on'},
        {title: 'off'},
        {title: 'trigger'},
        {title: 'spread'}
    ]).test('event API ', function (data, assert) {
        const instance = itemButtonList();
        assert.expect(1);
        assert.equal(
            typeof instance[data.title],
            'function',
            `The itemButtonList instance exposes a "${data.title}" function`
        );
    });

    const basicItems = [
        {
            "id": "item-1",
            "numericLabel": "1",
            "position": 0,
            "status": "answered",
            "icon": null,
            "ariaLabel": "Question 1",
            "scoreType": "correct"
        },
        {
            "id": "item-2",
            "numericLabel": "2",
            "position": 1,
            "status": "answered",
            "icon": null,
            "ariaLabel": "Question 2",
            "scoreType": "incorrect"
        },
        {
            "id": "item-4",
            "numericLabel": "4",
            "position": 3,
            "status": "viewed",
            "icon": "info",
            "ariaLabel": "Question 4",
            "scoreType": null
        },
        {
            "id": "item-5",
            "numericLabel": "5",
            "position": 4,
            "status": "unseen",
            "icon": null,
            "ariaLabel": "Question 5",
            "scoreType": null
        }
    ];

    QUnit.module('ItemButtonList Lifecycle');

    QUnit.test('render', function(assert) {
        const $container = $('#fixture-render');
        const config = {
            renderTo: $container,
            replace: true,
            items: basicItems
        };
        let instance;

        assert.expect(16);

        // Create an instance with autorendering
        instance = itemButtonList(config);

        // Check the rendered header
        assert.equal(instance.is('rendered'), true, 'The itemButtonList instance must be rendered');
        assert.equal(
            typeof instance.getElement(),
            'object',
            'The itemButtonList instance returns the rendered content as an object'
        );
        assert.equal(instance.getElement().length, 1, 'The itemButtonList instance returns the rendered content');

        assert.ok(instance.getElement().is('ol'), 'The itemButtonList instance has rendered the list');

        // Check lis
        assert.equal(instance.getElement().find('li').length, basicItems.length, 'The itemButtonList instance has rendered the list items');
        // Check li answered/viewed/unseen
        assert.ok(
            instance.getElement().find('li').eq(0).hasClass('answered'),
            'The itemButtonList instance has rendered the button with the correct label'
        );
        assert.ok(
            instance.getElement().find('li').eq(2).hasClass('viewed'),
            'The itemButtonList instance has rendered the button with the correct label'
        );
        assert.ok(
            instance.getElement().find('li').eq(3).hasClass('unseen'),
            'The itemButtonList instance has rendered the button with the correct label'
        );
        // Check li correct/incorrect
        assert.ok(
            instance.getElement().find('li').eq(0).hasClass('correct'),
            'The itemButtonList instance has rendered the button with the correct label'
        );
        assert.ok(
            instance.getElement().find('li').eq(1).hasClass('incorrect'),
            'The itemButtonList instance has rendered the button with the correct label'
        );

        // Check buttons
        // Check label
        assert.equal(
            instance.getElement().find('button')[0].innerText,
            basicItems[0].numericLabel,
            'The itemButtonList instance has rendered the button with the correct label'
        );
        // Check ariaLabel
        assert.equal(
            instance.getElement().find('button')[0].getAttribute('aria-label'),
            basicItems[0].ariaLabel,
            'The itemButtonList instance has rendered the button with the correct ariaLabel'
        );
        // Check data-id
        assert.equal(
            instance.getElement().find('button')[0].dataset.id,
            basicItems[0].id,
            'The itemButtonList instance has rendered the button with the correct data-id'
        );
        // Check informational icon
        assert.equal(
            instance.getElement().find('button .buttonlist-icon.icon-info').length,
            basicItems.filter(item => item.icon === 'info').length,
            'The itemButtonList instance has rendered the correct number of informational icon buttons'
        );

        instance.destroy();

        assert.equal($container.children().length, 0, 'The container is now empty');
        assert.equal(instance.getElement(), null, 'The itemButtonList instance has removed its rendered content');
    });

    QUnit.test('enable/disable', function(assert) {
        const instance = itemButtonList({
            items: [basicItems[0]]
        }).render();
        const $component = instance.getElement();

        assert.expect(8);

        assert.equal(instance.is('rendered'), true, 'The itemButtonList instance must be rendered');
        assert.equal($component.length, 1, 'The itemButtonList instance returns the rendered content');

        assert.equal(instance.is('disabled'), false, 'The itemButtonList instance is enabled');
        assert.notOk(
            $component.hasClass('disabled'),
            'The itemButtonList instance does not have the disabled class'
        );

        instance.disable();

        assert.equal(instance.is('disabled'), true, 'The itemButtonList instance is disabled');
        assert.equal($component.hasClass('disabled'), true, 'The itemButtonList instance has the disabled class');

        instance.enable();

        assert.equal(instance.is('disabled'), false, 'The itemButtonList instance is enabled');
        assert.notOk(
            $component.hasClass('disabled'),
            'The itemButtonList instance does not have the disabled class'
        );

        instance.destroy();
    });

    QUnit.test('events', function(assert) {
        const ready = assert.async();
        const config = {
            items: basicItems
        };
        const instance = itemButtonList(config);

        assert.expect(4);

        Promise.resolve()
            .then(function() {
                return new Promise(function(resolve) {
                    instance
                        .on('ready', function() {
                            assert.ok(true, 'The itemButtonList instance triggers event when it is ready');
                            resolve();
                        })
                        .render();
                });
            })
            .then(function() {
                return new Promise(function(resolve) {
                    instance
                        .on('click', function({ id }) {
                            assert.ok(true, 'The itemButtonList instance call the right action when the button is clicked');
                            assert.equal(
                                id,
                                'item-1',
                                'The itemButtonList instance provides the button identifier when the button is clicked'
                            );
                            resolve();
                        })
                        .getElement().find('[data-id="item-1"]').click();
                });
            })
            .then(function() {
                return new Promise(function(resolve) {
                    instance
                        .on('destroy', function() {
                            assert.ok(true, 'The itemButtonList instance triggers event when it is destroyed');
                            resolve();
                        })
                        .destroy();
                });
            })
            .catch(function (err) {
                assert.ok(false, 'The operation should not fail!');
                assert.pushResult({
                    result: false,
                    message: err
                });
            })
            .then(function() {
                ready();
            });
    });

    QUnit.module('ItemButtonList Visual Test');

    QUnit.test('various buttons', function(assert) {
        assert.expect(1);

        const items = [
            {
                "id": "item-1",
                "numericLabel": "1",
                "position": 0,
                "status": "answered",
                "icon": null,
                "ariaLabel": "Question 1",
                "scoreType": "correct"
            },
            {
                "id": "item-2",
                "numericLabel": "2",
                "position": 1,
                "status": "viewed",
                "icon": null,
                "ariaLabel": "Question 2",
                "scoreType": null
            },
            {
                "id": "item-3",
                "numericLabel": "3",
                "position": 2,
                "status": "answered",
                "icon": null,
                "ariaLabel": "Question 3",
                "scoreType": "incorrect"
            },
            {
                "id": "item-4",
                "numericLabel": "",
                "position": 3,
                "status": "viewed",
                "informational": true,
                "icon": "info",
                "ariaLabel": "Informational item",
                "scoreType": null
            },
            {
                "id": "item-5",
                "numericLabel": "4",
                "position": 4,
                "status": "unseen",
                "icon": null,
                "ariaLabel": "Question 4",
                "scoreType": null
            },
            {
                "id": "item-6",
                "numericLabel": "",
                "position": 5,
                "status": "unseen",
                "informational": true,
                "icon": "info",
                "ariaLabel": "Informational item",
                "scoreType": null
            }
        ];

        const $container = $('#visual-test .test');
        $container.prepend(`<ol>
            <li>Answered Correct</li>
            <li>Viewed</li>
            <li>Answered Incorrect</li>
            <li>Viewed Informational (current)</li>
            <li>Unseen</li>
            <li>Unseen Informational</li>
        </ol>`);

        itemButtonList({ items })
            .on('render', function() {
                assert.ok(true, 'ItemButtonList is rendered');

                this.setActiveItem(items[3].id);
            })
            .on('click', function(event) {
                /* eslint-disable-next-line no-alert */
                alert(`clicked ${JSON.stringify(event)}`);
                this.setActiveItem(event.id);
            })
            .render($container);
    });
});
