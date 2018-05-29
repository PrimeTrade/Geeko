const a = require('lodash');
const util =require('util');
const dirs = util.dirs;


const Manager = function (config) {
    a.bindAll(this);
//fetch trades
    this.source = new MarketFetcher(config);

    //relay newly fetched trades
    this.source.on('trades batch',this.relayTrades);
}

util.makeEventEmitter(Manager);
//Handlers

Manager.prototype.retrieve = function () {
    this.source.fetch();
}
Manager.prototype.relayTrades = function(batch){
    this.emit('trades',batch);
    this.sendStartAt(batch);
    cp.update(batch.last.date.format());
}
Manager.prototype.sendStartAt = a.once(function (batch) {
    cp.startAt(batch.first.date.format())

});

