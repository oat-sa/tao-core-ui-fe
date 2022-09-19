import component from 'ui/component';
import propertySelectorTpl from 'ui/propertySelector/tpl/property-selector';
import propertyDescriptionTpl from 'ui/propertySelector/tpl/property-description';
import checkBoxTpl from 'ui/dialog/tpl/checkbox';
import buttonFactory from 'ui/button';
import 'ui/propertySelector/css/propertySelector.css';


export default function propertySelectorFactory(config) {


    let $container;
    let $buttonsContainer;
    let $propertyListContaner;

    function createPropertyOption(property) {
        
        const $propertyDescription =  $(propertyDescriptionTpl({ property }));
        const $checkboxContainer = $('.checkbox-container', $propertyDescription);
        $checkboxContainer.append(checkBoxTpl({ id: property.id, checked: property.selected }));

        return $propertyDescription;

    }

    


   const instance = component({
        setData: function setData($select, data) {
            let properties = [];
            if(data.available) {
                if(!Array.isArray(data.available)) {
                    properties = Object.values(data.available)
                }else{
                    properties = data.available;
                }
                data.selected = data.selected || [];
                properties.forEach(property => {
                    property.selected = data.selected.includes(property.id);
                    $select.append(createPropertyOption(property))
                })
                
            }
        }
   })
   .setTemplate(propertySelectorTpl)
   .on("render", function() {
        console.log("render is done")
        $container = instance.getElement();
        $propertyListContaner = $('.property-list-container', $container);
        $buttonsContainer = $('.control-buttons-container', $container);

        this.setData($propertyListContaner, instance.config.data);

        //buttons
        const cancelButton = buttonFactory({
            id: "cancel",
            label: "Cancel",
            type: "info",
            cls: "btn-secondary"
        }).on('click', () => {
            console.log('cancel click')
        });

        const saveButton = buttonFactory({
            id: "save",
            label: "Save",
            type: "info",
        }).on('click', () => {
            console.log('cancel click')
        });
            
        cancelButton.render($buttonsContainer)
        saveButton.render($buttonsContainer)

        
        this.trigger("ready")
   })
   .on("init", function() {
        console.log("init done")
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