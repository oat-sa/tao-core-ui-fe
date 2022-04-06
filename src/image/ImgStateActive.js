/*
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
 * Copyright (c) 2021 (original work) Open Assessment Technologies SA (under the project TAO-PRODUCT);
 */
import 'jquery';
import 'nouislider';
import 'ui/resourcemgr';
import 'ui/tooltip';
import _ from 'lodash';
import initAll, { initAdvanced } from './ImgStateActive/initHelper';
import initMediaEditor  from './ImgStateActive/initMediaEditor';

const options = {
    mediaDimension: {
        active: true
    },
    mediaAlignment: {
        active: true
    }
};

const formCallbacks = ({ widget, formElement, mediaEditor, togglePlaceholder }) => {
    const $img = widget.$original;
    return {
        src: _.throttle(function (img, value) {
            img.attr('src', value);
            if (!$img.hasClass('hidden')) {
                $img.addClass('hidden');
            }
            $img.attr('src', widget.getAssetManager().resolve(value));
            $img.trigger('contentChange.qti-widget').change();

            togglePlaceholder(widget);

            initAdvanced(widget);
            if (img.attr('off-media-editor') === 1) {
                img.removeAttr('off-media-editor');
            } else {
                initMediaEditor(widget, mediaEditor, options);
            }
        }, 1000),
        alt: function (img, value) {
            img.attr('alt', value);
        },
        longdesc: formElement.getAttributeChangeCallback(),
    };
};


const initForm = ({ widget, formElement, formTpl, mediaEditor, togglePlaceholder }) => {
    widget.$form.html(
        formTpl({
            baseUrl: widget.options.baseUrl || '',
            src: widget.element.attr('src'),
            alt: widget.element.attr('alt')
        })
    );

    // init upload, advanced and media editor
    initAll(widget, mediaEditor, options);

    // init standard ui widget
    formElement.initWidget(widget.$form);

    // init data change callbacks
    formElement.setChangeCallbacks(
        widget.$form,
        widget.element,
        formCallbacks({ widget, formElement, mediaEditor, togglePlaceholder })
    );
};


export default function(stateFactory, ActiveState, formTpl, formElement, inlineHelper) {
    /**
     * media Editor instance if has been initialized
     * @type {null}
     */
    let mediaEditor = null;

    const ImgStateActive = stateFactory.extend(
        ActiveState,
        function () {
            this.initForm();
        },
        function () {
            this.widget.$form.empty();
        }
    );

    ImgStateActive.prototype.initForm = function() {
        initForm({
            widget: this.widget,
            formElement,
            formTpl,
            mediaEditor,
            togglePlaceholder: inlineHelper.togglePlaceholder,
        });
    };

    return ImgStateActive;
}
