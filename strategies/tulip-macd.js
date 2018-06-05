let method = {};


method.init = function() {
  	this.name = 'tulip-macd';
  	this.trend = 'none';
  	this.requiredHistory = this.tradingAdvisor.historySize;

  	let customMACDSettings = this.settings.parameters;

  	this.addTulipIndicator('mymacd', 'macd', customMACDSettings);
}


method.check = function(candle) {

  	let price = candle.close;
  	let result = this.tulipIndicators.mymacd.result;
  	let macddiff = result['macd'] - result['macdSignal'];
	
  	if(this.settings.thresholds.down > macddiff && this.trend !== 'short') {
    	this.trend = 'short';
    	this.advice('short');
  	} 
  	else if(this.settings.thresholds.up < macddiff && this.trend !== 'long'){
    	this.trend = 'long';
    	this.advice('long');
	}
	
}

module.exports = method;


