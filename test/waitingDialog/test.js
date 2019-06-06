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
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */
define(['jquery', 'ui/waitingDialog/waitingDialog'], function($, waitingDialog) {
    'use strict';

    var config = { container: '#qunit-fixture' };

    QUnit.module('API');

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
            var ready = assert.async();
            waitingDialog(config).on('init', function() {
                assert.equal(
                    typeof this[data.title],
                    'function',
                    'The waitingDialog exposes the component method "' + data.title
                );
                this.destroy();
                ready();
            });
        });

    QUnit.cases
        .init([{ title: 'on' }, { title: 'off' }, { title: 'trigger' }, { title: 'before' }, { title: 'after' }])
        .test('Eventifier API ', function(data, assert) {
            var ready = assert.async();
            waitingDialog(config).on('init', function() {
                assert.equal(
                    typeof this[data.title],
                    'function',
                    'The waitingDialog exposes the eventifier method "' + data.title
                );
                this.destroy();
                ready();
            });
        });

    QUnit.cases.init([{ title: 'beginWait' }, { title: 'endWait' }]).test('Instance API ', function(data, assert) {
        var ready = assert.async();
        waitingDialog(config).on('init', function() {
            assert.equal(typeof this[data.title], 'function', 'The waitingDialog exposes the method "' + data.title);
            this.destroy();
            ready();
        });
    });

    QUnit.module('Behavior');

    QUnit.test('Lifecycle', function(assert) {
        var ready = assert.async();

        assert.expect(4);

        waitingDialog(config)
            .on('render', function() {
                assert.ok(this.is('rendered'), 'The component is rendered');
                assert.ok(this.is('waiting'), 'The component starts in waiting state');

                this.endWait();
            })
            .on('unwait', function() {
                assert.ok(!this.is('waiting'), 'The component is not in waiting state');

                this.on('wait', function() {
                    assert.ok(this.is('waiting'), 'The component is again in waiting state');

                    this.destroy();
                });
                this.beginWait();
            })
            .on('destroy', function() {
                ready();
            });
    });

    QUnit.test('Rendering', function(assert) {
        var ready = assert.async();
        var $container = $('#qunit-fixture');

        assert.expect(15);

        waitingDialog({
            container: $container,
            message: 'message',
            waitContent: 'wait content',
            waitButtonText: 'wait button',
            proceedContent: 'proceed content',
            proceedButtonText: 'proceed button'
        })
            .on('init', function() {
                assert.equal($('.modal', $container).length, 0, 'The modal is closed');
            })
            .on('render', function() {
                assert.equal($('.modal', $container).length, 1, 'The modal is opened');
                assert.equal($('.modal .message', $container).text(), 'message');
                assert.equal($('.modal .content', $container).text(), 'wait content');
                assert.equal($('.modal button .label', $container).text(), 'wait button');
                assert.equal($('.modal button', $container).prop('disabled'), true, 'the button is disabled');

                this.endWait();
            })
            .on('unwait', function() {
                assert.equal($('.modal', $container).length, 1, 'The modal remains opened');
                assert.equal($('.modal .message', $container).text(), 'message');
                assert.equal($('.modal .content', $container).text(), 'proceed content');
                assert.equal($('.modal button .label', $container).text(), 'proceed button');
                assert.equal(
                    $('.modal button', $container).prop('disabled'),
                    false,
                    'the button is not disabled anymore'
                );

                this.on('wait', function() {
                    assert.equal($('.modal .message', $container).text(), 'message');
                    assert.equal($('.modal .content', $container).text(), 'wait content');
                    assert.equal($('.modal button .label', $container).text(), 'wait button');
                    assert.equal($('.modal button', $container).prop('disabled'), true, 'the button is disabled');

                    this.destroy();
                    ready();
                });
                this.beginWait();
            });
    });

    QUnit.test('Rendering with secondary', function(assert) {
        var ready = assert.async();
        var $container = $('#qunit-fixture');

        assert.expect(18);

        waitingDialog({
            container: $container,
            message: 'message',
            waitContent: 'wait content',
            waitButtonText: 'wait button',
            proceedContent: 'proceed content',
            proceedButtonText: 'proceed button',
            showSecondary: true,
            secondaryButtonText: 'other button'
        })
            .on('init', function() {
                assert.equal($('.modal', $container).length, 0, 'The modal is closed');
            })
            .on('render', function() {
                assert.equal($('.modal', $container).length, 1, 'The modal is opened');
                assert.ok($('.modal').hasClass('has-secondary'), 'The modal has "has-secondary" class');
                assert.equal($('.modal .buttons button', $container).length, 2, 'The modal has 2 buttons');
                assert.equal($('.modal button:first-child .label', $container).text(), 'wait button');
                assert.equal(
                    $('.modal button:first-child', $container).prop('disabled'),
                    true,
                    'the button is disabled'
                );
                assert.equal($('.modal button.secondary .label', $container).text(), 'other button');
                assert.equal(
                    $('.modal button.secondary', $container).prop('disabled'),
                    false,
                    'the secondary button is enabled'
                );
                assert.equal(
                    $('.modal button.secondary', $container).hasClass('hidden'),
                    false,
                    'the secondary button is visible'
                );

                this.endWait();
            })
            .on('unwait', function() {
                assert.equal($('.modal', $container).length, 1, 'The modal remains opened');
                assert.equal($('.modal button:first-child .label', $container).text(), 'proceed button');
                assert.equal(
                    $('.modal button:first-child', $container).prop('disabled'),
                    false,
                    'the button is not disabled anymore'
                );
                assert.equal(
                    $('.modal button.secondary', $container).prop('disabled'),
                    true,
                    'the secondary button is disabled'
                );
                assert.equal(
                    $('.modal button.secondary', $container).hasClass('hidden'),
                    true,
                    'the secondary button is hidden'
                );

                this.on('wait', function() {
                    assert.equal($('.modal button:first-child .label', $container).text(), 'wait button');
                    assert.equal(
                        $('.modal button:first-child', $container).prop('disabled'),
                        true,
                        'the button is disabled'
                    );
                    assert.equal(
                        $('.modal button.secondary', $container).prop('disabled'),
                        false,
                        'the secondary button is enabled'
                    );
                    assert.equal(
                        $('.modal button.secondary', $container).hasClass('hidden'),
                        false,
                        'the secondary button is visible'
                    );

                    this.destroy();
                    ready();
                });
                this.beginWait();
            });
    });

    QUnit.test('proceed', function(assert) {
        var ready = assert.async();
        var $container = $('#qunit-fixture');

        assert.expect(2);

        waitingDialog({
            container: $container
        })
            .on('render', function() {
                var $button = $('.modal button', $container);

                assert.equal($button.length, 1, 'The dialog control exists');

                //No effect
                $button.click();
                $button.click();

                this.on('unwait', function() {
                    $button.click();
                });
                this.endWait();
            })
            .on('proceed', function() {
                assert.ok(true, 'The proceed events has been trigerred');
                this.destroy();
                ready();
            });
    });

    QUnit.module('Visual');

    QUnit.test('playground', function(assert) {
        var ready = assert.async();
        assert.expect(1);

        waitingDialog({
            message: 'Test dialog',
            waitContent: 'We wait 2s before being able to proceed',
            waitButtonText: 'waiting ...',
            proceedContent: 'The wait is over',
            proceedButtonText: 'proceed'
        }).on('render', function() {
            var self = this;
            setTimeout(function() {
                self.endWait();

                assert.ok(true);
                ready();
            }, 2000);
        });
    });
});
