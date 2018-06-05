let method = {};


method.init = function() {
  	this.name = 'tulip-adx'
  	this.trend = 'none';
  	this.requiredHistory = this.settings.historySize;
  	
  	this.addTulipIndicator('myadx', 'adx', this.settings);
}


method.check = function(candle) {
  	let price = candle.close;
  	let adx = this.tulipIndicators.myadx.result.result;

  	if(this.settings.thresholds.down > adx && this.trend !== 'short') {
    	this.trend = 'short';
    	this.advice('short');
  	} 
  	else if(this.settings.thresholds.up < adx && this.trend !== 'long'){
    	this.trend = 'long';
    	this.advice('long');
  	}
}

module.exports = method;

