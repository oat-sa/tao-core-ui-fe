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
 * Copyright (c) 2018 Open Assessment Technologies SA ;
 */
/**
 * Wrapper for calculator plugins factory
 * @author Jean-Sébastien Conan <jean-sebastien@taotesting.com>
 */
import _ from 'lodash';
import pluginFactory from 'core/plugin';

/**
 * A pluginFactory configured for the calculator
 * @returns {Function} the preconfigured plugin factory
 */
export default function calculatorPluginFactory(provider, defaultConfig) {
    return pluginFactory(
        provider,
        _.defaults(
            {
                //alias getHost to getCalculator
                hostName: 'calculator'
            },
            defaultConfig
        )
    );
}
