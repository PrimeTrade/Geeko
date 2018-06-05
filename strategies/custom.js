let log = require('../core/log');

let strat = {};

strat.init = () => {
	
	this.input = 'candle';
	this.currentTrend = 'long';
	this.requiredHistory = 0;
	
}

strat.update = (candle) => {
	
	this.toUpdate = MAth.random() < 0.1;
	
}

strat.log = () => {

	log.debug('random number is calculated');
	log.debug('\t', this.randomNumber.toFixed(3));
	
}

strat.check = () =>{
	if(!this.update)
		return ;
	
	if(this.currentTrend === 'long'){
		this.currentTrend = 'short';
		this.advice('short');
	}
	else{
		this.currentTrend = 'long';
		this.advice('long');
	}
}


module.exports = strat;

