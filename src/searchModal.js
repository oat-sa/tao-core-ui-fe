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
 * Copyright (c) 2020 (original work) Open Assessment Technologies SA ;
 */
import $ from 'jquery';
import _ from 'lodash';
import __ from 'i18n';
import layoutTpl from 'ui/searchModal/tpl/layout';
import 'ui/searchModal/css/searchModal.css';
import component from 'ui/component';
import 'ui/modal';
import 'ui/datatable';

export default function searchModalFactory(config) {
    const instance = component().setTemplate(layoutTpl);
    let searchInput = null;
    let searchButton = null;
    let clearButton = null;
    let running = false;
    instance.on('render', () => renderModal());
    instance.on('destroy', () => destroyModal());

    function renderModal() {
        initModal();
        initUiSelectors();
        searchButton.trigger('click');
    }

    function destroyModal() {
        instance.getElement()
            .removeClass('modal')
            .modal('destroy');
        $('.modal-bg').remove();
    }

    function initModal() {
        instance
        .getElement()
        .addClass('modal')
        .on('closed.modal', function() {
            instance.destroy();
        })
        .modal({
            disableEscape: true,
            width: $( window ).width(),
            minHeight: $( window ).height(),
            top: 1, // can not be set to 0 because on modal.js:230 a 0 is a falsy value so default top of 40 px is applied
            modalCloseClass: 'modal-close-left'
        })
        .focus();
    }

    function initUiSelectors() {
        searchButton = $('.btn-search', instance.getElement());
        clearButton = $('.btn-clear', instance.getElement());
        searchInput = $('.search-bar-container input', instance.getElement());
        searchButton.on('click', search);
        clearButton.on('click', clear);
        searchInput.val(config.query);
    }

    function search() {
        const query = searchInput.val();

        //throttle and control to prevent sending too many requests
        const searchHandler = _.throttle(function searchHandlerThrottled(query){
            if(running === false){
                running = true;
                $.ajax({
                    url : config.url,
                    type : 'POST',
                    data :  {query : query},
                    dataType : 'json'
                }).done(function(response){
                    if(response && response.result && response.result === true){
                        buildResponseTable(response);
                    } else {
                        // TODO - Manage no results
                        // feedback().warning(__('No results found'));
                    }
                }).complete(function(){
                    running = false;
                });
            }
        }, 100);

        searchHandler(query);
    }

    function buildResponseTable(data){
        //update the section container
        const $tableContainer = $('<div class="flex-container-full"></div>');
        const section = $('.content-container', instance.getElement());
        section.empty();
        section.append($tableContainer);

        //create datatable
        $tableContainer.datatable({
            url: data.url,
            model : _.values(data.model),
            actions : {
                open : function openResource(id){
                    config.events.trigger('refresh', {
                        uri: id
                    });
                    destroyModal();
                }
            },
            params : {
                params : data.params,
                filters: data.filters,
                rows: 20
            }
        });
    };

    function clear() {
        const section = $('.content-container', instance.getElement());
        section.empty();
        searchInput.val('');
    }

    return instance.init({renderTo:'body'});
}