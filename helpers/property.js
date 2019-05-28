export default function(Handlebars) {
    Handlebars.registerHelper('property', function(name, context) {
        return context[name] || '';
    });
}
