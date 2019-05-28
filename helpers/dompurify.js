import DOMPurify from 'dompurify';
export default function(Handlebars) {
    Handlebars.registerHelper('dompurify', function(context) {
        return DOMPurify.sanitize(context);
    });
}
