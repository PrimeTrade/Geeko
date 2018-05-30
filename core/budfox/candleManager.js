//CandleManager consumes trades and emits
let _ = require('lodash');
let moment = require('moment');
let fs = require('fs');

let util = require(__dirname + '/../util');
let dirs = util.dirs();
let config = util.getConfig();
let log = require(dirs.core + 'log');
let cp = require(dirs.core + 'core');
let CandleCreator = require(dirs.budfox + 'candleCreator');




let Manager = function () {
    _.bindAll(this);
    this.candleCreator = new CandleCreator;
    this.candleCreator.on('candles',this.relayCandles);
    this.messageFirstCandle = _.once(candle => {
        cp.firstCandle(candle);
})
};
util.makeEventEmitter(Manager);
Manager.prototype.processTrades = function (tradeBatch) {
    this.candleCreator.write(tradeBatch);
}
Manager.prototype.relayCandles = function (candles) {
    this.emit('candles',candles);
    if(!_.size(candles))
        return;
    this.messageFirstCandle(_.first(candles));
    cp.lastCandle(_.last(candles));
}
module.exports = Manager;