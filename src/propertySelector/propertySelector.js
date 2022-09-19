import component from 'ui/component';
import propertySelectorTpl from 'ui/propertySelector/tpl/property-selector';
import propertyDescriptionTpl from 'ui/propertySelector/tpl/property-description';
import checkBoxTpl from 'ui/dialog/tpl/checkbox';
import buttonFactory from 'ui/button';
import 'ui/propertySelector/css/propertySelector.css';
import { data } from 'jquery';


export default function propertySelectorFactory(config) {

    //element references
    let $container;
    let $buttonsContainer;
    let $propertyListContaner;
    let $searchInput;
    let availableProperties = [];
    let selectedProperties = [];
    let search = '';

    function createPropertyOption(property) {
        const descriptionData = Object.assign({}, property);
        if(search !== '') {
            descriptionData.label = highlightCharacter(descriptionData.label, search, search);
        }
        const $propertyDescription =  $(propertyDescriptionTpl({ property: descriptionData }));
        const $checkboxContainer = $('.checkbox-container', $propertyDescription);
        $checkboxContainer.append(checkBoxTpl({ id: descriptionData.id, checked: descriptionData.selected }));

        return $propertyDescription;

    }

    


   const instance = component({
        setData: function setData() {
                $propertyListContaner.empty();
                availableProperties.forEach(property => {
                    property.selected = selectedProperties.includes(property.id);
                    if(search === '' || property.label.includes(search)) {
                        $propertyListContaner.append(createPropertyOption(property))
                    }
                })
        },

        addButtons: function addButtons() {
            const cancelButton = buttonFactory({
                id: "cancel",
                label: "Cancel",
                type: "info",
                cls: "btn-secondary"
            }).on('click', () => {
                this.trigger('cancel');
            });
    
            const saveButton = buttonFactory({
                id: "save",
                label: "Save",
                type: "info",
            }).on('click', () => {
                this.trigger('update', selectedProperties);
            });
                
            cancelButton.render($buttonsContainer)
            saveButton.render($buttonsContainer)    
        },

        setupSearch: function setupSearch($container) {
            $searchInput = $('input.search-property', $container);
            $searchInput.on('input', function() {
                search = $(this).val();
                instance.setData();
            })
        }


   })
   .setTemplate(propertySelectorTpl)
   .on("render", function() {

        //component parts reference assignments
        $container = instance.getElement();
        $propertyListContaner = $('.property-list-container', $container);
        $buttonsContainer = $('.control-buttons-container', $container);
    
        //initial setup of data
        this.setData();

        //setup search behaviour
        this.setupSearch();

        //add and setup buttons
        this.addButtons();
        
        this.trigger("ready")
   })
   .on("init", function() {
        //setup data 
        const data  = instance.config.data;
        if(data.available) {
            if(!Array.isArray(data.available)) {
                availableProperties = Object.values(data.available)
            }else{
                availableProperties = data.available;
            }
        }
        if(data.selected) {
            selectedProperties = data.selected;
        }
   });

    /**
     * Lookup for characters in text to highlight
     * @param {String} text - text to lookup
     * @param {String} highlight - character(s) to be highlighted
     * @param {regExp|String} match - match to be applied in the text
     * @returns {String} - highlighted text
     */
     function highlightCharacter(text, highlight, match) {
        return text.replace(match, `<b>${highlight}</b>`);
    }


   setTimeout(()=>instance.init(config), 0);
   return instance;
}