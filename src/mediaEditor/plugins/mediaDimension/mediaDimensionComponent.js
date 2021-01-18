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
import tpl from 'ui/mediaEditor/plugins/mediaDimension/tpl/mediaDimension';
import helper from 'ui/mediaEditor/plugins/mediaDimension/helper';
import 'nouislider';
import 'ui/tooltip';
import 'ui/mediaEditor/plugins/mediaDimension/style.css';

/**
 * Size properties of the media
 * @typedef {Object} sizeProps
 * @property px {{
 *        natural: {
 *          width: number,
 *          height: number,
 *        },
 *        current: {
 *          width: number,
 *          height: number,
 *        }
 *      }}
 * @property '%' {{
 *        natural: {
 *          width: number,
 *          height: number,
 *        },
 *        current: {
 *          width: number,
 *          height: number,
 *        }
 *      }}
 * @property ratio {{
 *   natural: number,
 *   current: number
 * }}
 * @property currentUtil string
 */

/**
 * Default values
 * precision - precision for all calculations (0.00001)
 *
 * @type {{
 *    showResponsiveToggle: boolean,
 *    showSync: boolean,
 *    showReset: boolean,
 *    denyCustomRatio: boolean,
 *    width: number,
 *    height: number,
 *    minWidth: number,
 *    maxWidth: number,
 *    sizeProps: sizeProps,
 *    precision: number
 * }}
 * @private
 */
const defaultConfig = {
    showResponsiveToggle: true,
    showSync: true,
    showReset: true,
    sizeProps: {
        px: {
            current: {
                width: 0,
                height: 0
            }
        },
        '%': {
            current: {
                width: 0,
                height: null
            }
        },
        ratio: {
            natural: 1,
            current: 1
        },
        currentUtil: '%',
        slider: {
            min: 1,
            max: 100,
            start: 100
        }
    },
    denyCustomRatio: false,
    syncDimensions: true,
    width: 0,
    height: 0,
    minWidth: 0,
    maxWidth: 0,
    precision: 5
};

/**
 * Creates mediaDimension component
 * @param {jQueryElement} $container
 * @param {Object} media
 * @param {Object} config
 * @fires "changed" - on State changed
 * @returns {component|*} mediaDimensionComponent
 */
export default function mediaDimensionFactory($container, media, config) {
    /**
     * Collections of the jquery elements grouped by type
     */
    let $blocks, $slider, $fields;

    /**
     * Template of the dimension controller
     */
    let $template;

    /**
     * Size properties of the media control panel
     * @typedef {Object} mediaSizeProps
     * @property showResponsiveToggle boolean
     * @property responsive boolean
     * @property sizeProps sizeProps
     * @property syncDimensions boolean
     * @property denyCustomRatio boolean
     * @property precision number
     * @property showReset boolean
     */

    /**
     * Configuration
     * @type {mediaSizeProps}
     * @private
     */
    let initialConfig;

    /**
     * Calculate propSizes to have correct sizes for the shown image
     * @param {Object} conf
     * @returns {Object}
     */
    const calculateCurrentSizes = function calculateCurrentSizes(conf) {
        const mediaContainerWidth = helper.getMediaContainerWidth(media);
        return helper.applyDimensions(conf, {
            width:
                mediaContainerWidth < conf.sizeProps.px.natural.width
                    ? mediaContainerWidth
                    : conf.sizeProps.px.natural.width,
            maxWidth: helper.getMediaContainerWidth(media)
        });
    };

    /**
     * Return oroginal size
     * @returns {Object}
     */
    function getOriginalSize() {
        // for images naturalWidth, for video videoWidth, for youtube iframe width
        return {
            width: media.$node[0].naturalWidth || media.$node[0].videoWidth || media.$node[0].width,
            height: media.$node[0].naturalHeight || media.$node[0].videoHeight || media.$node[0].height
        };
    }

    /**
     * Current component
     */
    const mediaDimensionComponent = component(
        {
            /**
             * Reset the component to the initial state
             * @returns {component} this
             */
            reset: function reset() {
                const syncDim = initialConfig.syncDimensions;
                if (this.is('rendered')) {
                    // revert the sizes to the original
                    const originalSize = getOriginalSize();
                    initialConfig.sizeProps.px.current.width = originalSize.width;
                    initialConfig.sizeProps.px.current.height = originalSize.height;
                    initialConfig.sizeProps.ratio.current = initialConfig.sizeProps.ratio.natural;

                    // reset needs to restore everything
                    initialConfig.syncDimensions = true;

                    // apply changes
                    initialConfig = calculateCurrentSizes(initialConfig);
                    mediaDimensionComponent.update();
                    // restore current mode
                    initialConfig.syncDimensions = syncDim;

                    // trigger event
                    this.trigger('reset', initialConfig);
                }
                return this;
            },
            /**
             * Apply configurations to the view
             */
            update: function update() {
                // slide sliders
                $slider.val(initialConfig.sizeProps['%'].current.width);
                // percent Input
                $fields['%'].width.val(Math.round(initialConfig.sizeProps['%'].current.width));
                // px inputs
                $fields.px.width.val(Math.round(initialConfig.sizeProps.px.current.width));
                $fields.px.height.val(Math.round(initialConfig.sizeProps.px.current.height));

                this.trigger('change', initialConfig);
            }
        },
        defaultConfig
    );

    /**
     * Check that input in progress and we don't need to change anything
     * @param {String|number} val
     * @returns {RegExpMatchArray | null}
     */
    const isInsignificantEnd = function isInsignificantEnd(val) {
        if (typeof val !== 'string') {
            val = `${val}`;
        }
        return val.match(/\.[0]*$/);
    };

    /**
     * Blocks are the two different parts of the form (either width|height or size)
     *
     * @param {jQueryElement} $elt
     * @returns {{}}
     * @private
     */
    const initBlocks = function initBlocks($elt) {
        const _blocks = {},
            $responsiveToggleField = $elt.find('.media-mode-switch'),
            checkMode = function checkMode() {
                if ($responsiveToggleField.is(':checked')) {
                    initialConfig.responsive = true;
                    _blocks.px.hide();
                    _blocks['%'].show();
                    initialConfig.sizeProps.currentUtil = '%';
                } else {
                    initialConfig.responsive = false;
                    _blocks['%'].hide();
                    _blocks.px.show();
                    initialConfig.sizeProps.currentUtil = 'px';
                }

                if ($fields) {
                    if ($fields['%'].width.val() > $slider.max) {
                        $fields['%'].width.val($slider.max);
                    }
                    initialConfig = helper.applyDimensions(initialConfig, {
                        percent: $fields['%'].width.val(),
                        maxWidth: helper.getMediaContainerWidth(media)
                    });
                    mediaDimensionComponent.update();
                }
            };

        if (!initialConfig.showResponsiveToggle) {
            $elt.addClass('media-sizer-responsivetoggle-off');
        }

        _(['px', '%']).forEach(function (unit) {
            _blocks[unit] = $elt.find(`.media-sizer-${unit === 'px' ? 'pixel' : 'percent'}`);
            _blocks[unit].prop('unit', unit);
            _blocks[unit].find('input').data('unit', unit);
        });

        $responsiveToggleField.on('click', function () {
            checkMode();
        });

        $responsiveToggleField.prop('checked', initialConfig.responsive);

        // initialize it properly
        checkMode();

        return _blocks;
    };

    /**
     * Toggle width/height synchronization
     *
     * @param {jQueryElement} $elt
     * @returns {*}
     * @private
     */
    const initSyncBtn = function initSyncBtn($elt) {
        const $mediaSizer = $elt.find('.media-sizer'),
            $btn = $elt.find('.media-sizer-sync');

        if (!initialConfig.showSync) {
            $btn.hide();
            $mediaSizer.addClass('media-sizer-sync-off');
        }
        // this stays intact even if hidden in case it will be
        // displayed from somewhere else
        $btn.on('click', function () {
            const $sizerEl = $(this).parents('.media-sizer');
            $sizerEl.toggleClass('media-sizer-synced');
            initialConfig.syncDimensions = $sizerEl.hasClass('media-sizer-synced');
        });
        return $btn;
    };

    /**
     * Button to reset the size to its original values
     *
     * @param {jQueryElement} $elt
     * @returns {*}
     * @private
     */
    const initResetBtn = function initResetBtn($elt) {
        const $btn = $elt.find('.media-sizer-reset');

        if (!initialConfig.showReset) {
            $elt.find('.media-sizer').addClass('media-sizer-reset-off');
        }

        // this stays intact even if hidden in case it will be
        // displayed from somewhere else
        $btn.on('click', function (e) {
            e.preventDefault();
            mediaDimensionComponent.reset();
            return false;
        });

        return $btn;
    };

    /**
     * Initialize the fields
     *
     * @returns {{}}
     * @private
     */
    const initFields = function initFields() {
        const dimensions = ['width', 'height'];
        let field;
        const _fields = {};

        _($blocks).forOwn(function ($block, unit) {
            _fields[unit] = {};

            $blocks[unit].find('input').each(function () {
                _(dimensions).forEach(function (dim) {
                    field = $blocks[unit].find(`[name="${dim}"]`);
                    // there is no 'height' field for % - $('<input>') is a dummy to avoid checking if the field exists all the time
                    _fields[unit][dim] = field.length ? field : $('<input>');
                    _fields[unit][dim].prop({
                        unit: unit,
                        dimension: dim
                    });
                    _fields[unit][dim].val(initialConfig.sizeProps[unit].current[dim]);

                    _fields[unit][dim].on('keydown', function (e) {
                        const $field = $(this),
                            c = e.keyCode,
                            specChars = (function () {
                                const chars = [8, 37, 39, 46];
                                if ($field.val().indexOf('.') === -1) {
                                    chars.push(190);
                                    chars.push(110);
                                }
                                return chars;
                            })(),
                            allowed = _.contains(specChars, c) || (c >= 48 && c <= 57) || (c >= 96 && c <= 105);

                        if (!allowed) {
                            e.preventDefault();
                        }
                        return allowed;
                    });

                    _fields[unit][dim].on('keyup blur sliderchange', function () {
                        const $field = $(this);
                        let value = $field.val().replace(/,/g, '.');
                        let newDimensions;

                        $field.val(value);
                        if (isInsignificantEnd(value)) {
                            // do nothing if .00 or something insignificant at the end of line
                            return;
                        }

                        if (value > $field.data('max')) {
                            $field.val($field.data('max'));
                            value = `${$field.data('max')}`;
                        } else if (value < $field.data('min')) {
                            $field.val($field.data('min'));
                            value = `${$field.data('min')}`;
                        }

                        if ($field.prop('unit') === '%') {
                            initialConfig.sizeProps['%'].current.width = value;
                            newDimensions = { percent: value };
                        } else {
                            if ($field.prop('dimension') === 'height') {
                                newDimensions = { height: value };
                            } else {
                                newDimensions = { width: value };
                            }
                        }
                        newDimensions.maxWidth = helper.getMediaContainerWidth(media);
                        initialConfig = helper.applyDimensions(initialConfig, newDimensions);
                        mediaDimensionComponent.update();
                    });
                });
            });
        });

        return _fields;
    };

    /**
     * Initialize the two sliders, one based on pixels the other on percentage
     *
     * @param {jQueryElement} $elt
     * @returns {{}}
     * @private
     */
    const initSlider = function initSlider($elt) {
        let slider;

        slider = $elt.find('.media-sizer-slider');
        slider.prop('unit', '%');
        slider
            .noUiSlider({
                start: initialConfig.sizeProps.slider.start,
                range: {
                    min: initialConfig.sizeProps.slider.min,
                    max: initialConfig.sizeProps.slider.max
                }
            })
            .on('slide', function () {
                // to avoid .00
                const percent = parseFloat(`${$(this).val()}`);
                helper.applyDimensions(initialConfig, {
                    percent: percent,
                    maxWidth: helper.getMediaContainerWidth(media)
                });
                mediaDimensionComponent.update();
            });

        return slider;
    };

    mediaDimensionComponent
        .on('init', function () {
            const originalSize = getOriginalSize();
            const naturalWidth = originalSize.width;
            const naturalHeight = originalSize.height;
            const mediaProps = {
                px: {
                    current: {
                        width: media.width,
                        height: media.height
                    },
                    natural: {
                        width: naturalWidth ? naturalWidth : media.width,
                        height: naturalHeight ? naturalHeight : media.height
                    }
                },
                '%': {
                    current: {
                        width: 100
                    }
                }
            };

            // rewrite with defined values
            initialConfig = this.getConfig();
            initialConfig.sizeProps = _.defaults(mediaProps, initialConfig.sizeProps, defaultConfig.sizeProps);
            initialConfig.sizeProps.ratio.natural = helper.round(
                initialConfig.sizeProps.px.natural.width / initialConfig.sizeProps.px.natural.height,
                initialConfig.precision
            );
            initialConfig.responsive =
                typeof initialConfig.responsive !== 'undefined' ? initialConfig.responsive : true;
            initialConfig.sizeProps.currentUtil = initialConfig.responsive ? '%' : 'px';
            this.render($container);
        })
        .on('render', function () {
            let $mediaSizer;

            initialConfig = this.getConfig();
            $template = $(
                tpl({
                    responsive: initialConfig.responsive
                })
            );

            $template.appendTo(this.getContainer());

            $mediaSizer = $template.find('.media-sizer');
            if (initialConfig.syncDimensions === true && !$mediaSizer.hasClass('media-sizer-synced')) {
                $mediaSizer.addClass('media-sizer-synced');
            }

            $blocks = initBlocks($template);
            $slider = initSlider($template);
            $fields = initFields();
            initSyncBtn($template);
            initResetBtn($template);

            if (typeof media.width === 'undefined') {
                // if sizes are not set then control panel initialization
                initialConfig = calculateCurrentSizes(initialConfig);
            } else {
                if (initialConfig.responsive) {
                    // initialize by percent on the responsive mode
                    initialConfig = helper.applyDimensions(initialConfig, {
                        percent: media.width,
                        maxWidth: helper.getMediaContainerWidth(media)
                    });
                } else {
                    // non-responsive mode
                    initialConfig.sizeProps.px.current = {
                        width: media.width,
                        height: media.height
                    };
                    // calculate percent
                    initialConfig.sizeProps['%'].current.width = helper.round(
                        (media.width * 100) / helper.getMediaContainerWidth(media),
                        initialConfig.precision
                    );
                }
            }

            mediaDimensionComponent.update();
        })
        .on('destroy', function () {
            $template.remove();
        });

    _.defer(function () {
        mediaDimensionComponent.init(config);
    });

    return mediaDimensionComponent;
}
