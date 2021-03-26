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
 * Copyright (c) 2015-2021 (original work) Open Assessment Technologies SA ;
 */
/**
 * @author Jean-Sébastien Conan <jean-sebastien.conan@vesperiagroup.com>
 */
import _ from 'lodash';
import __ from 'i18n';
import dialog from 'ui/dialog';

/**
  * Displays an alert message
  * @param {String} message - The displayed message
  * @param {Function} action - An action called when the alert is closed
  * @param {Function} onCreateDialog - An action called when dialog created
  * @param {Object} options - Dialog options
  * @param {Object} options.buttons - Dialog button options
  * @param {Object} options.buttons.labels - Dialog button labels
  * @param {String} options.buttons.labels.ok - "OK" button label
  * @returns {dialog} - Returns the dialog instance
  */
export default function dialogAlert(message, action, onCreateDialog, options) {
    const _options = {
        buttons: {
            labels: {
                ok: __('Ok')
            }
        }
    };
    let dialogOptions;
    let dlg;
    options = _.defaults(options || {}, _options);
    dialogOptions = {
        message: message,
        autoRender: true,
        autoDestroy: true,
        buttons: {
            ok: {
                id: 'ok',
                type: 'info',
                label: options.buttons.labels.ok || __('Ok'),
                close: true
            }
        }
    };
    dlg = dialog(dialogOptions).on('create.dialog', function() {
        if (onCreateDialog) {
            onCreateDialog();
        }
    });

    if (_.isFunction(action)) {
        dlg.on('closed.modal', action);
    }
    return dlg;
}
