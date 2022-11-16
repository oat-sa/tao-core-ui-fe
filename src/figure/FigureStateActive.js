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
 * Copyright (c) 2022 (original work) Open Assessment Technologies SA (under the project TAO-PRODUCT);
 */
import $ from 'jquery';
import 'nouislider';
import 'ui/resourcemgr';
import 'ui/tooltip';
import _ from 'lodash';
import initAll, { initAdvanced } from '../image/ImgStateActive/initHelper';
import initMediaEditor from '../image/ImgStateActive/initMediaEditor';
import tplCaptionText from './figcaption.tpl';

const options = {
    mediaDimension: {
        active: true
    },
    mediaAlignment: {
        active: true
    }
};

const getImage = widget => widget.$original.find('img');
const getCaption = widget => widget.$original.find('figcaption');
const getImageElement = widget => _.find(widget.element.getBody().elements, elem => elem.is('img'));
const getCaptionElement = widget => _.find(widget.element.getBody().elements, elem => elem.is('figcaption'));

const formCallbacks = ({ widget, formElement, mediaEditor, togglePlaceholder }) => {
    const $img = getImage(widget);
    let $figcaption = getCaption(widget);
    const imageElem = getImageElement(widget);
    let figcaptionElem = getCaptionElement(widget);
    return {
        src: _.throttle(function (elem, value) {
            imageElem.attr('src', value);

            $img.attr('src', widget.getAssetManager().resolve(value));
            $img.trigger('contentChange.qti-widget').change();

            togglePlaceholder(widget);
            imageElem.removeAttr('off-media-editor');

            if (widget.$form.find('[data-role=advanced]').is(':hidden')) {
                const initPanel = () => {
                    initAdvanced(widget);
                    initMediaEditor(widget, mediaEditor, options);
                };
                if ($img[0].complete) {
                    initPanel();
                } else {
                    $img.on('load.widget-panel', function () {
                        initPanel();
                        $img.off('.widget-panel');
                    });
                }
            }
        }, 1000),
        alt: function (elem, value) {
            imageElem.attr('alt', value);
        },
        figcaption: function (elem, value) {
            // using dompurify to clean <script> tags
            const text = tplCaptionText({ text: value });
            if (figcaptionElem && value) {
                // update existing capture
                $figcaption.html(text);
                figcaptionElem.body(text);
            } else if (!figcaptionElem && value) {
                // add capture
                figcaptionElem = widget.element.addCaption(text);
                $figcaption = $(`<figcaption>${text}</figcaption>`);
                widget.$original.append($figcaption);
            } else if (figcaptionElem && !value) {
                widget.element.removeCaption();
                $figcaption.remove();
                $figcaption = null;
                figcaptionElem = null;
            }
        },
        longdesc: formElement.getAttributeChangeCallback()
    };
};

const initForm = ({ widget, formElement, formTpl, mediaEditor, togglePlaceholder }) => {
    const imageElem = getImageElement(widget);
    const figcaptionElem = getCaptionElement(widget);
    const showFigure = widget.element.attr('showFigure');
    widget.$form.html(
        formTpl({
            baseUrl: widget.options.baseUrl || '',
            src: imageElem.attr('src'),
            alt: imageElem.attr('alt'),
            figcaption: figcaptionElem ? figcaptionElem.body() : '',
            showFigure: showFigure
        })
    );

    widget.$form
        .find('textarea#figcaption')
        .on('focus.qti-widget', () => widget.$container.addClass('edit-figcaption'))
        .on('blur.qti-widget', () => widget.$container.removeClass('edit-figcaption'));

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

export default function (stateFactory, ActiveState, formTpl, formElement, inlineHelper) {
    /**
     * media Editor instance if has been initialized
     * @type {null}
     */
    let mediaEditor = null;
    let textareaObserver = null;
    let texareaHTMLElem = null;

    const ImgStateActive = stateFactory.extend(
        ActiveState,
        function () {
            this.initForm();
        },
        function () {
            this.widget.$form.find('textarea#figcaption').off('.qti-widget');
            if (textareaObserver) {
                textareaObserver.unobserve(texareaHTMLElem);
            }
            this.widget.$form.empty();
        }
    );

    ImgStateActive.prototype.initForm = function () {
        initForm({
            widget: this.widget,
            formElement,
            formTpl,
            mediaEditor,
            togglePlaceholder: inlineHelper.togglePlaceholder
        });
        const figurelem = this.widget.element;
        const $texarea = this.widget.$form.find('textarea#figcaption');
        texareaHTMLElem = $texarea[0];
        function outputsize() {
            figurelem.data('heigthCaptionInput', $texarea.height());
        }
        if (typeof ResizeObserver !== 'undefined') {
            textareaObserver = new ResizeObserver(outputsize).observe(texareaHTMLElem);
            if (figurelem.data('heigthCaptionInput')) {
                $texarea.height(figurelem.data('heigthCaptionInput'));
            }
        }
    };

    return ImgStateActive;
}
