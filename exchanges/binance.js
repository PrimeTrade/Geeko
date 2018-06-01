let lodash = require('lodash');

let Errors = require('../core/error');
let log = require('../core/log');

let trader = function (config){
	lodash.bindAll(this);
	
	if(lodash.isObject(config)){
		this.key = config.key;
		this.currency = config.currency.toUpperCase();
		this.secret = config.secret;
		this.asset = config.asset.toUpperCase();
		
	}
	
	this.pair = this.asset + this.currency;
	this.name = 'binance';
	this.market = lodash.find(trader.getCapabilities().market, (market)=>{
		
		return market.pair[0] === this.currenc && market.pair[1] === this.asset ? true:false;
	});
	
	this.binance = new Binance.BinanceRest({
    	key: this.key,
    	secret: this.secret,
    	timeout: 15000,
    	recvWindow: 60000, // suggested by binance
    	disableBeautification: false,
    	handleDrift: true,
  	});
  
};


let retryCritical = {retries:10, factor:1.2, minTimeout:1000, maxTimeout:30000};

let retryForever = {forever:true, factor:1.2, minTimeout:10000, maxTimeout:30000};

let recoverableErrors = new RegExp(/(SOCKETTIMEDOUT|TIMEDOUT|CONNRESET|CONNREFUSED|NOTFOUND|Error -1021|Response code 429|Response code 5)/);

trader.prototype.precessError = function(funcName, error){
	
	if(!error)
		return undefined;
	
	if(!error.message || !error.message.match(recoverableErrors)){
		
    	log.error(`[binance.js] (${funcName}) returned an irrecoverable error: ${error}`);
    	return new Errors.AbortError('[binance.js] ' + error.message || error);
	}
	
	
  	log.debug(`[binance.js] (${funcName}) returned an error, retrying: ${error}`);
  	return new Errors.RetryError('[binance.js] ' + error.message || error);
};

trader.prototype.handleResponse = function(funcName, callback) {
  return (error, body) => {
    if (body && body.code) {
      error = new Error(`Error ${body.code}: ${body.msg}`);
    }

    return callback(this.processError(funcName, error), body);
  }
};