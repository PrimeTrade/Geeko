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

