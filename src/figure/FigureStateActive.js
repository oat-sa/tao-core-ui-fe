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
import initAll, { initAdvanced } from '../image/ImgStateActive/initHelper';
import initMediaEditor  from '../image/ImgStateActive/initMediaEditor';

const options = {
    mediaDimension: {
        active: true
    },
    mediaAlignment: {
        active: true
    }
};

const formCallbacks = ({ widget, formElement, mediaEditor, togglePlaceholder }) => {
    const $img = widget.$original.find('img');
    const $figcaption = widget.$original.find('figcaption');
    const imageElem = _.find(widget.element.getBody().elements, elem => elem.is('img'));
    const figcaptionElem = _.find(widget.element.getBody().elements, elem => elem.is('figcaption'));
    return {
        src: _.throttle(function (elem, value) {
            imageElem.attr('src', value);
            if (!$img.hasClass('hidden')) {
                $img.addClass('hidden');
            }
            $img.attr('src', widget.getAssetManager().resolve(value));
            $img.trigger('contentChange.qti-widget').change();

            togglePlaceholder(widget);

            initAdvanced(widget);
            if (imageElem.attr('off-media-editor') === 1) {
                imageElem.removeAttr('off-media-editor');
            } else {
                initMediaEditor(widget, mediaEditor, options);
            }
        }, 1000),
        alt: function (elem, value) {
            imageElem.attr('alt', value);
        },
        figcaption: function (elem, value) {
            $figcaption.text(value);
            figcaptionElem.body(value);
        },
        longdesc: formElement.getAttributeChangeCallback(),
    };
};


const initForm = ({ widget, formElement, formTpl, mediaEditor, togglePlaceholder }) => {
    const imageElem = _.find(widget.element.getBody().elements, elem => elem.is('img'));
    const figcaptionElem = _.find(widget.element.getBody().elements, elem => elem.is('figcaption'));
    widget.$form.html(
        formTpl({
            baseUrl: widget.options.baseUrl || '',
            src: imageElem.attr('src'),
            alt: imageElem.attr('alt'),
            figcaption: figcaptionElem.body()
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
