//Budfox is small part of gekko's core
//It aggregates realtime market data from any supported exchange into readable stream of candles

let _ = require('lodash');
let async = require('async');
let util = require(__dirname + '/../util');
let dirs = util.dirs();
let Heart = require(dirs.budfox + 'heart');
let MarketDataProvider = require(dirs.budfox + 'marketDataProvider');
let CandleManager = require(dirs.budfox + 'candleManager');


let budfox = function (config) {
    _.bindAll(this);
Readable.call( this,{objectMode:true});

this.heart = new Heart;
this.marketDataProvider = new MarketDataProvider(config);
this.candleManager = new CandleManager;

this.heart.on(
    'tick',
    this.marketDataProvider.retrieve
);
this.marketDataProvider.on(
    'trades',
    this.candleManager.processTrades
);
this.candleManager.on(
    'candles',
    this.pushCandles
);
this.heart.pump();

}
let Readable = require('stream').Readable;
budfox.prototype = Object.create(Readable.prototype, {
    constructor:
        {
            value:budfox
        }
});
//No callback is given
budfox.prototype._read=function noop() {

}
budfox.prototype.pushCandles = function(candles){
    _.each(candles,this.push);
}
module.exports = budfox;