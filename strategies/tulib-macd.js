let method = {};

method.init = function(){
	
	this.name = 'talib-macd';
	this.input = 'candle';
	this.trend = 'none';
	
	this.requiredHistory = this.tradingAdvisor.historySize;
	
	let customMACDSettings = this.settings.parameters;
	
	this.addRTalibIndicator('mymacd', 'macd', customMACDSettings);
	
}

method.log = function(){
	//functionality can be added if required
}

method.update = function(){
	//functionlity can be added if required
}

method.check = function(candle){
	
	let price = candle.close;
	let result = this.talibIndicators.mymacd.result;
	let macddiff = result['outMACD'] - result['outMACDSignal'];
	
	if(this.settings.thresholds.down > macddiff && this.trend !== 'short'){
	
		this.trend = 'short';
		this.advice('short');
	}
	else if(this.settings.thresholds.up < macdiff && this.trend !== 'long'){
		this.trend = 'long';
		this.advice('long');
	}
}

module.exports = method;

