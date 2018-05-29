// file for the changing candle to desirable size

let lodash = require("lodash");

let candleSize, smallCandles;
function candle(candleSize) {
  if(!lodash.isNumber(candleSize))
    throw 'candleSize is not a number';

  this.candleSize = candleSize;
  this.smallCandles = [];

  lodash.bindAll(this);
}

//checkSize(10);


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

//function for calculating candle values
Candle.prototype.calculate = function() {
  let first = this.smallCandles.shift();

  first.vwp = first.vwp * first.volume;

  let candle = lodash.reduce(this.smallCandles,function(candle, m) {
      candle.high = lodash.max([candle.high, m.high]);
      candle.low = lodash.min([candle.low, m.low]);
      candle.close = m.close;
      candle.volume += m.volume;
      candle.vwp += m.vwp * m.volume;
      candle.trades += m.trades;
      return candle;
    },first
  );

  if(candle.volume)
    candle.vwp /= candle.volume;
  else
    candle.vwp = candle.open;

  candle.start = first.start;
  return candle;
}

module.exports = Candle;

//checkSize("kushagra");