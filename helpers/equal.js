export default function(Handlebars) {
    Handlebars.registerHelper('equal', function(var1, var2, options) {
        if (var1 == var2) {
            return options.fn(this);
        } else {
            return options.inverse(this);
        }
    });
}
