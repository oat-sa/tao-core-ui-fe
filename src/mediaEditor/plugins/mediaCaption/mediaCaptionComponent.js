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
 * Copyright (c) 2018  (original work) Open Assessment Technologies SA;
 */

/**
 * Controls media size
 */
import $ from 'jquery';
import _ from 'lodash';
import component from 'ui/component';
import tpl from 'ui/mediaEditor/plugins/mediaCaption/tpl/mediaCaption';
import 'nouislider';
import 'ui/tooltip';
import 'ui/mediaEditor/plugins/mediaCaption/style.css';

/**
 * Creates mediaCaption component
 * @param {jQueryElement} $container
 * @param {Object} media
 * @param {Object} config
 * @fires "changed" - on State changed
 * @returns {component|*} mediaCaptionComponent
 */
export default function mediaCaptionFactory($container, media) {
    /**
     * Template of the dimension controller
     */
    let $template;

    /**
     * Current component
     */
    const mediaCaptionComponent = component({
        /**
         * Apply configurations to the view
         */
        update(caption) {
            this.trigger('change', {
                figcaption: caption
            });
        }
    });

    mediaCaptionComponent
        .on('init', function () {
            media.figcaption =
                typeof media.figcaption !== 'undefined' ? media.figcaption : '';
            this.render($container);
        })
        .on('render', function () {
            $template = $(
                tpl({
                    figcaption: media.figcaption
                })
            );
            $template.appendTo(this.getContainer());
            const $figcaptionInput = $template.find('#figcaption');
            $figcaptionInput.on('input', () => {
                mediaCaptionComponent.update($figcaptionInput.val());
            });
        })
        .on('destroy', function () {
            $template.remove();
        });

    _.defer(function () {
        mediaCaptionComponent.init();
    });

    return mediaCaptionComponent;
}
