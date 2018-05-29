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


//function to check if array is passed then add the element of array to smallCandles
Candle.prototype.write = function(candles) {
  if(!lodash.isArray(candles))
     console.log('candles is not an array');

  lodash.each(candles, function(candle) {
    this.smallCandles.push(candle);
  }, this);
}

//check if smallCandle size is divisible by candleSize 
Candle.prototype.check = function() {
  if(lodash.size(this.smallCandles) % this.candleSize !== 0)
    return;

  this.emit('candle', this.calculate());
  this.smallCandles = [];
}
