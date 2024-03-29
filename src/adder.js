/**
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 * @requires jquery
 * @requires lodash
 * @requires core/pluginifier
 * @requires core/dataattrhandler
 */
import $ from 'jquery';
import _ from 'lodash';
import Handlebars from 'handlebars';
import Pluginifier from 'core/pluginifier';
import DataAttrHandler from 'core/dataattrhandler';

const ns = 'adder';
const dataNs = 'ui.' + ns;

//positions available must match jquery function {position}To (ie. appendTo)
const positions = ['append', 'prepend'];

const defaults = {
    bindEvent: 'click',
    disableClass: 'disabled',
    position: 'append',

    /**
     * Async callback used to populate template data
     * @example templateData : function(cb){
     *       $.getJSON(url).done(function(data){
     *           cb(data);
     *       }).fails(function(){
     *           cb({});
     *       });
     *
     *       //or
     *
     *       cb({
     *           key: value,
     *           key2: value2
     *       });
     * }
     *
     * @callback templateData
     * @params {dataCallback} [] - an optionnal callback used
     * @returns {object} the data to be bound to the template
     */
    templateData: function(dataCallback) {
        /**
         * This callback is used to populate template data
         * @callback dataCallback
         * @params {object} data - the data to be bound to the template
         */
        dataCallback({});
    },
    /**
     * Async callback used to execute add
     * @example checkAndCallAdd : function(executeAdd){
     *       $.getJSON(url).done(function(executeAdd){
     *           if(data.condition) {
     *              executeAdd();
     *           }
     *       });
     *
     *       //or
     *       if (noItems) {
     *          executeAdd();
     *       }
     * }
     *
     * @callback checkAndCallAdd
     * @params {executeAdd} - callback to run add function
     */
    checkAndCallAdd: function(executeAdd) {
        /**
         * This callback is used to populate template data
         * @callback executeAdd
         */
        executeAdd();
    },
};

/**
 * The Adder component, that helps you to add a new element,
 * from a DOM element or a template
 * @exports ui/adder
 */
const Adder = {
    /**
     * Initialize the plugin.
     *
     * Called the jQuery way once registered by the Pluginifier.
     * @example $('selector').adder({target : $('target'),  content: $('#tmplId') });
     * @public
     *
     * @constructor
     * @param {Object} options - the plugin options
     * @param {jQueryElement} options.target - the element to add content to
     * @param {string|boolean} [options.bindEvent = 'click'] - the event that trigger the adding
     * @param {jQueryElement} [options.content] - a DOM Element or a 'text/template' script tag that contains the template
     * @param {string} [options.position = 'append'] - how to add the content regarding the target (the name of a valid jQUery maniuplation function)
     * @param {templateData} [options.templateData] - a callback used to populate the template
     * @param {Object} [options.checkAndCallAdd] - a callback used to check conditions before call add
     * @fires Adder#create.adder
     * @returns {jQueryElement} for chaining
     */
    init: function(options) {
        options = _.defaults(options || {}, defaults);

        if (typeof options.content === 'function') {
            //compiled template
            options._template = options.content;
        } else {
            const $content = options.content;
            if ($content.prop('tagName') === 'SCRIPT' && $content.attr('type') === 'text/template') {
                //template element
                options._template = Handlebars.compile($content.html());
            } else {
                //DOM content
                options._html = $content.html();
            }
        }
        //check supported positions
        if (!_.includes(positions, options.position)) {
            return $.error('Unsupported position option');
        }

        return this.each(function() {
            const $elt = $(this);

            if (!$elt.data(dataNs)) {
                //add data to the element
                $elt.data(dataNs, options);

                //bind an event to trigger the addition
                if (options.bindEvent !== false) {
                    $elt.on(options.bindEvent, function(e) {
                        e.preventDefault();
                        options.checkAndCallAdd(() => Adder._add($elt));
                    });
                }

                /**
                 * The plugin have been created.
                 * @event Adder#create.adder
                 */
                $elt.trigger('create.' + ns);
            }
        });
    },

    /**
     * Trigger the adding.
     *
     * Called the jQuery way once registered by the Pluginifier.
     * @example $('selector').adder('add');
     * @param {jQueryElement} $elt - plugin's element
     * @fires Adder#add.adder
     * @fires Adder#add
     */
    _add: function($elt) {
        const options = $elt.data(dataNs);

        const applyTemplate = function applyTemplate($content, position, $target, data) {
            $content[position]($target);

            /**
             * The target has received content.
             * @event Adder#add
             * @param {jQueryElement} - the added content
             * @param {Object} - the data bound to the added content
             */
            $target.trigger('add', [$content, data]);

            /**
             * The content has been added.
             * @event Adder#add.adder
             * @param {jQueryElement} - the target
             * @param {jQueryElement} - the added content
             * @param {Object} - the data bound to the added content
             */
            $elt.trigger('add.' + ns, [$target, $content, data]);
        };

        const $target = options.target;
        //call appendTo, prependTo, etc.
        const position = options.position + 'To';
        //DOM element or template
        if (typeof options._template === 'function') {
            options.templateData(function templateDataCallback(data) {
                applyTemplate($($.parseHTML(options._template(data))), position, $target, data);
            });
        } else {
            applyTemplate($($.parseHTML(options._html)), position, $target);
        }
    },

    /**
     * Destroy completely the plugin.
     *
     * Called the jQuery way once registered by the Pluginifier.
     * @example $('selector').adder('destroy');
     * @public
     * @fires Adder#destroy.adder
     */
    destroy: function() {
        this.each(function() {
            const $elt = $(this);
            const options = $elt.data(dataNs);
            if (options.bindEvent !== false) {
                $elt.off(options.bindEvent);
            }
            $elt.removeData(dataNs);

            /**
             * The plugin have been destroyed.
             * @event Adder#destroy.adder
             */
            $elt.trigger('destroy.' + ns);
        });
    }
};

//Register the toggler to behave as a jQuery plugin.
Pluginifier.register(ns, Adder, {
    expose: ['add']
});

/**
 * The only exposed function is used to start listening on data-attr
 *
 * @public
 * @example define(['ui/adder'], function(adder){ adder($('rootContainer')); });
 * @param {jQueryElement} $container - the root context to listen in
 */
export default function listenDataAttr($container) {
    new DataAttrHandler('add', {
        container: $container,
        listenerEvent: 'click',
        namespace: dataNs
    })
        .init(function($elt, $target) {
            $elt.adder({
                target: $target,
                bindEvent: false,
                content: $($elt.attr('data-content'))
            });
        })
        .trigger(function($elt) {
            $elt.adder('add');
        });
}
