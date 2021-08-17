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
 * Copyright (c) 2016-2021 (original work) Open Assessment Technologies SA ;
 */
/**
 * @author Christophe Noël <christophe@taotesting.com>
 */
define(['jquery', 'lodash', 'ui/highlighter'], function ($, _, highlighterFactory) {
    'use strict';

    var highlightRangeData;

    QUnit.module('highlighterFactory');

    QUnit.test('module', function (assert) {
        assert.ok(typeof highlighterFactory === 'function', 'the module expose a function');
    });

    QUnit.module('highlighter');

    highlightRangeData = [
        // =============
        // Simple ranges
        // =============

        {
            title: 'fully highlights a plain text node',
            input: 'I should end up fully highlighted',
            selection: 'I should end up fully highlighted',
            output: '<span class="hl" data-hl-group="1">I should end up fully highlighted</span>',
            buildRange: function (range, fixtureContainer) {
                range.selectNodeContents(fixtureContainer);
            },
            highlightIndex: [{ highlighted: true, groupId: '1', c: 'hl' }]
        },

        {
            title: 'partially highlights a plain text node',
            input: 'I should end up partially highlighted',
            selection: 'partially',
            output: 'I should end up <span class="hl" data-hl-group="1">partially</span> highlighted',
            buildRange: function (range, fixtureContainer) {
                range.setStart(fixtureContainer.firstChild, 'I should end up '.length);
                range.setEnd(fixtureContainer.firstChild, 'I should end up partially'.length);
            },
            highlightIndex: [
                {
                    highlighted: true,
                    inlineRanges: [
                        {
                            c: 'hl',
                            groupId: '1',
                            startOffset: 'I should end up '.length,
                            endOffset: 'I should end up partially'.length
                        }
                    ]
                }
            ]
        },

        {
            title: 'partially highlights a plain text node selected from the start',
            input: 'I should end up partially highlighted',
            selection: 'I should end up partially',
            output: '<span class="hl" data-hl-group="1">I should end up partially</span> highlighted',
            buildRange: function (range, fixtureContainer) {
                range.setStart(fixtureContainer.firstChild, 0);
                range.setEnd(fixtureContainer.firstChild, 'I should end up partially'.length);
            },
            highlightIndex: [
                {
                    highlighted: true,
                    inlineRanges: [{ groupId: '1', endOffset: 'I should end up partially'.length, c: 'hl' }]
                }
            ]
        },

        {
            title: 'multiple partial highlights in a plain text node',
            input:
                'How cool is that: <span class="hl" data-hl-group="1">Me</span>, ' +
                '<span class="hl" data-hl-group="5">myself</span> and ' +
                'I' +
                ' are a bunch of <span class="hl" data-hl-group="3">highlighted</span> friends',
            selection: 'I',
            output:
                'How cool is that: <span class="hl" data-hl-group="1">Me</span>, ' +
                '<span class="hl" data-hl-group="2">myself</span> and ' +
                '<span class="hl" data-hl-group="3">I</span>' +
                ' are a bunch of <span class="hl" data-hl-group="4">highlighted</span> friends',
            buildRange: function (range, fixtureContainer) {
                range.setStart(fixtureContainer.childNodes[4], ' and '.length);
                range.setEnd(fixtureContainer.childNodes[4], ' and I'.length);
            },
            highlightIndex: [
                {
                    highlighted: true,
                    inlineRanges: [
                        {
                            c: 'hl',
                            groupId: '1',
                            startOffset: 'How cool is that: '.length,
                            endOffset: 'How cool is that: Me'.length
                        },
                        {
                            c: 'hl',
                            groupId: '2',
                            startOffset: 'How cool is that: Me, '.length,
                            endOffset: 'How cool is that: Me, myself'.length
                        },
                        {
                            c: 'hl',
                            groupId: '3',
                            startOffset: 'How cool is that: Me, myself and '.length,
                            endOffset: 'How cool is that: Me, myself and I'.length
                        },
                        {
                            c: 'hl',
                            groupId: '4',
                            startOffset: 'How cool is that: Me, myself and I are a bunch of '.length,
                            endOffset: 'How cool is that: Me, myself and I are a bunch of highlighted'.length
                        }
                    ]
                }
            ]
        },

        {
            title: 'multiple partial highlights in a plain text node, with highlights at text node boundaries',
            input:
                '<span class="hl" data-hl-group="8">How cool</span> is that: <span class="hl" data-hl-group="1">Me</span>, ' +
                '<span class="hl" data-hl-group="5">myself</span> and ' +
                'I' +
                ' are a bunch of <span class="hl" data-hl-group="3">highlighted friends</span>',
            selection: 'I',
            output:
                '<span class="hl" data-hl-group="1">How cool</span> is that: <span class="hl" data-hl-group="2">Me</span>, ' +
                '<span class="hl" data-hl-group="3">myself</span> and ' +
                '<span class="hl" data-hl-group="4">I</span>' +
                ' are a bunch of <span class="hl" data-hl-group="5">highlighted friends</span>',
            buildRange: function (range, fixtureContainer) {
                range.setStart(fixtureContainer.childNodes[5], ' and '.length);
                range.setEnd(fixtureContainer.childNodes[5], ' and I'.length);
            },
            highlightIndex: [
                {
                    highlighted: true,
                    inlineRanges: [
                        { c: 'hl', groupId: '1', endOffset: 'How cool'.length },
                        {
                            c: 'hl',
                            groupId: '2',
                            startOffset: 'How cool is that: '.length,
                            endOffset: 'How cool is that: Me'.length
                        },
                        {
                            c: 'hl',
                            groupId: '3',
                            startOffset: 'How cool is that: Me, '.length,
                            endOffset: 'How cool is that: Me, myself'.length
                        },
                        {
                            c: 'hl',
                            groupId: '4',
                            startOffset: 'How cool is that: Me, myself and '.length,
                            endOffset: 'How cool is that: Me, myself and I'.length
                        },
                        {
                            c: 'hl',
                            groupId: '5',
                            startOffset: 'How cool is that: Me, myself and I are a bunch of '.length
                        }
                    ]
                }
            ]
        },

        {
            title: 'highlights the text content of a single dom element',
            input: '<div>I should end up fully highlighted</div>',
            selection: '<div>I should end up fully highlighted</div>',
            output: '<div><span class="hl" data-hl-group="1">I should end up fully highlighted</span></div>',
            buildRange: function (range, fixtureContainer) {
                range.selectNode(fixtureContainer.firstChild);
            },
            highlightIndex: [{ highlighted: true, groupId: '1', c: 'hl' }]
        },

        {
            title: 'partially highlights the content of a dom element',
            input: '<div>I should end up partially highlighted</div>',
            selection: 'partially',
            output: '<div>I should end up <span class="hl" data-hl-group="1">partially</span> highlighted</div>',
            buildRange: function (range, fixtureContainer) {
                range.setStart(fixtureContainer.firstChild.firstChild, 'I should end up '.length);
                range.setEnd(fixtureContainer.firstChild.firstChild, 'I should end up partially'.length);
            },
            highlightIndex: [
                {
                    highlighted: true,
                    inlineRanges: [
                        {
                            c: 'hl',
                            groupId: '1',
                            startOffset: 'I should end up '.length,
                            endOffset: 'I should end up partially'.length
                        }
                    ]
                }
            ]
        },

        {
            title: 'highlights the text content of multiple dom elements',
            input:
                '<ul id="list">' +
                '<li>leave me alone</li>' +
                '<li>highlight me!</li>' +
                '<li>highlight me too!</li>' +
                '<li>I am too shy to be highlighted</li>' +
                '</ul>',
            selection: '<li>highlight me!</li>' + '<li>highlight me too!</li>',
            output:
                '<ul id="list">' +
                '<li>leave me alone</li>' +
                '<li><span class="hl" data-hl-group="1">highlight me!</span></li>' +
                '<li><span class="hl" data-hl-group="1">highlight me too!</span></li>' +
                '<li>I am too shy to be highlighted</li>' +
                '</ul>',
            buildRange: function (range) {
                var list = document.getElementById('list');
                range.setStart(list, 1);
                range.setEnd(list, 3);
            },
            highlightIndex: [
                { highlighted: false },
                { highlighted: true, groupId: '1', c: 'hl' },
                { highlighted: true, groupId: '1', c: 'hl' },
                { highlighted: false }
            ]
        },

        {
            title: 'highlights the text content of multiple dom elements with a selection ending in an ',
            input:
                '<ul id="list">' +
                '<li>leave me alone</li>' +
                '<li>highlight me!</li>' +
                '<li>highlight me too!</li>' +
                '<li>I am too shy to be highlighted</li>' +
                '</ul>',
            selection: '<li></li>' + '<li>highlight me!</li>' + '<li>highlight me too!</li>' + '<li></li>',
            output:
                '<ul id="list">' +
                '<li>leave me alone</li>' +
                '<li><span class="hl" data-hl-group="1">highlight me!</span></li>' +
                '<li><span class="hl" data-hl-group="1">highlight me too!</span></li>' +
                '<li>I am too shy to be highlighted</li>' +
                '</ul>',
            buildRange: function (range) {
                var list = document.getElementById('list');

                // This actually happens in real-world selection scenarios
                // instead of ending the selection at the end of the previous node,
                // it is ended in the current node with an end offset of 0
                range.setEnd(list.childNodes[3].firstChild, 0);

                // This hasn\'t been observed real-world, but we mirror the previous case to be on the safe side,
                // meaning we start the selection at the end of the previous node
                range.setStart(list.childNodes[0].firstChild, list.childNodes[0].firstChild.length);
            },
            highlightIndex: [
                { highlighted: false },
                { highlighted: true, groupId: '1', c: 'hl' },
                { highlighted: true, groupId: '1', c: 'hl' },
                { highlighted: false }
            ]
        },

        {
            title: 'highlights a fully selected text with a nested node',
            input: 'We, meaning <strong>me and my children</strong> should end up fully highlighted',
            selection: 'We, meaning <strong>me and my children</strong> should end up fully highlighted',
            output:
                '<span class="hl" data-hl-group="1">We, meaning </span>' +
                '<strong><span class="hl" data-hl-group="1">me and my children</span></strong>' +
                '<span class="hl" data-hl-group="1"> should end up fully highlighted</span>',
            buildRange: function (range, fixtureContainer) {
                range.selectNodeContents(fixtureContainer);
            },
            highlightIndex: [
                { highlighted: true, groupId: '1', c: 'hl' },
                { highlighted: true, groupId: '1', c: 'hl' },
                { highlighted: true, groupId: '1', c: 'hl' }
            ]
        },

        {
            title: 'highlights a partially selected text with a nested node',
            input: 'We, meaning <strong>me and my children</strong> should end up partially highlighted',
            selection: 'meaning <strong>me and my children</strong> should end up',
            output:
                'We, <span class="hl" data-hl-group="1">meaning </span>' +
                '<strong><span class="hl" data-hl-group="1">me and my children</span></strong>' +
                '<span class="hl" data-hl-group="1"> should end up</span> partially highlighted',
            buildRange: function (range, fixtureContainer) {
                range.setStart(fixtureContainer.firstChild, 'We, '.length);
                range.setEnd(fixtureContainer.lastChild, ' should end up'.length);
            },
            highlightIndex: [
                { highlighted: true, inlineRanges: [{ c: 'hl', groupId: '1', startOffset: 'We, '.length }] },
                { highlighted: true, c: 'hl', groupId: '1' },
                { highlighted: true, inlineRanges: [{ c: 'hl', groupId: '1', endOffset: ' should end up'.length }] }
            ]
        },

        {
            title: 'highlights a partially selected text containing non-nested node',
            input: 'My <strong>siblings</strong> should not bother me <strong>at all</strong>',
            selection: 'not bother ',
            output:
                'My <strong>siblings</strong> should ' +
                '<span class="hl" data-hl-group="1">not bother </span>' +
                'me <strong>at all</strong>',
            buildRange: function (range, fixtureContainer) {
                range.setStart(fixtureContainer.childNodes[2], ' should '.length);
                range.setEnd(fixtureContainer.childNodes[2], ' should not bother '.length);
            },
            highlightIndex: [
                { highlighted: false },
                { highlighted: false },
                {
                    highlighted: true,
                    inlineRanges: [
                        {
                            c: 'hl',
                            groupId: '1',
                            startOffset: ' should '.length,
                            endOffset: ' should not bother '.length
                        }
                    ]
                },
                { highlighted: false }
            ]
        },

        // ====================================
        // Ranges with partially selected nodes
        // ====================================

        {
            title: 'highlights a selection ending in a partially selected node',
            input: 'I should be highlighted <strong>even if I was poorly selected...</strong>',
            selection:
                'highlighted <strong>even if I was' +
                // Added upon invalid range => HTML conversion
                '</strong>',
            output:
                'I should be <span class="hl" data-hl-group="1">highlighted </span>' +
                '<strong><span class="hl" data-hl-group="1">even if I was</span>' +
                ' poorly selected...</strong>',
            buildRange: function (range, fixtureContainer) {
                range.setStart(fixtureContainer.firstChild, 'I should be '.length);
                range.setEnd(fixtureContainer.lastChild.firstChild, 'even if I was'.length);
            },
            highlightIndex: [
                { highlighted: true, inlineRanges: [{ c: 'hl', groupId: '1', startOffset: 'I should be '.length }] },
                { highlighted: true, inlineRanges: [{ c: 'hl', groupId: '1', endOffset: 'even if I was'.length }] }
            ]
        },

        {
            title: 'highlights a selection starting in a partially selected node',
            input: '<strong>I should be highlighted</strong> even if I was poorly selected...',

            // Added upon invalid range => HTML conversion
            selection: '<strong>' + 'highlighted</strong> even if I was',
            output:
                '<strong>I should be <span class="hl" data-hl-group="1">highlighted</span></strong>' +
                '<span class="hl" data-hl-group="1"> even if I was</span>' +
                ' poorly selected...',
            buildRange: function (range, fixtureContainer) {
                range.setStart(fixtureContainer.firstChild.firstChild, 'I should be '.length);
                range.setEnd(fixtureContainer.lastChild, ' even if I was'.length);
            },
            highlightIndex: [
                { highlighted: true, inlineRanges: [{ c: 'hl', groupId: '1', startOffset: 'I should be '.length }] },
                { highlighted: true, inlineRanges: [{ c: 'hl', groupId: '1', endOffset: ' even if I was'.length }] }
            ]
        },
        {
            title: 'Highlights a range containing multiples nodes, 1',
            input:
                '<p>I am on top of the list</p>' +
                '<p>There is a nice view up here</p>' +
                '<ul id="list">' +
                '<li>I am the first option</li>' +
                '<li>I am the second option</li>' +
                '<li>I am the <span class="some-class">third</span> option</li>' +
                '<li>Do not chose the fourth option !</li>' +
                '</ul>' +
                '<div><p><span>The list</span> is <strong>finished</strong>, see you soon !</p></div>',
            // Added upon invalid range => HTML conversion
            selection:
                '<p>' +
                'ce view up here</p>' +
                '<ul id="list">' +
                '<li>I am the first option</li>' +
                '<li>I am the second option</li>' +
                '<li>I am the <span class="some-class">third</span> option</li>' +
                '<li>Do not chose the fourth option !</li>' +
                '</ul>',
            output:
                '<p>I am on top of the list</p>' +
                '<p>There is a ni<span class="hl" data-hl-group="1">ce view up here</span></p>' +
                '<ul id="list">' +
                '<li><span class="hl" data-hl-group="1">I am the first option</span></li>' +
                '<li><span class="hl" data-hl-group="1">I am the second option</span></li>' +
                '<li><span class="hl" data-hl-group="1">I am the </span><span class="some-class"><span class="hl" data-hl-group="1">third</span></span><span class="hl" data-hl-group="1"> option</span></li>' +
                '<li><span class="hl" data-hl-group="1">Do not chose the fourth option !</span></li>' +
                '</ul>' +
                '<div><p><span>The list</span> is <strong>finished</strong>, see you soon !</p></div>',
            buildRange: function (range, fixtureContainer) {
                range.setStart(fixtureContainer.childNodes[1].firstChild, 'There is a ni'.length);
                range.setEnd(fixtureContainer, 3);
            },
            highlightIndex: [
                { highlighted: false },
                { highlighted: true, inlineRanges: [{ c: 'hl', groupId: '1', startOffset: 'There is a ni'.length }] },
                { highlighted: true, c: 'hl', groupId: '1' },
                { highlighted: true, c: 'hl', groupId: '1' },
                { highlighted: true, c: 'hl', groupId: '1' },
                { highlighted: true, c: 'hl', groupId: '1' },
                { highlighted: true, c: 'hl', groupId: '1' },
                { highlighted: true, c: 'hl', groupId: '1' },
                { highlighted: false },
                { highlighted: false },
                { highlighted: false },
                { highlighted: false }
            ]
        },

        {
            title: 'Highlights a range containing multiples nodes, 2',
            input:
                '<p>I am on top of the list</p>' +
                '<p>There is a nice view up here</p>' +
                '<ul id="list">' +
                '<li>I am the first option</li>' +
                '<li>I am the second option</li>' +
                '<li>I am the <span class="some-class">third</span> option</li>' +
                '<li>Do not chose the fourth option !</li>' +
                '</ul>' +
                '<div><p id="end-p"><span>The list</span> is <strong>finished</strong>, see you soon !</p></div>',
            // Added upon invalid range => HTML conversion
            selection:
                '<ul id="list"><li><span class="some-class">' +
                'ird</span> option</li>' +
                '<li>Do not chose the fourth option !</li>' +
                '</ul>' +
                '<div><p id="end-p"><span>The list</span> is <strong>finished</strong>, see you' +
                // Added upon invalid range => HTML conversion
                '</p></div>',
            output:
                '<p>I am on top of the list</p>' +
                '<p>There is a nice view up here</p>' +
                '<ul id="list">' +
                '<li>I am the first option</li>' +
                '<li>I am the second option</li>' +
                '<li>I am the <span class="some-class">th<span class="hl" data-hl-group="1">ird</span></span><span class="hl" data-hl-group="1"> option</span></li>' +
                '<li><span class="hl" data-hl-group="1">Do not chose the fourth option !</span></li>' +
                '</ul>' +
                '<div><p id="end-p"><span><span class="hl" data-hl-group="1">The list</span></span><span class="hl" data-hl-group="1"> is </span><strong><span class="hl" data-hl-group="1">finished</span></strong><span class="hl" data-hl-group="1">, see you</span> soon !</p></div>',
            buildRange: function (range) {
                var startNode = document.getElementsByClassName('some-class').item(0).firstChild;
                var endNode = document.getElementById('end-p').childNodes[3];
                range.setStart(startNode, 'th'.length);
                range.setEnd(endNode, ', see you'.length);
            },
            highlightIndex: [
                { highlighted: false },
                { highlighted: false },
                { highlighted: false },
                { highlighted: false },
                { highlighted: false },
                { highlighted: true, inlineRanges: [{ c: 'hl', groupId: '1', startOffset: 'th'.length }] },
                { highlighted: true, c: 'hl', groupId: '1' },
                { highlighted: true, c: 'hl', groupId: '1' },
                { highlighted: true, c: 'hl', groupId: '1' },
                { highlighted: true, c: 'hl', groupId: '1' },
                { highlighted: true, c: 'hl', groupId: '1' },
                { highlighted: true, inlineRanges: [{ c: 'hl', groupId: '1', endOffset: ', see you'.length }] }
            ]
        },

        {
            title: 'Highlights a range containing multiples nodes, 3',
            input:
                '<p>I am on top of the list</p>' +
                '<p>There is a nice view up here</p>' +
                '<ul id="list">' +
                '<li>I am the first option</li>' +
                '<li>I am the second option</li>' +
                '<li>I am the <span class="some-class">third</span> option</li>' +
                '<li>Do not chose the fourth option !</li>' +
                '</ul>' +
                '<div><p id="end-p"><span>The list</span> is <strong>finished</strong>, see you soon !</p></div>',
            selection:
                '<p>I am on top of the list</p>' +
                '<p>There is a nice view up here</p>' +
                '<ul id="list">' +
                '<li>I am the first option</li>' +
                '<li>I am the second option</li>' +
                '<li>I am' +
                // Added upon invalid range => HTML conversion
                '</li></ul>',
            output:
                '<p><span class="hl" data-hl-group="1">I am on top of the list</span></p>' +
                '<p><span class="hl" data-hl-group="1">There is a nice view up here</span></p>' +
                '<ul id="list">' +
                '<li><span class="hl" data-hl-group="1">I am the first option</span></li>' +
                '<li><span class="hl" data-hl-group="1">I am the second option</span></li>' +
                '<li><span class="hl" data-hl-group="1">I am</span> the <span class="some-class">third</span> option</li>' +
                '<li>Do not chose the fourth option !</li>' +
                '</ul>' +
                '<div><p id="end-p"><span>The list</span> is <strong>finished</strong>, see you soon !</p></div>',
            buildRange: function (range, fixtureContainer) {
                var startNode = fixtureContainer.firstChild;
                var endNode = document.getElementById('list').childNodes[2].firstChild;
                range.setStart(startNode, 0);
                range.setEnd(endNode, 'I am'.length);
            },
            highlightIndex: [
                { highlighted: true, c: 'hl', groupId: '1' },
                { highlighted: true, c: 'hl', groupId: '1' },
                { highlighted: true, c: 'hl', groupId: '1' },
                { highlighted: true, c: 'hl', groupId: '1' },
                { highlighted: true, inlineRanges: [{ c: 'hl', groupId: '1', endOffset: 'I am'.length }] },
                { highlighted: false },
                { highlighted: false },
                { highlighted: false },
                { highlighted: false },
                { highlighted: false },
                { highlighted: false },
                { highlighted: false }
            ]
        },

        // ========================================
        // Ranges with exotic elements & edge cases
        // ========================================

        {
            title: 'highlights a node with an image inside',
            input: 'There is an image <img src="/tao/views/img/logo_tao.png"> in the middle of this selection',
            selection: 'There is an image <img src="/tao/views/img/logo_tao.png"> in the middle of this selection',
            output:
                '<span class="hl" data-hl-group="1">There is an image </span><img src="/tao/views/img/logo_tao.png"><span class="hl" data-hl-group="1"> in the middle of this selection</span>',
            buildRange: function (range, fixtureContainer) {
                range.selectNodeContents(fixtureContainer);
            },
            highlightIndex: [
                { c: 'hl', highlighted: true, groupId: '1' },
                { c: 'hl', highlighted: true, groupId: '1' }
            ]
        },

        {
            title: 'do not highlight text in a selected textarea',
            input: '<textarea>Leave me alone, I am inside a text area</textarea>',
            selection: '<textarea>Leave me alone, I am inside a text area</textarea>',
            output: '<textarea>Leave me alone, I am inside a text area</textarea>',
            buildRange: function (range, fixtureContainer) {
                range.selectNodeContents(fixtureContainer);
            },
            highlightIndex: []
        },

        {
            title: 'do not highlight text fully selected in a textarea',
            input: '<textarea>Leave me alone, I am inside a text area</textarea>',
            selection: 'Leave me alone, I am inside a text area',
            output: '<textarea>Leave me alone, I am inside a text area</textarea>',
            buildRange: function (range, fixtureContainer) {
                range.selectNodeContents(fixtureContainer.firstChild);
            },
            highlightIndex: []
        },

        {
            title: 'do not highlight text partially selected in a textarea',
            input: '<textarea>Leave me alone, I am inside a text area</textarea>',
            selection: 'I am inside',
            output: '<textarea>Leave me alone, I am inside a text area</textarea>',
            buildRange: function (range, fixtureContainer) {
                range.setStart(fixtureContainer.firstChild.firstChild, 'Leave me alone, '.length);
                range.setEnd(fixtureContainer.firstChild.firstChild, 'Leave me alone, I am inside'.length);
            },
            highlightIndex: []
        },

        {
            title: 'do not highlight text in a nested textarea',
            input: '<div>this selection <textarea>contains</textarea> a textarea</div>',
            selection: '<div>this selection <textarea>contains</textarea> a textarea</div>',
            output:
                '<div><span class="hl" data-hl-group="1">this selection </span>' +
                '<textarea>contains</textarea>' +
                '<span class="hl" data-hl-group="1"> a textarea</span></div>',
            buildRange: function (range, fixtureContainer) {
                range.selectNodeContents(fixtureContainer);
            },
            highlightIndex: [
                { c: 'hl', highlighted: true, groupId: '1' },
                { c: 'hl', highlighted: true, groupId: '1' }
            ]
        },

        {
            title: 'do not highlight text inside an input',
            input: '<input value="Don\'t you dare highlighting me!!!" type="text">',
            selection: '<input value="Don\'t you dare highlighting me!!!" type="text">',
            output: '<input value="Don\'t you dare highlighting me!!!" type="text">',
            buildRange: function (range, fixtureContainer) {
                range.selectNodeContents(fixtureContainer);
            },
            highlightIndex: []
        },

        {
            title: 'do not highlight blacklisted container children',
            blacklisted: ['.qti-include'],
            input:
                '<p>We <strong>all</strong> live in a </p>' +
                '<div class="qti-include">blacklisted</div>' +
                '<p>highlighted group</p>',
            selection:
                '<p>We <strong>all</strong> live in a </p>' +
                '<div class="qti-include">blacklisted</div>' +
                '<p>highlighted group</p>',
            output:
                '<p><span class="hl" data-hl-group="1">We </span>' +
                '<strong><span class="hl" data-hl-group="1">all</span></strong>' +
                '<span class="hl" data-hl-group="1"> live in a </span></p>' +
                '<div class="qti-include">blacklisted</div>' +
                '<p><span class="hl" data-hl-group="1">highlighted group</span></p>',
            buildRange: function (range, fixtureContainer) {
                range.selectNodeContents(fixtureContainer);
            },
            highlightIndex: [
                { highlighted: true, c: 'hl', groupId: '1' },
                { highlighted: true, c: 'hl', groupId: '1' },
                { highlighted: true, c: 'hl', groupId: '1' },
                { highlighted: true, c: 'hl', groupId: '1' }
            ]
        },

        {
            title: 'highlight whitelisted nodes inside blacklisted container',
            blacklisted: ['.bl'],
            whitelisted: ['.wh'],
            input:
                '<div class="bl">outside<div class="wh">inside</div></div>' +
                '<div class="wh">inside</div>' +
                '<div class="bl">outside<div class="wh">inside<div class="bl">outside</div></div></div>' +
                '<div class="unrelated">inside</div>',
            selection:
                '<div class="bl">outside<div class="wh">inside</div></div>' +
                '<div class="wh">inside</div>' +
                '<div class="bl">outside<div class="wh">inside<div class="bl">outside</div></div></div>' +
                '<div class="unrelated">inside</div>',
            output:
                '<div class="bl">outside<div class="wh"><span class="hl" data-hl-group="1">inside</span></div></div>' +
                '<div class="wh"><span class="hl" data-hl-group="1">inside</span></div>' +
                '<div class="bl">outside<div class="wh"><span class="hl" data-hl-group="1">inside</span><div class="bl">outside</div></div></div>' +
                '<div class="unrelated"><span class="hl" data-hl-group="1">inside</span></div>',
            buildRange: function (range, fixtureContainer) {
                range.selectNodeContents(fixtureContainer);
            },
            highlightIndex: [
                { highlighted: true, c: 'hl', groupId: '1' },
                { highlighted: true, c: 'hl', groupId: '1' },
                { highlighted: true, c: 'hl', groupId: '1' },
                { highlighted: true, c: 'hl', groupId: '1' }
            ]
        },

        // ===========================
        // Groups & overlapping ranges
        // ===========================

        {
            title: 'adds a group id to the highlight wrapper',
            input: 'We <strong>all</strong> live in a <span class="yellow">yellow</span> highlighted group',
            selection: 'We <strong>all</strong> live in a <span class="yellow">yellow</span> highlighted group',
            output:
                '<span class="hl" data-hl-group="1">We </span>' +
                '<strong><span class="hl" data-hl-group="1">all</span></strong>' +
                '<span class="hl" data-hl-group="1"> live in a </span>' +
                '<span class="yellow"><span class="hl" data-hl-group="1">yellow</span></span>' +
                '<span class="hl" data-hl-group="1"> highlighted group</span>',
            buildRange: function (range, fixtureContainer) {
                range.selectNodeContents(fixtureContainer);
            },
            highlightIndex: [
                { highlighted: true, c: 'hl', groupId: '1' },
                { highlighted: true, c: 'hl', groupId: '1' },
                { highlighted: true, c: 'hl', groupId: '1' },
                { highlighted: true, c: 'hl', groupId: '1' },
                { highlighted: true, c: 'hl', groupId: '1' }
            ]
        },

        {
            title: 'select the next available group id',
            input: '<span class="hl" data-hl-group="1">I am enlightened</span>, will you join me?',
            selection: 'will you join me?',
            output:
                '<span class="hl" data-hl-group="1">I am enlightened</span>, ' +
                '<span class="hl" data-hl-group="2">will you join me?</span>',
            buildRange: function (range, fixtureContainer) {
                range.setStart(fixtureContainer.childNodes[1], ', '.length);
                range.setEnd(fixtureContainer.childNodes[1], ', will you join me?'.length);
            },
            highlightIndex: [
                {
                    highlighted: true,
                    inlineRanges: [
                        { c: 'hl', groupId: '1', endOffset: 'I am enlightened'.length },
                        { c: 'hl', groupId: '2', startOffset: 'I am enlightened, '.length }
                    ]
                }
            ]
        },

        {
            title: 'create a single group if two consecutive text node are highlighted',
            input: '<span class="hl" data-hl-group="1">I already saw the light</span>, and so did you',
            selection: ', and so did you',
            output: '<span class="hl" data-hl-group="1">I already saw the light, and so did you</span>',
            buildRange: function (range, fixtureContainer) {
                range.selectNodeContents(fixtureContainer.childNodes[1]);
            },
            highlightIndex: [{ highlighted: true, c: 'hl', groupId: '1' }]
        },

        {
            title: 'create a single group if two text selections are joined',
            input:
                '<span class="hl" data-hl-group="1">I already saw the light</span>, and soon, <span class="hl" data-hl-group="5">we will all had</span>',
            selection: ', and soon, ',
            output: '<span class="hl" data-hl-group="1">I already saw the light, and soon, we will all had</span>',
            buildRange: function (range, fixtureContainer) {
                range.selectNodeContents(fixtureContainer.childNodes[1]);
            },
            highlightIndex: [{ highlighted: true, c: 'hl', groupId: '1' }]
        },

        {
            title: 'create a single group if two node selections are joined',
            input:
                '<ul id="list">' +
                '<li><span class="hl" data-hl-group="5">For now</span></li>' +
                '<li>We all belong</li>' +
                '<li><span class="hl" data-hl-group="3">To a different group</span></li>' +
                '</ul>',
            selection: '<li>We all belong</li>',
            output:
                '<ul id="list">' +
                '<li><span class="hl" data-hl-group="1">For now</span></li>' +
                '<li><span class="hl" data-hl-group="1">We all belong</span></li>' +
                '<li><span class="hl" data-hl-group="1">To a different group</span></li>' +
                '</ul>',
            buildRange: function (range, fixtureContainer) {
                range.setStart(fixtureContainer.firstChild, 1);
                range.setEnd(fixtureContainer.firstChild, 2);
            },
            highlightIndex: [
                { highlighted: true, c: 'hl', groupId: '1' },
                { highlighted: true, c: 'hl', groupId: '1' },
                { highlighted: true, c: 'hl', groupId: '1' }
            ]
        },

        {
            title: 'does not highlight an already highlighted text',
            input: '<span class="hl" data-hl-group="1">I already saw the light</span>',
            selection: 'I already saw the light',
            output: '<span class="hl" data-hl-group="1">I already saw the light</span>',
            buildRange: function (range, fixtureContainer) {
                range.selectNodeContents(fixtureContainer.firstChild.firstChild);
            },
            highlightIndex: [{ highlighted: true, c: 'hl', groupId: '1' }]
        },

        {
            title: 'does not highlight an already highlighted portion of text',
            input:
                '<span class="hl" data-hl-group="1">I already have more highlight that I need, leave me alone</span>',
            selection: 'highlight',
            output:
                '<span class="hl" data-hl-group="1">I already have more highlight that I need, leave me alone</span>',
            buildRange: function (range, fixtureContainer) {
                range.setStart(fixtureContainer.firstChild.firstChild, 'I already have more '.length);
                range.setEnd(fixtureContainer.firstChild.firstChild, 'I already have more highlight'.length);
            },
            highlightIndex: [{ highlighted: true, c: 'hl', groupId: '1' }]
        },

        {
            title: 'does not highlight an already highlighted node',
            input: '<span class="hl" data-hl-group="1">I already saw the light</span>',
            selection: '<span class="hl" data-hl-group="1">I already saw the light</span>',
            output: '<span class="hl" data-hl-group="1">I already saw the light</span>',
            buildRange: function (range, fixtureContainer) {
                range.selectNodeContents(fixtureContainer);
            },
            highlightIndex: [{ highlighted: true, c: 'hl', groupId: '1' }]
        },

        {
            title: 'merge existing highlights when fully overlapped by a new plain text selection',
            input: 'This <span class="hl" data-hl-group="2">existing highlight</span> is about to be extended',
            selection: 'This <span class="hl" data-hl-group="2">existing highlight</span> is about to be extended',
            output: '<span class="hl" data-hl-group="1">This existing highlight is about to be extended</span>',
            buildRange: function (range, fixtureContainer) {
                range.selectNodeContents(fixtureContainer);
            },
            highlightIndex: [{ highlighted: true, c: 'hl', groupId: '1' }]
        },

        {
            title: 'merge existing highlights when fully overlapped by a new selection',
            input:
                '<ul id="list">' +
                "<li>I'm too dark</li>" +
                '<li><span class="hl" data-hl-group="3">I already saw the light</span></li>' +
                '<li>So <span class="hl" data-hl-group="2">did</span> I!</li>' +
                '<li>Can you please enlighten me?</li>' +
                '</ul>',
            selection:
                "<li>I'm too dark</li>" +
                '<li><span class="hl" data-hl-group="3">I already saw the light</span></li>' +
                '<li>So <span class="hl" data-hl-group="2">did</span> I!</li>' +
                '<li>Can you please enlighten me?</li>',
            output:
                '<ul id="list">' +
                '<li><span class="hl" data-hl-group="1">I\'m too dark</span></li>' +
                '<li><span class="hl" data-hl-group="1">I already saw the light</span></li>' +
                '<li><span class="hl" data-hl-group="1">So did I!</span></li>' +
                '<li><span class="hl" data-hl-group="1">Can you please enlighten me?</span></li>' +
                '</ul>',
            buildRange: function (range, fixtureContainer) {
                range.setStart(fixtureContainer.firstChild, 0);
                range.setEnd(fixtureContainer.firstChild, 4);
            },
            highlightIndex: [
                { highlighted: true, c: 'hl', groupId: '1' },
                { highlighted: true, c: 'hl', groupId: '1' },
                { highlighted: true, c: 'hl', groupId: '1' },
                { highlighted: true, c: 'hl', groupId: '1' }
            ]
        },

        {
            title: 'extend existing highlight on the left',
            input: 'This <span class="hl" data-hl-group="2">existing highlight</span> is about to be extended',
            selection:
                'This <span class="hl" data-hl-group="2">existing' +
                // Added upon invalid range => HTML conversion,
                '</span>',
            output: '<span class="hl" data-hl-group="1">This existing highlight</span> is about to be extended',
            buildRange: function (range, fixtureContainer) {
                range.setStart(fixtureContainer.firstChild, 0);
                range.setEnd(fixtureContainer.childNodes[1].firstChild, 'existing'.length);
            },
            highlightIndex: [
                {
                    highlighted: true,
                    inlineRanges: [{ c: 'hl', groupId: '1', endOffset: 'This existing highlight'.length }]
                }
            ]
        },

        {
            title: 'extend existing highlight on the right',
            input: 'This <span class="hl" data-hl-group="2">existing highlight</span> is about to be extended',
            // Added upon invalid range => HTML conversion
            selection: '<span class="hl" data-hl-group="2">' + 'highlight</span> is about to',
            output: 'This <span class="hl" data-hl-group="1">existing highlight is about to</span> be extended',
            buildRange: function (range, fixtureContainer) {
                range.setStart(fixtureContainer.childNodes[1].firstChild, 'existing '.length);
                range.setEnd(fixtureContainer.childNodes[2], ' is about to'.length);
            },
            highlightIndex: [
                {
                    highlighted: true,
                    inlineRanges: [
                        {
                            c: 'hl',
                            groupId: '1',
                            startOffset: 'This '.length,
                            endOffset: 'This existing highlight is about to'.length
                        }
                    ]
                }
            ]
        },

        {
            title: 'join partially selected highlights, with another one in the middle',
            input:
                '<strong><span class="hl" data-hl-group="2">Look what is about to happen</span></strong>' +
                '<span class="hl" data-hl-group="2">This existing highlight</span>' +
                ' will <span class="hl" data-hl-group="6">soon</span> be joined ' +
                '<span class="hl" data-hl-group="4">by a new one</span>' +
                '<strong><span class="hl" data-hl-group="4">how cool is that ?!</span></strong>',
            // Added upon invalid range => HTML conversion
            selection:
                '<span class="hl" data-hl-group="2">' +
                'highlight</span>' +
                ' will <span class="hl" data-hl-group="6">soon</span> be joined ' +
                '<span class="hl" data-hl-group="4">by a ' +
                // Added upon invalid range => HTML conversion
                '</span>',
            output:
                '<strong><span class="hl" data-hl-group="1">Look what is about to happen</span></strong>' +
                '<span class="hl" data-hl-group="1">This existing highlight will soon be joined by a new one</span>' +
                '<strong><span class="hl" data-hl-group="1">how cool is that ?!</span></strong>',
            buildRange: function (range, fixtureContainer) {
                range.setStart(fixtureContainer.childNodes[1].firstChild, 'This existing '.length);
                range.setEnd(fixtureContainer.childNodes[5].firstChild, 'by a '.length);
            },
            highlightIndex: [
                { highlighted: true, groupId: '1', c: 'hl' },
                { highlighted: true, groupId: '1', c: 'hl' },
                { highlighted: true, groupId: '1', c: 'hl' }
            ]
        }
    ];

    QUnit.cases.init(highlightRangeData).test('HighlightRange', function (data, assert) {
        // Setup test
        var highlighter = highlighterFactory({
            className: 'hl',
            containerSelector: '#qunit-fixture',
            containersBlackList: data.blacklisted,
            containersWhiteList: data.whitelisted
        });
        var range = document.createRange();
        var highlightIndex;
        var rangeHtml;

        var fixtureContainer = document.getElementById('qunit-fixture');

        if (!data.whitelisted) { //TODO: implement and update test
            assert.expect(8);
        } else {
            assert.expect(4);
        }

        fixtureContainer.innerHTML = data.input;

        // The following assertion is just to provide a better visual feedback in QUnit UI
        assert.equal(fixtureContainer.innerHTML, data.input, 'input: ' + data.input);

        // Create range, then make sure it is correctly built
        data.buildRange(range, fixtureContainer);
        rangeHtml = $('<div>').append(range.cloneContents()).html(); // This conversion to HTML will automatically close partially selected nodes, if any
        assert.equal(rangeHtml, data.selection, 'selection: ' + data.selection);

        // Highlight
        highlighter.highlightRanges([range]);
        assert.equal(fixtureContainer.innerHTML, data.output, 'highlight: ' + data.output);

        // Save highlight
        if (!data.whitelisted) { //TODO: implement and update test
            highlightIndex = highlighter.getHighlightIndex();
            assert.ok(_.isArray(highlightIndex), 'getHighlightIndex returns an array');
            assert.equal(highlightIndex.length, data.highlightIndex.length, 'array has the correct size');
            assert.deepEqual(highlightIndex, data.highlightIndex, 'array has the correct content');
        }

        // Reset markup
        fixtureContainer.innerHTML = '';
        assert.equal(fixtureContainer.innerHTML, '', 'markup has been deleted');

        // Re-add markup and remove any existing highlight in fixture
        fixtureContainer.innerHTML = data.input;
        highlighter.clearHighlights();

        // Restore highlight
        if (!data.whitelisted) { //TODO: implement and update test
            highlighter.highlightFromIndex(highlightIndex);
            assert.equal(fixtureContainer.innerHTML, data.output, 'highlight has been restored');
        }
    });

    QUnit.test('clearHighlights', function (assert) {
        // Setup test
        var highlighter = highlighterFactory({
            className: 'hl',
            containerSelector: '#qunit-fixture',
            containersBlackList: []
        });
        var range = document.createRange();

        var fixtureContainer = document.getElementById('qunit-fixture');

        assert.expect(2);

        fixtureContainer.innerHTML = '<div>lorem</div>ipsum<div>dolor</div>sit<div>amet</div>';

        // Create three separated higlights
        range.setStart(fixtureContainer.childNodes[0].firstChild, 0);
        range.setEnd(fixtureContainer.childNodes[0].firstChild, 5);
        highlighter.highlightRanges([range]);

        range.setStart(fixtureContainer.childNodes[2].firstChild, 0);
        range.setEnd(fixtureContainer.childNodes[2].firstChild, 5);
        highlighter.highlightRanges([range]);

        range.setStart(fixtureContainer.childNodes[4].firstChild, 0);
        range.setEnd(fixtureContainer.childNodes[4].firstChild, 4);
        highlighter.highlightRanges([range]);

        // Get higlighted node attributes
        var highlightsAttributes = $(fixtureContainer)
            .find('.hl')
            .map(function (index, node) {
                return $(node).attr('data-hl-group');
            })
            .toArray();

        assert.deepEqual(highlightsAttributes, ['1', '2', '3'], 'Three separated higlights has been created');

        // Clear all highlits
        highlighter.clearHighlights();

        assert.equal($(fixtureContainer).find('.hl').length, 0, 'All higlights has been discarded');
    });

    QUnit.test('clearSingleHighlight', function (assert) {
        // Setup test
        var highlighter = highlighterFactory({
            className: 'hl',
            containerSelector: '#qunit-fixture',
            containersBlackList: [],
            clearOnClick: true
        });
        var range = document.createRange();

        var fixtureContainer = document.getElementById('qunit-fixture');

        assert.expect(4);

        fixtureContainer.innerHTML = '<div>lorem</div>ipsum<div>dolor</div>sit<div>amet</div>';

        // Create three separated higlights
        range.setStart(fixtureContainer.childNodes[0].firstChild, 0);
        range.setEnd(fixtureContainer.childNodes[0].firstChild, 5);
        highlighter.highlightRanges([range]);

        range.setStart(fixtureContainer.childNodes[2].firstChild, 0);
        range.setEnd(fixtureContainer.childNodes[2].firstChild, 5);
        highlighter.highlightRanges([range]);

        range.setStart(fixtureContainer.childNodes[4].firstChild, 0);
        range.setEnd(fixtureContainer.childNodes[4].firstChild, 4);
        highlighter.highlightRanges([range]);

        // Get higlighted node attributes
        var highlightsAttributes = $(fixtureContainer)
            .find('.hl')
            .map(function (index, node) {
                return $(node).attr('data-hl-group');
            })
            .toArray();

        assert.deepEqual(highlightsAttributes, ['1', '2', '3'], 'Three separated higlights has been created');
        var higlights = $(fixtureContainer).find('.hl');

        // Clear first higlight
        higlights[0].click();

        assert.equal($(fixtureContainer).find('.hl').length, 2, 'First higlight has been discarded');

        // Clear second higlight
        higlights[1].click();

        assert.equal($(fixtureContainer).find('.hl').length, 1, 'Second higlight has been discarded');

        // Clear third higlight
        higlights[2].click();

        assert.equal($(fixtureContainer).find('.hl').length, 0, 'Third higlight has been discarded');
    });

    QUnit.module('highlighter with multi colors');

    QUnit.cases
        .init([
            {
                title: 'Highlight next siblings with a different color',
                initialContent: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
                contentBeforeApplyingHighlighter:
                    'Lorem Ipsum is <span class="pink" data-hl-group="1">simply </span>dummy text of the printing and typesetting industry.',
                contentAfterApplyingHighlighter:
                    'Lorem Ipsum is <span class="pink" data-hl-group="1">simply </span><span class="ocher" data-hl-group="1">dummy</span> text of the printing and typesetting industry.',
                buildRange: function (range, fixtureContainer) {
                    const pinkNode = fixtureContainer.childNodes[1];
                    range.setStart(pinkNode.nextSibling, 0);
                    range.setEnd(pinkNode.nextSibling, 'dummy'.length);
                },
                highlightIndex: [
                    {
                        highlighted: true,
                        inlineRanges: [
                            {
                                c: 'pink',
                                endOffset: 'Lorem Ipsum is simply '.length,
                                groupId: '1',
                                startOffset: 'Lorem Ipsum is '.length
                            },
                            {
                                c: 'ocher',
                                endOffset: 'Lorem Ipsum is simply dummy'.length,
                                groupId: '1',
                                startOffset: 'Lorem Ipsum is simply '.length
                            }
                        ]
                    }
                ]
            },
            {
                title:
                    'Highlight with a different color words that has space between. The first highlight at the beginning of sentence',
                initialContent: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
                contentBeforeApplyingHighlighter:
                    '<span class="pink" data-hl-group="1">Lorem</span> Ipsum is simply dummy text of the printing and typesetting industry.',
                contentAfterApplyingHighlighter:
                    '<span class="pink" data-hl-group="1">Lorem</span> <span class="ocher" data-hl-group="2">Ipsum </span>is simply dummy text of the printing and typesetting industry.',
                buildRange: function (range, fixtureContainer) {
                    const pinkNode = fixtureContainer.childNodes[0];
                    range.setStart(pinkNode.nextSibling, ' '.length);
                    range.setEnd(pinkNode.nextSibling, ' Ipsum '.length);
                },
                highlightIndex: [
                    {
                        highlighted: true,
                        inlineRanges: [
                            {
                                c: 'pink',
                                endOffset: 'Lorem'.length,
                                groupId: '1'
                            },
                            {
                                c: 'ocher',
                                endOffset: 'Lorem Ipsum '.length,
                                groupId: '2',
                                startOffset: 'Lorem '.length
                            }
                        ]
                    }
                ]
            },

            {
                title: 'Highlight with a different color words that has space between',
                initialContent: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
                contentBeforeApplyingHighlighter:
                    '<span class="pink" data-hl-group="1">Lorem</span> Ipsum is simply dummy text of the printing and typesetting industry.',
                contentAfterApplyingHighlighter:
                    '<span class="pink" data-hl-group="1">Lorem</span> <span class="ocher" data-hl-group="2">Ipsum</span> is simply dummy text of the printing and typesetting industry.',
                buildRange: function (range, fixtureContainer) {
                    const pinkNode = fixtureContainer.childNodes[0];
                    range.setStart(pinkNode.nextSibling, ' '.length);
                    range.setEnd(pinkNode.nextSibling, ' Ipsum'.length);
                },
                highlightIndex: [
                    {
                        highlighted: true,
                        inlineRanges: [
                            {
                                c: 'pink',
                                endOffset: 'Lorem'.length,
                                groupId: '1'
                            },
                            {
                                c: 'ocher',
                                endOffset: 'Lorem Ipsum'.length,
                                groupId: '2',
                                startOffset: 'Lorem '.length
                            }
                        ]
                    }
                ]
            },

            {
                title: 'Highlight with a different color words that has space between',
                initialContent: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
                contentBeforeApplyingHighlighter:
                    '<span class="pink" data-hl-group="1">Lorem</span> Ipsum is simply dummy text of the printing and typesetting industry.',
                contentAfterApplyingHighlighter:
                    '<span class="pink" data-hl-group="1">Lorem</span> I<span class="ocher" data-hl-group="2">psum</span> is simply dummy text of the printing and typesetting industry.',
                buildRange: function (range, fixtureContainer) {
                    const pinkNode = fixtureContainer.childNodes[0];
                    range.setStart(pinkNode.nextSibling, ' I'.length);
                    range.setEnd(pinkNode.nextSibling, ' Ipsum'.length);
                },
                highlightIndex: [
                    {
                        highlighted: true,
                        inlineRanges: [
                            {
                                c: 'pink',
                                endOffset: 'Lorem'.length,
                                groupId: '1'
                            },
                            {
                                c: 'ocher',
                                endOffset: 'Lorem Ipsum'.length,
                                groupId: '2',
                                startOffset: 'Lorem I'.length
                            }
                        ]
                    }
                ]
            },
            {
                title:
                    'Override highlights with a different color the selection contains one highlighted node with a different color',
                initialContent: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
                contentBeforeApplyingHighlighter:
                    'Lorem Ipsum is simply <span class="pink" data-hl-group="1">dummy</span> text of the printing and typesetting industry.',
                contentAfterApplyingHighlighter:
                    '<span class="ocher" data-hl-group="1">Lorem Ipsum is simply dummy text</span> of the printing and typesetting industry.',
                buildRange: function (range, fixtureContainer) {
                    const pinkNode = fixtureContainer.childNodes[1];
                    range.setStart(fixtureContainer.childNodes[0], 0);
                    range.setEnd(pinkNode.nextSibling, ' text'.length);
                },
                highlightIndex: [
                    {
                        highlighted: true,
                        inlineRanges: [
                            {
                                c: 'ocher',
                                endOffset: 'Lorem Ipsum is simply dummy text'.length,
                                groupId: '1'
                            }
                        ]
                    }
                ]
            },
            {
                title: 'Override highlights with a different color the selection contains one highlighted node',
                initialContent: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
                contentBeforeApplyingHighlighter:
                    'Lorem Ipsum is simply <span class="pink" data-hl-group="1">dummy</span> text of the printing and typesetting industry.',
                contentAfterApplyingHighlighter:
                    'Lorem Ipsum is <span class="ocher" data-hl-group="1">simply dummy</span> text of the printing and typesetting industry.',
                buildRange: function (range, fixtureContainer) {
                    range.setStart(fixtureContainer.childNodes[0], 'Lorem Ipsum is '.length);
                    range.setEnd(fixtureContainer.childNodes[2], 0);
                },
                highlightIndex: [
                    {
                        highlighted: true,
                        inlineRanges: [
                            {
                                c: 'ocher',
                                endOffset: 'Lorem Ipsum is simply dummy'.length,
                                groupId: '1',
                                startOffset: 'Lorem Ipsum is '.length
                            }
                        ]
                    }
                ]
            },

            {
                title: 'Partially override highlighted node with another color',
                initialContent: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
                contentBeforeApplyingHighlighter:
                    'Lorem Ipsum is <span class="pink" data-hl-group="1">simply dummy</span> text of the printing and typesetting industry.',
                contentAfterApplyingHighlighter:
                    'Lorem Ipsum is <span class="pink" data-hl-group="1">simply dum</span><span class="ocher" data-hl-group="1">my</span> text of the printing and typesetting industry.',
                buildRange: function (range, fixtureContainer) {
                    range.setStart(fixtureContainer.childNodes[1].childNodes[0], 'simply dum'.length);
                    range.setEnd(fixtureContainer.childNodes[1].childNodes[0], 'simply dummy'.length);
                },
                highlightIndex: [
                    {
                        highlighted: true,
                        inlineRanges: [
                            {
                                c: 'pink',
                                endOffset: 'Lorem Ipsum is simply dum'.length,
                                groupId: '1',
                                startOffset: 'Lorem Ipsum is '.length
                            },
                            {
                                c: 'ocher',
                                endOffset: 'Lorem Ipsum is simply dummy'.length,
                                groupId: '1',
                                startOffset: 'Lorem Ipsum is simply dum'.length
                            }
                        ]
                    }
                ]
            },

            {
                title: 'Highlight piece of highlighted content in different color',
                initialContent: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
                contentBeforeApplyingHighlighter:
                    'Lorem Ipsum is <span class="pink" data-hl-group="1">simply dummy</span> text of the printing and typesetting industry.',
                contentAfterApplyingHighlighter:
                    'Lorem Ipsum is <span class="pink" data-hl-group="1">simp</span><span class="ocher" data-hl-group="1">ly du</span><span class="pink" data-hl-group="1">mmy</span> text of the printing and typesetting industry.',
                buildRange: function (range, fixtureContainer) {
                    range.setStart(fixtureContainer.childNodes[1].childNodes[0], 'simp'.length);
                    range.setEnd(fixtureContainer.childNodes[1].childNodes[0], 'simply du'.length);
                },
                highlightIndex: [
                    {
                        highlighted: true,
                        inlineRanges: [
                            {
                                c: 'pink',
                                endOffset: 'Lorem Ipsum is simp'.length,
                                groupId: '1',
                                startOffset: 'Lorem Ipsum is '.length
                            },
                            {
                                c: 'ocher',
                                endOffset: 'Lorem Ipsum is simply du'.length,
                                groupId: '1',
                                startOffset: 'Lorem Ipsum is simp'.length
                            },
                            {
                                c: 'pink',
                                endOffset: 'Lorem Ipsum is simply dummy'.length,
                                groupId: '1',
                                startOffset: 'Lorem Ipsum is simply du'.length
                            }
                        ]
                    }
                ]
            },

            {
                title: 'Highlight piece of highlighted content in different color',
                initialContent: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
                contentBeforeApplyingHighlighter:
                    'Lorem Ipsum is <span class="pink" data-hl-group="1">simply dummy</span> text of the printing and typesetting industry.',
                contentAfterApplyingHighlighter:
                    'Lorem Ipsum is <span class="pink" data-hl-group="1">simp</span><span class="ocher" data-hl-group="1">ly du</span><span class="pink" data-hl-group="1">mmy</span> text of the printing and typesetting industry.',
                buildRange: function (range, fixtureContainer) {
                    range.setStart(fixtureContainer.childNodes[1].childNodes[0], 'simp'.length);
                    range.setEnd(fixtureContainer.childNodes[1].childNodes[0], 'simply du'.length);
                },
                highlightIndex: [
                    {
                        highlighted: true,
                        inlineRanges: [
                            {
                                c: 'pink',
                                endOffset: 'Lorem Ipsum is simp'.length,
                                groupId: '1',
                                startOffset: 'Lorem Ipsum is '.length
                            },
                            {
                                c: 'ocher',
                                endOffset: 'Lorem Ipsum is simply du'.length,
                                groupId: '1',
                                startOffset: 'Lorem Ipsum is simp'.length
                            },
                            {
                                c: 'pink',
                                endOffset: 'Lorem Ipsum is simply dummy'.length,
                                groupId: '1',
                                startOffset: 'Lorem Ipsum is simply du'.length
                            }
                        ]
                    }
                ]
            },

            {
                title: 'Highlighted content inside and outside of simple tag',
                initialContent: 'Lorem Ipsum is <p>simply</p> dummy text of the printing and typesetting industry.',
                contentBeforeApplyingHighlighter:
                    'Lorem Ipsum is <p>simply</p> dummy text of the printing and typesetting industry.',
                contentAfterApplyingHighlighter:
                    'Lorem Ipsum is <p>sim<span class="ocher" data-hl-group="1">ply</span></p><span class="ocher" data-hl-group="1"> dummy</span> text of the printing and typesetting industry.',
                buildRange: function (range, fixtureContainer) {
                    range.setStart(fixtureContainer.childNodes[1].childNodes[0], 'sim'.length);
                    range.setEnd(fixtureContainer.childNodes[2], ' dummy'.length);
                },
                highlightIndex: [
                    {
                        highlighted: false
                    },
                    {
                        highlighted: true,
                        inlineRanges: [
                            {
                                c: 'ocher',
                                groupId: '1',
                                startOffset: 'sim'.length
                            }
                        ]
                    },
                    {
                        highlighted: true,
                        inlineRanges: [
                            {
                                c: 'ocher',
                                endOffset: ' dummy'.length,
                                groupId: '1'
                            }
                        ]
                    }
                ]
            },
            {
                title: 'Highlighted content with simple tag inside',
                initialContent: 'Lorem Ipsum is <p>simply</p> dummy text of the printing and typesetting industry.',
                contentBeforeApplyingHighlighter:
                    'Lorem Ipsum is <p>simply</p> dummy text of the printing and typesetting industry.',
                contentAfterApplyingHighlighter:
                    'Lorem <span class="ocher" data-hl-group="1">Ipsum is </span><p><span class="ocher" data-hl-group="1">simply</span></p><span class="ocher" data-hl-group="1"> dummy</span> text of the printing and typesetting industry.',
                buildRange: function (range, fixtureContainer) {
                    range.setStart(fixtureContainer.childNodes[0], 'Lorem '.length);
                    range.setEnd(fixtureContainer.childNodes[2], ' dummy'.length);
                },
                highlightIndex: [
                    {
                        highlighted: true,
                        inlineRanges: [
                            {
                                c: 'ocher',
                                groupId: '1',
                                startOffset: 'Lorem '.length
                            }
                        ]
                    },
                    {
                        c: 'ocher',
                        groupId: '1',
                        highlighted: true
                    },
                    {
                        highlighted: true,
                        inlineRanges: [
                            {
                                c: 'ocher',
                                endOffset: ' dummy'.length,
                                groupId: '1'
                            }
                        ]
                    }
                ]
            },

            {
                title: 'Override highlighted nodes with one color',
                initialContent: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
                contentBeforeApplyingHighlighter:
                    'Lorem Ipsum is <span class="ocher" data-hl-group="1">simply</span> dummy <span class="blue" data-hl-group="1">text</span> of <span class="pink" data-hl-group="1">the</span> printing and typesetting industry.',
                contentAfterApplyingHighlighter:
                    'Lorem <span class="ocher" data-hl-group="1">Ipsum is simply dummy text of the printing</span> and typesetting industry.',
                buildRange: function (range, fixtureContainer) {
                    const lastChildNode = fixtureContainer.childNodes[fixtureContainer.childNodes.length - 1];
                    range.setStart(fixtureContainer.childNodes[0], 'Lorem '.length);
                    range.setEnd(lastChildNode, ' printing'.length);
                },
                highlightIndex: [
                    {
                        highlighted: true,
                        inlineRanges: [
                            {
                                c: 'ocher',
                                endOffset: 'Lorem Ipsum is simply dummy text of the printing'.length,
                                groupId: '1',
                                startOffset: 'Lorem '.length
                            }
                        ]
                    }
                ]
            },

            // NOTE: Related to https://oat-sa.atlassian.net/browse/MS-1071
            //
            {
                title: 'Override highlights with a different color the selection contains two highlighted nodes',
                initialContent: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
                contentBeforeApplyingHighlighter:
                    'Lorem Ipsum is simply <span class="pink" data-hl-group="1">dummy</span> <span class="pink" data-hl-group="1">text</span> of the printing and typesetting industry.',
                contentAfterApplyingHighlighter:
                    'Lorem Ipsum is <span class="ocher" data-hl-group="1">simply dummy text</span> of the printing and typesetting industry.',
                buildRange: function (range, fixtureContainer) {
                    const lastChild = fixtureContainer.childNodes[fixtureContainer.childNodes.length - 1];
                    range.setStart(fixtureContainer.childNodes[0], 'Lorem Ipsum is '.length);
                    range.setEnd(lastChild, ''.length);
                },
                highlightIndex: [
                    {
                        highlighted: true,
                        inlineRanges: [
                            {
                                c: 'ocher',
                                endOffset: 'Lorem Ipsum is simply dummy text'.length,
                                groupId: '1',
                                startOffset: 'Lorem Ipsum is '.length
                            }
                        ]
                    }
                ]
            },

            // NOTE: Related to https://oat-sa.atlassian.net/browse/MS-1077
            {
                title: 'The user should not be able to highlight line break',
                initialContent: 'Lorem Ipsum\n of the printing and typesetting industry.',
                contentBeforeApplyingHighlighter: 'Lorem Ipsum\n of the printing and typesetting industry.',
                contentAfterApplyingHighlighter: 'Lorem Ipsum\n of the printing and typesetting industry.',
                buildRange: function (range, fixtureContainer) {
                    range.setStart(fixtureContainer.childNodes[0], 'Lorem Ipsum'.length);
                    range.setEnd(fixtureContainer.childNodes[0], 'Lorem Ipsum\n'.length);
                },
                highlightIndex: [
                    {
                        highlighted: false
                    }
                ]
            }
        ])
        .test('setup', function (data, assert) {
            const colors = {
                ocher: 'ocher',
                pink: 'pink',
                blue: 'blue'
            };

            const highlighter = highlighterFactory({
                className: colors.ocher,
                containerSelector: '#qunit-fixture',
                containersBlackList: [],
                colors: colors
            });

            var range = document.createRange();
            var highlightIndex;

            var fixtureContainer = document.getElementById('qunit-fixture');

            assert.expect(6);

            fixtureContainer.innerHTML = data.contentBeforeApplyingHighlighter;

            // The following assertion is just to provide a better visual feedback in QUnit UI
            assert.equal(
                fixtureContainer.innerHTML,
                data.contentBeforeApplyingHighlighter,
                'before highlight: ' + data.contentBeforeApplyingHighlighter
            );

            // Create range, then make sure it is correctly built
            data.buildRange(range, fixtureContainer);

            // Highlight
            highlighter.highlightRanges([range]);
            assert.equal(
                fixtureContainer.innerHTML,
                data.contentAfterApplyingHighlighter,
                'after highlight: ' + data.contentAfterApplyingHighlighter
            );

            // Save highlight
            highlightIndex = highlighter.getHighlightIndex();
            assert.ok(_.isArray(highlightIndex), 'getHighlightIndex returns an array');
            assert.equal(highlightIndex.length, data.highlightIndex.length, 'array has the correct size');
            assert.deepEqual(highlightIndex, data.highlightIndex, 'array has the correct content');

            // Re-add markup and remove any existing highlight in fixture
            fixtureContainer.innerHTML = data.initialContent;

            // Restore highlight
            highlighter.highlightFromIndex(highlightIndex);
            assert.equal(
                fixtureContainer.innerHTML,
                data.contentAfterApplyingHighlighter,
                'highlight has been restored'
            );
        });

    QUnit.module('with keepEmptyNodes option');

    QUnit.test('highlightRanges: empty nodes are not removed', function (assert) {
        const highlighter = highlighterFactory({
            keepEmptyNodes: true,
            className: 'hl',
            containerSelector: '#qunit-fixture',
            containersBlackList: ['.blacklist']
        });
        var range = document.createRange();
        var fixtureContainer = document.getElementById('qunit-fixture');

        assert.expect(3);

        fixtureContainer.innerHTML = '<span>lorem</span>  <span>ipsum</span>\n<span>dolor</span>sit';
        fixtureContainer.childNodes[5].splitText(0); //|sit
        const emptyNodeOne = fixtureContainer.childNodes[5];
        const emptyNodeTwo = fixtureContainer.childNodes[6].splitText(3); //|sit|

        //Highlight all
        range.selectNodeContents(fixtureContainer);
        highlighter.highlightRanges([range]);

        assert.equal(
            fixtureContainer.innerHTML,
            '<span><span class="hl" data-hl-group="1">lorem</span></span>  <span><span class="hl" data-hl-group="2">ipsum</span></span>\n'+
                '<span><span class="hl" data-hl-group="3">dolor</span></span><span class="hl" data-hl-group="4">sit</span>',
            'Highlights were created and space-only nodes were not removed'
        );
        assert.equal(fixtureContainer.childNodes[5], emptyNodeOne, 'Empty nodes were not removed (1)');
        assert.equal(fixtureContainer.childNodes[7], emptyNodeTwo, 'Empty nodes were not removed (2)');
    });

    QUnit.test('highlightRanges: merge adjacent', function (assert) {
        const highlighter = highlighterFactory({
            keepEmptyNodes: true,
            className: 'hl',
            containerSelector: '#qunit-fixture',
            containersBlackList: []
        });
        var range = document.createRange();
        var fixtureContainer = document.getElementById('qunit-fixture');

        assert.expect(3);

        fixtureContainer.innerHTML = 'Lorem Ipsum is';
        const emptyNode = fixtureContainer.firstChild.splitText(14);

        //Create three highlights: '[Lore]m Ipsu[m] [is]'
        range.setStart(fixtureContainer.childNodes[0], 0);
        range.setEnd(fixtureContainer.childNodes[0], 4);
        highlighter.highlightRanges([range]);

        range.setStart(fixtureContainer.childNodes[1], 6);
        range.setEnd(fixtureContainer.childNodes[1], 7);
        highlighter.highlightRanges([range]);

        range.setStart(fixtureContainer.childNodes[3], 1);
        range.setEnd(fixtureContainer.childNodes[3], 3);
        highlighter.highlightRanges([range]);

        assert.equal(
            fixtureContainer.innerHTML,
            '<span class="hl" data-hl-group="1" data-before-was-split="false" data-after-was-split="true">Lore</span>m Ipsu' +
                '<span class="hl" data-hl-group="2" data-before-was-split="true" data-after-was-split="true">m</span> ' +
                '<span class="hl" data-hl-group="3" data-before-was-split="true" data-after-was-split="false">is</span>',
            'First highlights were created'
        );
        fixtureContainer.childNodes[0].dataset.beforeWasSplit = 'abc'; //to make testing easier
        fixtureContainer.childNodes[0].dataset.afterWasSplit = 'def';
        fixtureContainer.childNodes[2].dataset.beforeWasSplit = 'ghi';
        fixtureContainer.childNodes[2].dataset.afterWasSplit = 'jkl';
        fixtureContainer.childNodes[4].dataset.beforeWasSplit = 'mno';
        fixtureContainer.childNodes[4].dataset.afterWasSplit = 'pqr';

        //Create highlight over it: '[Lorem Ipsum is]'
        var range2 = document.createRange();
        range2.setStart(fixtureContainer.childNodes[1], 0);
        range2.setEnd(fixtureContainer.childNodes[3], 1);
        highlighter.highlightRanges([range2]);

        assert.equal(
            fixtureContainer.innerHTML,
            '<span class="hl" data-hl-group="1" data-before-was-split="abc" data-after-was-split="pqr">Lorem Ipsum is</span>',
            'Split data is recalculated on merging highlights'
        );

       assert.equal(fixtureContainer.childNodes[1], emptyNode, 'Empty nodes were not removed');
    });

    QUnit.test('clearHighlights: only nodes split by highlighter are merged back', function (assert) {
        var highlighter = highlighterFactory({
            keepEmptyNodes: true,
            className: 'hl',
            containerSelector: '#qunit-fixture',
            containersBlackList: []
        });
        var range = document.createRange();

        var fixtureContainer = document.getElementById('qunit-fixture');

        function assertChildNodes(node, textContents, message) {
            assert.equal(node.childNodes.length, textContents.length, message);
            textContents.forEach((text, i) => {
                assert.equal(node.childNodes[i].textContent, text, `${message} ${i+1}`);
            });
        }

        assert.expect(9);

        fixtureContainer.innerHTML = '<div>lorem</div>ipsum<div>dolor</div>sit<div>amet</div>';
        fixtureContainer.childNodes[2].firstChild.splitText(2);
        fixtureContainer.childNodes[2].lastChild.splitText(2); //do|lo|r
        fixtureContainer.childNodes[4].lastChild.splitText(4); //amet|

        // Create two separated higlights
        range.setStart(fixtureContainer.childNodes[0].firstChild, 2);
        range.setEnd(fixtureContainer.childNodes[0].firstChild, 4);
        highlighter.highlightRanges([range]); //lo[re]m

        range.setStart(fixtureContainer.childNodes[2].childNodes[1], 0);
        range.setEnd(fixtureContainer.childNodes[2].childNodes[1], 2);
        highlighter.highlightRanges([range]); //do[lo]r

        assert.equal($(fixtureContainer).find('.hl').length, 2, 'Two higlights have been created');

        // Clear all highlights
        highlighter.clearHighlights();

        assert.equal($(fixtureContainer).find('.hl').length, 0, 'All higlights have been discarded');

        assertChildNodes(fixtureContainer.childNodes[0], ['lorem'], 'Nodes splitted by highlighter were merged back');
        assertChildNodes(fixtureContainer.childNodes[2], ['do', 'lo', 'r'], 'Originally splitted nodes were not merged back');
        assert.equal(fixtureContainer.childNodes[4].lastChild.textContent, '', 'Empty nodes were not removed');
    });


    QUnit.test('clearSingleHighlight: only nodes split by highlighter are merged back', function (assert) {
        var highlighter = highlighterFactory({
            keepEmptyNodes: true,
            className: 'hl',
            containerSelector: '#qunit-fixture',
            containersBlackList: []
        });
        var range = document.createRange();

        var fixtureContainer = document.getElementById('qunit-fixture');

        function assertChildNodes(node, textContents, message) {
            assert.equal(node.childNodes.length, textContents.length, message);
            textContents.forEach((text, i) => {
                assert.equal(node.childNodes[i].textContent, text, `${message} ${i+1}`);
            });
        }

        assert.expect(27);

        fixtureContainer.innerHTML = '<div>lorem</div><div>ipsum</div><div>dolor</div><div>sit</div><div>amet</div><div>consectetur</div><div>adipiscing</div>elit';
        //'<div>lorem</div><div>ipsum</div><div>dolor</div><div>sit</div><div>am|et</div><div>consectet|ur</div><div>ad|i|piscing</div>';
        fixtureContainer.childNodes[4].firstChild.splitText(2); //am|et
        fixtureContainer.childNodes[5].firstChild.splitText(9); //consectet|ur
        fixtureContainer.childNodes[6].firstChild.splitText(2);
        fixtureContainer.childNodes[6].lastChild.splitText(1); //ad|i|piscing
        fixtureContainer.childNodes[7].splitText(0); //|elit

        // Create seven separated higlights
        //'<div>[lorem]</div><div>[ip]sum</div><div>dol[or]</div><div>s[i]t</div><div>[am]et</div><div>consectet[ur]</div><div>ad[i]piscing</div>|elit';
        range.setStart(fixtureContainer.childNodes[0].firstChild, 0);
        range.setEnd(fixtureContainer.childNodes[0].firstChild, 5);
        highlighter.highlightRanges([range]);

        range.setStart(fixtureContainer.childNodes[1].firstChild, 0);
        range.setEnd(fixtureContainer.childNodes[1].firstChild, 2);
        highlighter.highlightRanges([range]);

        range.setStart(fixtureContainer.childNodes[2].firstChild, 3);
        range.setEnd(fixtureContainer.childNodes[2].firstChild, 5);
        highlighter.highlightRanges([range]);

        range.setStart(fixtureContainer.childNodes[3].firstChild, 1);
        range.setEnd(fixtureContainer.childNodes[3].firstChild, 2);
        highlighter.highlightRanges([range]);

        range.setStart(fixtureContainer.childNodes[4].firstChild, 0);
        range.setEnd(fixtureContainer.childNodes[4].firstChild, 2);
        highlighter.highlightRanges([range]);

        range.setStart(fixtureContainer.childNodes[5].lastChild, 0);
        range.setEnd(fixtureContainer.childNodes[5].lastChild, 2);
        highlighter.highlightRanges([range]);

        range.setStart(fixtureContainer.childNodes[6].childNodes[1], 0);
        range.setEnd(fixtureContainer.childNodes[6].childNodes[1], 1);
        highlighter.highlightRanges([range]);

        var higlights = $(fixtureContainer).find('.hl');
        assert.equal(higlights.length, 7, 'Seven separated higlights have been created');

        // Clear higlights one by one
        highlighter.clearSingleHighlight({target: higlights[0]});
        assert.equal($(fixtureContainer).find('.hl').length, 6, 'Higlight discarded: 1');
        assertChildNodes(fixtureContainer.childNodes[0], ['lorem'], 'Higlight discarded: no adjacent text to merge with');

        highlighter.clearSingleHighlight({target: higlights[1]});
        assert.equal($(fixtureContainer).find('.hl').length, 5, 'Higlight discarded: 2');
        assertChildNodes(fixtureContainer.childNodes[1], ['ipsum'], 'Higlight discarded: text merged with next');

        highlighter.clearSingleHighlight({target: higlights[2]});
        assert.equal($(fixtureContainer).find('.hl').length, 4, 'Higlight discarded: 3');
        assertChildNodes(fixtureContainer.childNodes[2], ['dolor'], 'Higlight discarded: text merged with previous');

        highlighter.clearSingleHighlight({target: higlights[3]});
        assert.equal($(fixtureContainer).find('.hl').length, 3, 'Higlight discarded: 4');
        assertChildNodes(fixtureContainer.childNodes[3], ['sit'], 'Higlight discarded: text merged with next and previous');

        highlighter.clearSingleHighlight({target: higlights[4]});
        assert.equal($(fixtureContainer).find('.hl').length, 2, 'Higlight discarded: 5');
        assertChildNodes(fixtureContainer.childNodes[4], ['am', 'et'], 'Higlight discarded: text not merged with next');

        highlighter.clearSingleHighlight({target: higlights[5]});
        assert.equal($(fixtureContainer).find('.hl').length, 1, 'Higlight discarded: 6');
        assertChildNodes(fixtureContainer.childNodes[5], ['consectet', 'ur'], 'Higlight discarded: text not merged with previous');

        highlighter.clearSingleHighlight({target: higlights[6]});
        assert.equal($(fixtureContainer).find('.hl').length, 0, 'Higlight discarded: 7');
        assertChildNodes(fixtureContainer.childNodes[6], ['ad', 'i', 'piscing'], 'Higlight discarded: text not merged with next and previous');

        assert.equal(fixtureContainer.childNodes[7].textContent, '', 'Empty nodes were not removed');
    });

    QUnit.cases
        .init([{
            title: 'Second splits first',
            contentAfterApplyingHighlighter: 'Lorem <span class="pink" data-hl-group="1" data-before-was-split="abc" data-after-was-split="true">Ip</span>' +
                '<span class="blue" data-hl-group="1" data-before-was-split="true" data-after-was-split="true">su</span>' +
                '<span class="pink" data-hl-group="1" data-before-was-split="true" data-after-was-split="def">m</span> is',
            buildRange: function (range, fixtureContainer) {
                    range.setStart(fixtureContainer.childNodes[1].firstChild, 2);
                    range.setEnd(fixtureContainer.childNodes[1].firstChild, 4);
                }
            }, {
                title: 'Second covers first fully',
                contentAfterApplyingHighlighter: '<span class="blue" data-hl-group="1" data-before-was-split="false" data-after-was-split="false">Lorem Ipsum is</span>',
                buildRange: function (range, fixtureContainer) {
                        range.setStart(fixtureContainer.childNodes[0], 0);
                        range.setEnd(fixtureContainer.childNodes[2], 3);
                    }
            }, {
                title: 'Second cuts start of first',
                contentAfterApplyingHighlighter: '<span class="blue" data-hl-group="1" data-before-was-split="false" data-after-was-split="true">Lorem Ip</span>' +
                    '<span class="pink" data-hl-group="1" data-before-was-split="true" data-after-was-split="def">sum</span> is',
                buildRange: function (range, fixtureContainer) {
                        range.setStart(fixtureContainer.childNodes[0], 0);
                        range.setEnd(fixtureContainer.childNodes[1].firstChild, 2);
                    }
            }, {
                title: 'Second cuts end of first',
                contentAfterApplyingHighlighter: 'Lorem <span class="pink" data-hl-group="1" data-before-was-split="abc" data-after-was-split="true">Ip</span>' +
                '<span class="blue" data-hl-group="1" data-before-was-split="true" data-after-was-split="false">sum is</span>',
                buildRange: function (range, fixtureContainer) {
                        range.setStart(fixtureContainer.childNodes[1].firstChild, 2);
                        range.setEnd(fixtureContainer.childNodes[2], 3);
                    }
            }
        ])
        .test('highlightRanges: multi colors', function (data, assert) {
            const colors = {
                pink: 'pink',
                blue: 'blue'
            };
            const highlighter = highlighterFactory({
                keepEmptyNodes: true,
                className: colors.pink,
                containerSelector: '#qunit-fixture',
                containersBlackList: [],
                colors: colors
            });
            var range = document.createRange();
            var fixtureContainer = document.getElementById('qunit-fixture');

            assert.expect(2);

            fixtureContainer.innerHTML = 'Lorem Ipsum is';

            //Create highlight in one color: 'Lorem [Ipsum] is'
            range.setStart(fixtureContainer.childNodes[0], 6);
            range.setEnd(fixtureContainer.childNodes[0], 11);
            highlighter.highlightRanges([range]);

            assert.equal(
                fixtureContainer.innerHTML,
                'Lorem <span class="pink" data-hl-group="1" data-before-was-split="true" data-after-was-split="true">Ipsum</span> is',
                'Highlight in first color was created'
            );
            fixtureContainer.childNodes[1].dataset.beforeWasSplit = 'abc'; //to make testing easier
            fixtureContainer.childNodes[1].dataset.afterWasSplit = 'def';

            //Create highlight in another color
            var range2 = document.createRange();
            data.buildRange(range2, fixtureContainer);
            highlighter.setActiveColor('blue');
            highlighter.highlightRanges([range2]);

            assert.equal(
                fixtureContainer.innerHTML,
                data.contentAfterApplyingHighlighter,
                'Split data is inherited on highlight with second color'
            );
        });
});
