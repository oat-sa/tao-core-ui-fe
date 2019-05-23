export default (externals = []) => ({
    name: 'external-alias', // this name will show up in warnings and errors
    resolveId(source, importer) {
        if (importer && externals.find(external => new RegExp(`^${external}`).test(source))) {
            return {
                id: source,
                external: true,
                moduleSideEffects: true
            };
        }
        return null; // other ids should be handled as usually
    }
});
