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
 * Copyright (c) 2019-2023 Open Assessment Technologies SA ;
 */
import __ from 'i18n';
import { exponentLeft, exponentRight, subscriptRight, symbols, terms } from '@oat-sa/tao-calculator/dist';
import historyUpTpl from 'ui/maths/calculator/core/tpl/historyUp';
import historyDownTpl from 'ui/maths/calculator/core/tpl/historyDown';
import backspaceTpl from 'ui/maths/calculator/core/tpl/backspace';

export default {
    // Digits definition
    NUM0: terms.NUM0.label,
    NUM1: terms.NUM1.label,
    NUM2: terms.NUM2.label,
    NUM3: terms.NUM3.label,
    NUM4: terms.NUM4.label,
    NUM5: terms.NUM5.label,
    NUM6: terms.NUM6.label,
    NUM7: terms.NUM7.label,
    NUM8: terms.NUM8.label,
    NUM9: terms.NUM9.label,
    DOT: terms.DOT.label,
    EXP10: terms.EXP10.label,
    POW10: exponentRight('10', 'x'),

    // Aggregators
    LPAR: terms.LPAR.label,
    RPAR: terms.RPAR.label,

    // Separator
    COMMA: terms.COMMA.label,
    ELLIPSIS: terms.ELLIPSIS.label,
    SPACER: '',

    // Operators
    SUB: terms.SUB.label,
    ADD: terms.ADD.label,
    POS: terms.POS.label,
    NEG: terms.NEG.label,
    MUL: terms.MUL.label,
    DIV: terms.DIV.label,
    MOD: __('modulo'),
    POW: terms.POW.label,
    POW2: exponentRight('x', '2'),
    POW3: exponentRight('x', '3'),
    POWY: exponentRight('x', 'y'),
    POWMINUSONE: exponentRight('x', symbols.minusOne),
    FAC: terms.FAC.label,
    ASSIGN: terms.ASSIGN.label,

    // Variables
    ANS: __('Ans'),

    // Constants
    PI: terms.PI.label,
    E: terms.E.label,

    // Errors
    NAN: __('Error'),
    INFINITY: __('Infinity'),
    ERROR: __('Syntax error'),

    // Functions
    EXP: __('exp'),
    EXPX: exponentRight(symbols.euler, 'x'),
    SQRT: terms.SQRT.label,
    CBRT: exponentLeft(symbols.squareRoot, '3'),
    NTHRT: `${exponentLeft(symbols.squareRoot, 'y')}x`,
    FLOOR: __('floor'),
    CEIL: __('ceil'),
    ROUND: __('round'),
    TRUNC: __('trunc'),
    SIN: __('sin'),
    COS: __('cos'),
    TAN: __('tan'),
    ASIN: exponentRight(__('sin'), symbols.minusOne),
    ACOS: exponentRight(__('cos'), symbols.minusOne),
    ATAN: exponentRight(__('tan'), symbols.minusOne),
    SINH: __('sinh'),
    COSH: __('cosh'),
    TANH: __('tanh'),
    ASINH: exponentRight(__('sinh'), symbols.minusOne),
    ACOSH: exponentRight(__('cosh'), symbols.minusOne),
    ATANH: exponentRight(__('tanh'), symbols.minusOne),
    LN: 'ln',
    LOG: subscriptRight('log', '10'),
    ABS: __('abs'),
    RAND: __('random'),

    // Actions
    CLEAR: __('C'),
    RESET: __('AC'),
    EXECUTE: '=',
    HISTORYUP: historyUpTpl(),
    HISTORYDOWN: historyDownTpl(),
    BACKSPACE: backspaceTpl(),
    DEGREE: __('Deg'),
    RADIAN: __('Rad'),
    SIGN: '&plusmn;'
};
