import __ from 'i18n';
export default function(Handlebars) {
    Handlebars.registerHelper('__', function(key) {
        return __(key);
    });
}
