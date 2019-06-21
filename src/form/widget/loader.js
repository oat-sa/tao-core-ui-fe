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
 * Copyright (c) 2019 Open Assessment Technologies SA ;
 */
/**
 * Register common form widgets
 * @author Jean-Sébastien Conan <jean-sebastien@taotesting.com>
 */
import widgetFactory from 'ui/form/widget/widget';
import widgetDefinitions from 'ui/form/widget/definitions';
import widgetCheckBoxProvider from 'ui/form/widget/providers/checkBox';
import widgetComboBoxProvider from 'ui/form/widget/providers/comboBox';
import widgetHiddenProvider from 'ui/form/widget/providers/hidden';
import widgetHiddenBoxProvider from 'ui/form/widget/providers/hiddenBox';
import widgetRadioBoxProvider from 'ui/form/widget/providers/radioBox';
import widgetTextAreaProvider from 'ui/form/widget/providers/textArea';
import widgetTextBoxProvider from 'ui/form/widget/providers/textBox';

widgetFactory.registerProvider(widgetDefinitions.CHECKBOX, widgetCheckBoxProvider);
widgetFactory.registerProvider(widgetDefinitions.COMBOBOX, widgetComboBoxProvider);
widgetFactory.registerProvider(widgetDefinitions.HIDDEN, widgetHiddenProvider);
widgetFactory.registerProvider(widgetDefinitions.HIDDENBOX, widgetHiddenBoxProvider);
widgetFactory.registerProvider(widgetDefinitions.RADIOBOX, widgetRadioBoxProvider);
widgetFactory.registerProvider(widgetDefinitions.TEXTAREA, widgetTextAreaProvider);
widgetFactory.registerProvider(widgetDefinitions.TEXTBOX, widgetTextBoxProvider);

export default widgetFactory;
