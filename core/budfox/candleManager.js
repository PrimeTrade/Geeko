//CandleManager consumes trades and emits
let a = require('lodash');
let moment = require('moment');
let fs = require('fs');

let util = require('util');




let Manager = function () {
    a.bindAll(this);
    this.candleCreator = new CandleCreator;
    this.candleCreator.on('candles',this.relayCandles);
    this.messageFirstCandle = a.once(candle => {
        cp.firstCandle(candle);
})
};
util.makeEventEmitter(Manager);
Manager.prototype.processTrades = function (tradeBatch) {
    this.candleCreator.write(tradeBatch);
}
Manager.prototype.relayCandles = function (candles) {
    this.emit('candles',candles);
    if(!a.size(candles))
        return;
    this.messageFirstCandle(a.first(candles));
    cp.lastCandle(a.last(candles));
}
module.exports = Manager;