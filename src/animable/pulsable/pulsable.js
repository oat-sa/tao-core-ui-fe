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
 * Copyright (c) 2017 (original work) Open Assessment Technologies SA;
 */

/**
 * Allow to generate a pulsing animation for a component
 *
 * @example
 * component.pulse(3);//will have the component pulse for 3 times
 * component.pulse(3).then(callback);//enables executing the callback after the animation sequence is over
 *
 * @author Sam <sam@taotesting.com>
 */

import _ from 'lodash';
import Promise from 'core/promise';
import componentFactory from 'ui/component';
import makeAlignable from 'ui/component/alignable';
import pulseTpl from 'ui/animable/pulsable/tpl/pulse';
import 'ui/animable/pulsable/css/pulse.css';

var defaultConfig = {
    pulseCount: 3
};

var pulsableComponent = {
    /**
     * Show a pulse animation for a given number of time
     * @param {Integer} [pulseCount] - number of time the component should pulse, if it is not given, takes the value define in the config
     * @returns {Promise}
     */
    pulse: function pulse(pulseCount) {
        var self = this;
        var $component, pulseNb, animatedComponent;

        if (this.config && this.is('rendered')) {
            $component = this.getElement();

            if ($component.css('position') === 'static') {
                $component.css('position', 'relative');
            }

            pulseNb = parseInt(pulseCount || this.config.pulseCount || defaultConfig.pulseCount, 10);
            animatedComponent = makeAlignable(componentFactory())
                .setTemplate(pulseTpl)
                .init()
                .render($component)
                .alignWith($component, {
                    hPos: 'center',
                    vPos: 'center',
                    hOrigin: 'center',
                    vOrigin: 'center'
                });

            return new Promise(function(resolve) {
                _.delay(function() {
                    animatedComponent.destroy();
                    resolve(self);
                }, pulseNb * 1000); //one pulse per second
            });
        }
        return Promise.resolve(this);
    }
};

/**
 * @param {Component} component - an instance of ui/component
 * @param {Object} config
 */
export default function makePulsable(component, config) {
    _.assign(component, pulsableComponent);

    return component.off('.makePulsable').on('init.makePulsable', function() {
        _.defaults(this.config, config || {}, defaultConfig);
    });
}
