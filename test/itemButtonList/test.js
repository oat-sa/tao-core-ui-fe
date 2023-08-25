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
        {title: 'setActiveItem'},
        {title: 'updateItem'}
    ]).test('own API ', function (data, assert) {
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
            "scoreType": "correct",
            "title": "This is the first question"
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
            "id": "item-3",
            "numericLabel": "3",
            "position": 2,
            "status": "viewed",
            "icon": "info",
            "ariaLabel": "Question 3",
            "scoreType": null
        },
        {
            "id": "item-4",
            "numericLabel": "4",
            "position": 3,
            "status": "unseen",
            "icon": null,
            "ariaLabel": "Question 4",
            "scoreType": null
        },
        {
            "id": "item-5",
            "numericLabel": "5",
            "position": 4,
            "status": "viewed",
            "icon": "flagged",
            "ariaLabel": "Question 5",
            "scoreType": null,
            "disabled": true
        },
        {
            "id": "item-6",
            "numericLabel": "6",
            "position": 5,
            "status": "answered",
            "icon": "time",
            "ariaLabel": "Question 6",
            "scoreType": 'score-pending'
        },
        {
            "id": "item-7",
            "numericLabel": "7",
            "position": 6,
            "status": "answered",
            "icon": "score-partial",
            "ariaLabel": "Question 7",
            "scoreType": 'score-partial'
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

        assert.expect(21);

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
        // Check li correct/incorrect/score-pending/score-partial
        assert.ok(
            instance.getElement().find('li').eq(0).hasClass('correct'),
            'The itemButtonList instance has rendered the button with the correct label'
        );
        assert.ok(
            instance.getElement().find('li').eq(1).hasClass('incorrect'),
            'The itemButtonList instance has rendered the button with the correct label'
        );
        assert.ok(
            instance.getElement().find('li').eq(5).hasClass('score-pending'),
            'The itemButtonList instance has rendered the button with the correct label'
        );
        assert.ok(
            instance.getElement().find('li').eq(6).hasClass('score-partial'),
            'The itemButtonList instance has rendered the button with the correct label'
        );
        // Check li disabled
        assert.ok(
            instance.getElement().find('li').eq(4).hasClass('disabled'),
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
        // Check flagged icon
        assert.equal(
            instance.getElement().find('button .buttonlist-icon.icon-flagged').length,
            basicItems.filter(item => item.icon === 'flagged').length,
            'The itemButtonList instance has rendered the correct number of flagged icon buttons'
        );
        //Check title tooltip
        assert.equal(
            instance.getElement().find('button')[0].title,
            basicItems[0].title,
            'The itemButtonList instance has rendered the button with the correct tooltip'
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

    QUnit.test('api: setActiveItem', function (assert) {
        const $container = $('#fixture-render');
        const instance = itemButtonList({
            renderTo: $container,
            replace: true,
            items: [basicItems[0], basicItems[1]]
        });
        const $component = instance.getElement();

        assert.expect(8);
        assert.equal(instance.is('rendered'), true, 'The itemButtonList instance must be rendered');
        assert.equal($component.length, 1, 'The itemButtonList instance returns the rendered content');

        //Initial state - no active
        assert.equal(
            instance.getElement().find('li.buttonlist-item-active').length,
            0,
            'The itemButtonList instance has no active items'
        );
        assert.equal(
            instance.getElement().find('button[aria-current]').length,
            0,
            'The itemButtonList instance has no active items'
        );

        //Set active
        instance.setActiveItem(basicItems[1].id);

        assert.equal(
            instance.getElement().find('li').eq(1).hasClass(`buttonlist-item-active`),
            true,
            'The itemButtonList instance has an active item'
        );
        assert.equal(
            instance.getElement().find('button')[1].getAttribute('aria-current'),
            'location',
            'The itemButtonList instance has an active item'
        );

        // Remove active
        instance.setActiveItem(null);

        assert.equal(
            instance.getElement().find('li.buttonlist-item-active').length,
            0,
            'The itemButtonList instance has no active items again'
        );
        assert.equal(
            instance.getElement().find('button[aria-current]').length,
            0,
            'The itemButtonList instance has no active items again'
        );

        instance.destroy();
    });

    QUnit.test('api: updateItem', function (assert) {
        const $container = $('#fixture-render');
        const instance = itemButtonList({
            renderTo: $container,
            replace: true,
            items: [basicItems[0], basicItems[1]]
        });
        const $component = instance.getElement();

        assert.expect(13);
        assert.equal(instance.is('rendered'), true, 'The itemButtonList instance must be rendered');
        assert.equal($component.length, 1, 'The itemButtonList instance returns the rendered content');

        const hasIconClass = (idx, iconClass) =>
            instance.getElement().find('button .buttonlist-icon').eq(idx).hasClass(iconClass);
        const getNumericLabel = idx => instance.getElement().find('button')[idx].innerText;
        const getAriaLabel = idx => instance.getElement().find('button')[idx].getAttribute('aria-label');

        //Initial state
        assert.equal(
            hasIconClass(0, 'icon-flagged'),
            false,
            'The itemButtonList instance has expected state before update'
        );
        assert.equal(
            getNumericLabel(0),
            basicItems[0].numericLabel,
            'The itemButtonList instance has expected state before update'
        );
        assert.equal(
            getAriaLabel(0),
            basicItems[0].ariaLabel,
            'The itemButtonList instance has expected state before update'
        );

        //Update: change icon, numericLabel, ariaLabel
        const updateItemData0 = {
            icon: 'flagged',
            numericLabel: '',
            ariaLabel: 'Bookmarked question 1'
        };
        instance.updateItem(basicItems[0].id, updateItemData0);

        assert.equal(
            hasIconClass(0, 'icon-flagged'),
            true,
            'The itemButtonList instance has expected state after update'
        );
        assert.equal(
            getNumericLabel(0),
            updateItemData0.numericLabel,
            'The itemButtonList instance has expected state after update'
        );
        assert.equal(
            getAriaLabel(0),
            updateItemData0.ariaLabel,
            'The itemButtonList instance has expected state after update'
        );

        //Next update: change icon
        const updateItemData1 = {
            icon: 'info'
        };
        instance.updateItem(basicItems[0].id, updateItemData1);

        assert.equal(
            hasIconClass(0, 'icon-flagged'),
            false,
            'The itemButtonList instance has expected state after changing icon'
        );
        assert.equal(
            hasIconClass(0, 'icon-info'),
            true,
            'The itemButtonList instance has expected state after changing icon'
        );
        assert.equal(
            getNumericLabel(0),
            updateItemData0.numericLabel,
            'The itemButtonList instance has expected state after changing icon'
        );
        assert.equal(
            getAriaLabel(0),
            updateItemData0.ariaLabel,
            'The itemButtonList instance has expected state after changing icon'
        );

        //Next update: remove icon
        const updateItemData2 = {
            icon: null
        };
        instance.updateItem(basicItems[0].id, updateItemData2);

        assert.equal(
            hasIconClass(0, 'icon-info'),
            false,
            'The itemButtonList instance has expected state after removing icon'
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
                "scoreType": "correct",
                "title": "This is the first question"
            },
            {
                "id": "item-2",
                "numericLabel": "2",
                "position": 1,
                "status": "viewed",
                "icon": null,
                "ariaLabel": "Question 2",
                "scoreType": null,
                "title": "This is the second question"
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
                "numericLabel": "5",
                "position": 4,
                "status": "unseen",
                "icon": null,
                "ariaLabel": "Question 4",
                "scoreType": null,
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
            },
            {
                "id": "item-7",
                "numericLabel": "7",
                "position": 6,
                "status": "viewed",
                "icon": "flagged",
                "ariaLabel": "Bookmarked question 5",
                "scoreType": null
            },
            {
                "id": "item-8",
                "numericLabel": "8",
                "position": 7,
                "status": "answered",
                "icon": "flagged",
                "ariaLabel": "Bookmarked question 6",
                "scoreType": null
            },
            {
                "id": "item-9",
                "numericLabel": "9",
                "position": 8,
                "status": "unseen",
                "icon": null,
                "ariaLabel": "Question 7",
                "scoreType": null,
                "disabled": true
            },
            {
                "id": "item-10",
                "numericLabel": "10",
                "position": 9,
                "status": "answered",
                "icon": null,
                "ariaLabel": "Question 8",
                "scoreType": "score-partial",
            },
            {
                "id": "item-11",
                "numericLabel": "11",
                "position": 10,
                "status": "answered",
                "icon": null,
                "ariaLabel": "Question 8",
                "scoreType": "score-pending",
            }
        ];


        const $container = $('#visual-test .test');
        $container.append(`
        <ol>
            <li>Answered Correct</li>
            <li>Viewed</li>
            <li>Answered Incorrect</li>
            <li>Viewed Informational (current)</li>
            <li>Unseen</li>
            <li>Unseen Informational</li>
            <li>Viewed Flagged</li>
            <li>Answered Flagged</li>
            <li>Unseen Disabled</li>
            <li>Score partial</li>
            <li>Score pending</li>
        </ol>`);

        const instance = itemButtonList({ items, scrollContainer: $container })
            .on('render', function() {
                assert.ok(true, 'ItemButtonList is rendered');

                this.setActiveItem(items[3].id);
            })
            .on('click', function(event) {
                /* eslint-disable-next-line no-console */
                console.log(`clicked ${JSON.stringify(event)}`);
                this.setActiveItem(event.id);
            })
            .render($container);

        const getItemFromInput = () => {
            const idx = $container.find('.api-index').val();
            return idx ? items[idx] : null;
        };
        $container.find('.api-active').click(() => {
            //check autoscroll: resize container and choose item in the bottom
            const item = getItemFromInput();
            if (item) {
                instance.setActiveItem(item.id);
            }
        });
        $container.find('.api-update').click(() => {
            const item = getItemFromInput();
            if (item) {
                instance.updateItem(item.id, Object.assign({}, item, {
                    icon: item.icon === 'flagged' ? null : 'flagged',
                    numericLabel: item.numericLabel,
                    ariaLabel: 'Updated item'
                }));
            }
        });
    });
});
