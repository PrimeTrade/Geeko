let util = require ('../core/log');
let UO = require('./indicators/UO.js');

let lodash = require('lodash');

let method = {};

method.init = function(){

	this.name = 'UO';
	this.trend = {direction: 'none',duration: 0,persisted: false,adviced: false};
	
	this.requiredHistory = this.tradingAdvisor.historySize;
	
	this.addIndicator('uo', 'UO', this.settings);
}


method.log = function(candle){

	let digits = 8 ;
	let uo = this.indicators.uo;
	
	log.debug('calculated Ultimate Oscillator properties for candle:');
  	log.debug('\t', 'UO:', uo.uo.toFixed(digits));
  	log.debug('\t', 'price:', candle.close.toFixed(digits));
  	
}

method.check = function() {
  	let uo = this.indicators.uo;
  	let uoVal = uo.uo;

  	if(uoVal > this.settings.thresholds.high) {

    	if(this.trend.direction !== 'high')
      		this.trend = {duration: 0,persisted: false,direction: 'high',adviced: false};

    	this.trend.duration++;

    	log.debug('In high since', this.trend.duration, 'candle(s)');

    	if(this.trend.duration >= this.settings.thresholds.persistence)
      		this.trend.persisted = true;

    	if(this.trend.persisted && !this.trend.adviced) {
      		this.trend.adviced = true;
      		this.advice('short');
    	} 
    	else
      		this.advice();
      		

  	} 
  	
  	else if(uoVal < this.settings.thresholds.low) {

    	if(this.trend.direction !== 'low')
      		this.trend = {duration: 0,persisted: false,direction: 'low',adviced: false};

    	this.trend.duration++;

    	log.debug('In low since', this.trend.duration, 'candle(s)');

    	if(this.trend.duration >= this.settings.thresholds.persistence)
      		this.trend.persisted = true;

    	if(this.trend.persisted && !this.trend.adviced) {
      		this.trend.adviced = true;
      		this.advice('long');
    	} 
    	else
      		this.advice();

  	}
  	 
  	else {
  	
    	log.debug('In no trend');

    	this.advice();
  	}
}

module.exports = method;