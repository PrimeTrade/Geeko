let Coingi = require('coingi');
let moment = require('moment');
let lodash = require('lodash');

let util = require('../core/util');
let Errors = require('../core/error');
let log = require('../core/log');


let trader = function (config) {
  	lodash.bindAll(this);

  	if (lodash.isObject(config)) {
  
    	this.key = config.key;
    	this.secret = config.secret;
    	
    	this.currency = config.currency;
    	this.currency.toUpperCase();
    
    	this.asset = config.asset.toUpperCase();
    	this.asset.toUpperCase();
  	}

  	this.pair = this.asset + "-" + this.currency;
  	this.name = 'coingi';
  	this.since = null;

  	this.coingi = new Coingi(this.key,this.secret,{timeout: +moment.duration(60, 'seconds')});
}


let retryCritical = {retries: 10,factor: 1.2,minTimeout: 1000,maxTimeout: 30000};

let retryForever = {forever: true,factor: 1.2,minTimeout: 10,maxTimeout: 30};

let recoverableErrors = new RegExp(/(SOCKETTIMEDOUT|TIMEDOUT|CONNRESET|CONNREFUSED|NOTFOUND|API:Invalid nonce|Service:Unavailable|Request timed out|Response code 520|Response code 504|Response code 502)/);


trader.prototype.processError = function (funcName, error) {
  	if (!error)
    	return undefined;

  	if (!error.message.match(recoverableErrors)) {
    	log.error(`[coingi.js] (${funcName}) returned an irrecoverable error: ${error.message}`);
    	return new Errors.AbortError('[coingi.js] ' + error.message);
  	}

  	log.debug(`[coingi.js] (${funcName}) returned an error, retrying: ${error.message}`);
  	return new Errors.RetryError('[coingi.js] ' + error.message);
};

trader.prototype.handleResponse = function(funcName , callback){

	return (error, body) => {
    if (!error) {
      	error = lodash.isEmpty(body) ?  new Error('NO DATA WAS RETURNED') : new Error(body.error);
    }

    return callback(this.processError(funcName, error), body);
  }	
};

trader.prototype.getTicker = function (callback) {
  	let setTicker = function (err, data) {
    	if (err)
      		return callback(err);

    	let ticker = {ask: data.asks[0].price,bid: data.bids[0].price};
    
    	callback(undefined, ticker);
  	};

  	let handler = (cb) => this.coingi.api('order-book', "/" + this.pair + "/1/1/1", this.handleResponse('getTicker', cb));
  	util.retryCustom(retryForever, _.bind(handler, this), _.bind(setTicker, this));
};


trader.prototype.getFee = function (callback) {
  	callback(undefined, 0.002);
};

trader.prototype.getPortfolio = function(callback){

	let setBalance = function(err, data){
	
		if(err)
			return callback(err);
		
		log.debug('[coingi.js] entering "setBalance callback after coingi-api call, data:', data);
		
		let portfolio = [];
		for(let i=0; i<data.length; i++){
			portfolio.push({name: data[i].currency.name.toUpperCase(),amount: data[i].availale});
		}
		return callback(undefined, portfolio);
	};
	
	let handler =  (cb) => this.coingi.api('balance', {currencies: this.asset + ","	 +this.currency}, this.handleResponse('getPortfolio', cb));
	util.retryCustom(retryForever, _.bind(handler, this), _.bind(setBalance, this));
	
};	




