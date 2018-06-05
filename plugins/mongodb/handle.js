let mongojs = require('mongojs');
let mongoUtil = require('./util');
let util = require('../../core/util');
let config = util.getConfig();
let dirs = util.dirs();

let pluginHelper = require(`${dirs.core}pluginUtil`);
let pluginMock = {
    slug: 'mongodb adapter',
    dependencies: config.mongodb.dependencies
}
let cannotLoad = pluginHelper.cannotLoad(pluginMock);
if(cannotLoad){
    util.die(cannotLoad);
}
let mode = util.gekkoMode();
let collections = [
    mongoUtil.settings.historyCollection,
    mongoUtil.settings.adviceCollection
]
let connection = mongojs(config.mongodb.connectionString,collections);
let collection = connection.collection(mongoUtil.settings.historyCollection);

if(mode == 'backtest'){
    let pair = mongoUtil.settings.pair.join('_');
    collection.find({pair}).toArray((err,docs) => {
        if(err){
            util.die(err);
        }
        if(docs.length === 0){
            util.die(`History table for ${config.watch.exchange} with pair ${pair} is empty`);
        }
    })
}
if(mongoUtil.settings.exchange){
    collection.createIndex({start: 1,pair: 1},{unique: true});
}
module.exports = connection;