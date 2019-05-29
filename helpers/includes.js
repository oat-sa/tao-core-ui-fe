import _ from 'lodash';

export default function(Handlebars) {
    Handlebars.registerHelper('includes', function(haystack, needle, options) {
        if (_.contains(haystack, needle)) {
            return options.fn(this);
        }
    });
}
