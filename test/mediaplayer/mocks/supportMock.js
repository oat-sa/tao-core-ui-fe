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
 * Copyright (c) 2021 (original work) Open Assessment Technologies SA ;
 */
define(function () {
    let support = true;
    let control = true;
    return {
        setSupport(value) {
            support = value;
        },

        setControl(value) {
            control = value;
        },

        reset() {
            support = true;
            control = true;
        },

        checkSupport() {
            return support;
        },

        canPlay() {
            return support;
        },

        canPlayAudio() {
            return support;
        },

        canPlayVideo() {
            return support;
        },

        canControl() {
            return control;
        }
    };
});
