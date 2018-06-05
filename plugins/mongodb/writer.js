let _ = require('lodash');
let config = require('../../core/util.js').getConfig();

let moment = require('moment');
let util = require('../../core/util.js');
let log = require(`${util.dirs().core}log`)

let handle = require('./handle');
let mongoUtil = require('./util');

let Store = function Store(done) {
    _.bindAll(this);
    this.done = done;
    this.db = handle;
    this.historyCollection = this.db.collection(mongoUtil.settings.historyCollection);
    this.adviceCollection = this.db.collection(mongoUtil.settings.adviceCollection);
    this.candleCache = [];
    this.pair = mongoUtil.settings.pair.join('_');
    this.price = 'N/A';
    this.marketTime = 'N/A';
    done();
}
Store.prototype.writeCandles = function writeCandles() {
    if (_.isEmpty(this.candleCache)){
        return;
    }
let candles = [];
    _.each(this.candleCache, candle => {
    let moCandle = {
    time: moment.unix(),
    start: candle.start.unix(),
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
    vwp: candle.vwp,
    volume: candle.volume,
    trades: candle.trades,
    pair: this.pair
    };
    candles.push(moCandle);
});
    this.historyCollection.insert(candles);
    this.candleCache = [];
}
let processCandle = function processCandle(candle,done) {
    this.price = candle.close;
    this.marketTime = candle.start;
    this.candleCache.push(candle);
    if(this.candleCache.length > 100)
        this.writeCandles();
    done();
}
let finalize = function (done) {
    this.writeCandles();
    this.db = null;
    done();
}
let processAdvice = function processAdvice(advice) {
    if(config.candleWriter.muteSoft && advice.recommendation === 'soft'){
        return;
    }
    log.debug(`Writing advice  '${advice.recommendation}' to database.`);
    let moAdvice = {
    time: moment().unix(),
        marketTime: this.marketTime,
        pair: this.pair,
        recommendation: advice.recommendation,
        price: this.price,
        portfolio: advice.portfolio
    };

    this.adviceCollection.insert(moAdvice);
}

if (config.adviceWriter.enabled) {
    log.debug('Enabling adviceWriter.');
    Store.prototype.processAdvice = processAdvice;
}

if (config.candleWriter.enabled) {
    log.debug('Enabling candleWriter.');
    Store.prototype.processCandle = processCandle;
    Store.prototype.finalize = finalize;
}

module.exports = Store;




