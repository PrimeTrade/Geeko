let EMA = require('./Ema.js');


let indicator = function(config) {
  	this.input = 'price';
  	this.diff = false;
  	this.short = new EMA(config.short);
  	this.long = new EMA(config.long);
  	this.signal = new EMA(config.signal);
}


indicator.prototype.update = function(price) {
  	this.short.update(price);
  	this.long.update(price);
  	this.calculateEMAdiff();
  	this.signal.update(this.diff);
  	this.result = this.diff - this.signal.result;
}


indicator.prototype.calculateEMAdiff = function() {
  	let shortEMA = this.short.result;
  	let longEMA = this.long.result;

  	this.diff = shortEMA - longEMA;
}


module.exports = indicator;