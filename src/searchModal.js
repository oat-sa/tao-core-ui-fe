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
 * Copyright (c) 2020 (original work) Open Assessment Technologies SA ;
 */
import $ from 'jquery';
import layoutTpl from 'ui/searchModal/tpl/layout';
import 'ui/searchModal/css/searchModal.css';
import component from 'ui/component';
import 'ui/modal';

export default function searchModalFactory(config) {
    const instance = component().setTemplate(layoutTpl)
        .on('render', () => renderModal())
        .on('destroy', () => destroyModal());

    function renderModal() {
        instance
        .getElement()
        .addClass('modal')
        .on('closed.modal', function() {
            instance.destroy();
        })
        .modal({
            disableEscape: true,
            width: $( window ).width(),
            minHeight: $( window ).height(),
            top: 1, // can not be set to 0 because on modal.js:230 a 0 is a falsy value so default top of 40 px is applied
            modalCloseClass: 'modal-close-left'
        })
        .focus();
        // FIXME - This is just to check view-controller communication
        const testButton = $('.test-button', instance.getElement());
        testButton.on('click', test);
        // TODO - Manage the received request
    }

    function destroyModal() {
        instance.getElement()
            .removeClass('modal')
            .modal('destroy');
        $('.modal-bg').remove();
    }

    function test() {
        debugger;
    }

    return instance.init({renderTo:'body'});
}