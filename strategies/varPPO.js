let lodash = require('lodash');

let config = require('../core/util').getConfig();
var log = require('../core/log');

let setting = config.varPPO;

let momentum = settings.momentum;
let momentumName = momentum.toLowerCase();
let momentumSettings = config[momentum];

let method = {};

method.init = function(){
	
	this.name = 'PPO';
	this.trend = {direction : 'none', duration : 0, persisted: false, adviced: false};
	
	this.requiredHistory = this.tradingAdvisor.historySize;
	
	this.addIndicator('ppo', 'PPO', config.PPO);
	this.addIndicator(momentumName, momentum, momentumSettings);
};

method.log = function(candle){
	
	let digits = 8;
	let ppo = this.indicators.ppo.result;
	let result = ppo.ppo;
	let signal = ppo.PPOsignal;
	let hist = ppo.PPOhist;
	let momentumResult = this.indicators[momentumName][momentumName];
	
	log.debug('\t', 'PPO:', result.toFixed(digits));
  	log.debug('\t', 'PPOsignal:', signal.toFixed(digits));
  	log.debug('\t', 'PPOhist:', hist.toFixed(digits));
  	log.debug('\t', momentum + ':', momentumResult.toFixed(digits));
  	log.debug('\t', 'price:', candle.close.toFixed(digits));
};


method.check = function() {
  	var ppo = this.indicators.ppo.result;
  	var hist = ppo.PPOhist;
	
  	var value = this.indicators[momentumName][momentumName];

  	var thresholds = {
    	low: momentumSettings.thresholds.low + hist * settings.thresholds.weightLow,
    	high: momentumSettings.thresholds.high + hist * settings.thresholds.weightHigh
  	};

  	if(value < thresholds.low) {

    	if(this.trend.direction !== 'up')
      		this.trend = {duration: 0, persisted: false, direction: 'up', adviced: false};

    	this.trend.duration++;

    	log.debug('In uptrend since', this.trend.duration, 'candle(s)');

    	if(this.trend.duration >= settings.thresholds.persistence)
      		this.trend.persisted = true;

    	if(this.trend.persisted && !this.trend.adviced) {
      		this.trend.adviced = true;
      		this.advice('long');
    	} 
    	else
      		this.advice();

  	} 
  	else if(value > thresholds.high) 
  	{

    	if(this.trend.direction !== 'down')
      		this.trend = {duration: 0,persisted: false,direction: 'down',adviced: false};

    	this.trend.duration++;

    	log.debug('In downtrend since', this.trend.duration, 'candle(s)');

    	if(this.trend.duration >= settings.thresholds.persistence)
      		this.trend.persisted = true;

    	if(this.trend.persisted && !this.trend.adviced) {
      		this.trend.adviced = true;
      		this.advice('short');
    	} else
      		this.advice();

	} 
	else {

    	log.debug('In no trend');
    	this.advice();
  	}

};


module.exports = method;