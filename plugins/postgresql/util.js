let config = require('../../core/util').getConfig();
let watch = config.watch;
if(watch){
    let settings = {
        exchange: watch.exchange,
        pair: [watch.currency, watch.asset]
    }
}
function useSingleDatabase() {
    return !!config.postgresql.database;
}
function useLowerCaseTableNames() {
    return !config.postgresql.noLowerCaseTableName;
}
module.exports = {
    settings: settings,
    useSingleDatabase: useSingleDatabase,
    database: function () {
        return useSingleDatabase() ?
            config.postgresql.database :
            config.watch.exchange.toLowerCase().replace(/\-/g, '');
    },
    table: function (name) {
        if(useSingleDatabase()){
            name = watch.exchange.replace(/\-/g,'') + '_' + name;
        }
        let fullName = [name, settings.pair.join('_')].join('_');
        return useLowerCaseTableNames() ?  fullName.toLowerCase(): fullName;
        },
    schema: function () {
        return config.postgresql.schema ? config.postgresql.schema : 'public';
    }
}