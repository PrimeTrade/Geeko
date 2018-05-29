// file for the changing candle to desirable size

let lodash = require("lodash");

let candleSize, smallCandles;
function checkSize(candleSize) {
  if(!lodash.isNumber(candleSize))
    throw 'candleSize is not a number';

  this.candleSize = candleSize;
  this.smallCandles = [];

  lodash.bindAll(this);
}

checkSize(10);