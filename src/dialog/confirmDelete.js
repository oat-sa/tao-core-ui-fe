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
/**
 * @author Hanna Dzmitryieva <hanna@taotesting.com>
 */
import _ from 'lodash';
import __ from 'i18n';
import dialog from 'ui/dialog';
import checkBoxTpl from 'ui/dialog/tpl/checkbox';

/**
 * Displays a confirm delete message with checkbox
 * @param {String} message - The displayed message
 * @param {Function} accept - An action called when the message is accepted
 * @param {Function} refuse - An action called when the message is refused
 * @param {Object} options - Dialog options
 * @param {Object} options.confirmationMessage - "I understand that this action is permanent." message
 * @param {Object} options.buttons - Dialog button options
 * @param {Object} options.buttons.labels - Dialog button labels
 * @param {String} options.buttons.labels.delete - "Delete" button label
 * @param {String} options.buttons.labels.cancel - "Cancel" button label
 * @returns {dialog} - Returns the dialog instance
 */
const defaults = {
    buttons: {
        labels: {
            delete: __('Delete'),
            cancel: __('Cancel')
        }
    },
    confirmationMessage: __('I understand that this action is permanent.')
};

export default function dialogConfirmDelete(message, accept, refuse, options) {
    let accepted = false;
    options = _.defaults(options || {}, defaults);
    const dialogOptions = {
        message: message,
        content: checkBoxTpl({ id: 'confirm', checked: false, text: options.confirmationMessage }),
        autoRender: true,
        autoDestroy: true,
        onDeleteBtn: function() {
            accepted = true;
            if (_.isFunction(accept)) {
                accept.call(this);
            }
        },
        buttons: {
            delete: {
                id: 'delete',
                type: 'info',
                label: options.buttons.labels.delete || defaults.buttons.labels.delete,
                close: true
            },
            cancel: {
                id: 'cancel',
                type: 'regular',
                label: options.buttons.labels.cancel || defaults.buttons.labels.cancel,
                close: true
            }
        }
    };
    const dlg = dialog(dialogOptions);

    const $html = dlg.getDom();
    const $deleteButton = $html.find('[data-control="delete"]');
    $deleteButton.prop('disabled', true);
    $html.find('#confirm').on('change', function() {
        $deleteButton.prop('disabled', !this.checked);
    });

    if (_.isFunction(refuse)) {
        dlg.on('closed.modal', function() {
            if (!accepted) {
                refuse.call(this);
            }
        });
    }
    return dlg;
}
