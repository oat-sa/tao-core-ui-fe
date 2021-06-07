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
 * Copyright (c) 2021  (original work) Open Assessment Technologies SA;
 *
 * @author Juan Luis Gutierrez Dos Santos <juanluis.gutierrezdossantos@taotesting.com>
 */

/**
 * Controls media size
 */
 import $ from 'jquery';
 import _ from 'lodash';
 import component from 'ui/component';
 import tpl from 'ui/mediaEditor/plugins/mediaAlignment/tpl/mediaAlignment';
 import 'ui/mediaEditor/plugins/mediaAlignment/style.css';
 import { FLOAT_LEFT_CLASS, FLOAT_RIGHT_CLASS } from './helper';
 
 /**
  * Creates mediaAlignment component
  * @param $container
  * @param media
  * @fires "changed" - on State changed
  * return {component|*}
  */
 export default function mediaAlignmentFactory($container, media) {
     let $template;

     const mediaAlignmentComponent = component(
         {
             /**
              * Apply configurations to the view
              */
             update(conf) {
                 $template.find('input:checked').prop('checked', false);
                 switch (conf) {
                     case 'wrap-right':
                         conf = 'right';
                         $template.find('input[name="wrap-right"]').prop('checked', true);
                         break;
                     case 'wrap-left':
                         conf = 'left';
                         $template.find('input[name="wrap-left"]').prop('checked', true);
                         break;
                     default:
                         conf = 'default';
                         $template.find('input[name="wrap-inline"]').prop('checked', true);
                         break;
                 }
                 media.align = conf;
                 this.trigger('change', media);
             }
         }
     );
 
     mediaAlignmentComponent
         .on('init', function() {
             this.render($container);
         })
         .on('render', function () {
             $template = $(tpl());
             $template.appendTo($container);
             const classListTag = media.$node[0].parentNode.classList;
 
             if (classListTag.contains(FLOAT_RIGHT_CLASS)) {
                 this.update('wrap-right');
             } else if (classListTag.contains(FLOAT_LEFT_CLASS)) {
                 this.update('wrap-left');
             } else {
                 this.update('wrap-inline');
             }
 
             $template.on('click', event => {
                 event.target.name && this.update(event.target.name);
             });
         })
         .on('destroy', function() {
             $template.remove();
         });
 
     _.defer(() => mediaAlignmentComponent.init());
 
     return mediaAlignmentComponent;
 }
