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
 * Copyright (c) 2026 (original work) Open Assessment Technologies SA ;
 */

/** @typedef {'anonymous' | 'use-credentials'} CrossOriginMode */

const VALID_CROSS_ORIGIN_MODES = new Set(['anonymous', 'use-credentials']);

/**
 * Normalises cross-origin mode from instance or RequireJS module config.
 * @param {CrossOriginMode | string | undefined | null} instanceMode
 * @param {CrossOriginMode | string | undefined | null} [moduleMode]
 * @returns {CrossOriginMode}
 */
function resolveCrossOriginMode(instanceMode, moduleMode) {
    let mode = instanceMode;

    if (typeof mode === 'undefined' || mode === null) {
        mode = moduleMode;
    }
    if (typeof mode === 'undefined' || mode === null) {
        mode = 'anonymous';
    }

    return VALID_CROSS_ORIGIN_MODES.has(mode) ? /** @type {CrossOriginMode} */ (mode) : 'anonymous';
}

/**
 * Resolves the crossorigin attribute for HTML5 media when sources are cross-domain.
 * @param {Array<{ src?: string }>} sources
 * @param {CrossOriginMode} crossOriginMode
 * @param {{ sameDomain: (url: string) => boolean }} page
 * @returns {CrossOriginMode | null} null when attribute should be omitted
 */
function resolveCrossOriginAttribute(sources, crossOriginMode, page) {
    const isCrossDomain = sources.some(source => source && source.src && !page.sameDomain(source.src));

    if (!isCrossDomain) {
        return null;
    }

    return resolveCrossOriginMode(crossOriginMode);
}

export default {
    VALID_CROSS_ORIGIN_MODES,
    resolveCrossOriginMode,
    resolveCrossOriginAttribute
};
