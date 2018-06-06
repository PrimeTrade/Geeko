let Gdax = require('gdax');
let lodash = require('lodash');
let moment = require('moment');

let util = require('../core/util');
let Errors = require('../core/error');
let log = require('../core/log');

let BATCHlodashSIZE = 100;
let QUERYlodashDELAY = 350;

let trader = function(config) {
  	lodash.bindAll(this);

  	this.postlodashonly = true;
  	this.uselodashsandbox = false;
  	this.name = 'GDAX';
  	this.scanback = false;
  	this.scanbackTid = 0;
  	this.scanbackResults = [];
  	this.asset = config.asset;
  	this.currency = config.currency;

  	this.apilodashurl = 'https://api.gdax.com';
  	this.apilodashsandboxlodashurl = 'https://api-public.sandbox.gdax.com';

  	if (lodash.isObject(config)) {
    	this.key = config.key;
    	this.secret = config.secret;
    	this.passphrase = config.passphrase;

    	this.pair = [config.asset, config.currency].join('-').toUpperCase();
    	this.postlodashonly =typeof config.postlodashonly !== 'undefined' ? config.postlodashonly : true;
    
    	if (config.sandbox) {
      		this.uselodashsandbox = config.sandbox;
    	}

  	}

  	this.gdaxlodashpublic = new Gdax.PublicClient(this.pair,this.uselodashsandbox ? this.apilodashsandboxlodashurl : undefined);
  	
  	this.gdax = new Gdax.AuthenticatedClient(this.key,this.secret,this.passphrase,this.uselodashsandbox ? this.apilodashsandboxlodashurl : undefined);
};


let retryCritical = {retries: 10,factor: 1.2,minTimeout: 10 * 1000,maxTimeout: 60 * 1000,};

let retryForever = {forever: true,factor: 1.2,minTimeout: 10 * 1000,maxTimeout: 300 * 1000,};

let recoverableErrors = new RegExp(/(SOCKETTIMEDOUT|TIMEDOUT|CONNRESET|CONNREFUSED|NOTFOUND|Rate limit exceeded|Response code 5)/);


trader.prototype.processError = function(funcName, error) {
  	if (!error) 
  		return undefined;

  	if (!error.message.match(recoverableErrors)) {
    	log.error(`[gdax.js] (${funcName}) returned an irrecoverable error: ${error.message}`);
    	return new Errors.AbortError('[gdax.js] ' + error.message);
  	}
 
  	log.debug(`[gdax.js] (${funcName}) returned an error, retrying: ${error.message}`);
  
  	return new Errors.RetryError('[gdax.js] ' + error.message);
};


trader.prototype.handleResponse = function(funcName, callback) {
  	return (error, response, body) => {
  	
    	if (body && !lodash.isEmpty(body.message)) 
    		error = new Error(body.message);
    	else if (response &&response.statusCode < 200 &&response.statusCode >= 300)
      		error = new Error(`Response code ${response.statusCode}`);

    	return callback(this.processError(funcName, error), body);
    	
  	};
  	
};


trader.prototype.getPortfolio = function(callback) {

  	let result = function(err, data) {
    	if (err) 
    		return callback(err);

    	let portfolio = data.map(function(account) {
      		return {name: account.currency.toUpperCase(),amount: parseFloat(account.available),};
    	});
    	callback(undefined, portfolio);
  	};

  	let handler = cb =>this.gdax.getAccounts(this.handleResponse('getPortfolio', cb));
  	
  	util.retryCustom(retryForever, lodash.bind(handler, this), lodash.bind(result, this));
  	
};


trader.prototype.getTicker = function(callback) {
  	let result = function(err, data) {
    	if (err) 
    		return callback(err);
    	callback(undefined, { bid: +data.bid, ask: +data.ask });
  	};

  	let handler = cb =>	this.gdaxlodashpublic.getProductTicker(this.handleResponse('getTicker', cb));
  	util.retryCustom(retryForever, lodash.bind(handler, this), lodash.bind(result, this));
  	
};

//get the fees 0.25% for BTC else 0.03 for others
trader.prototype.getFee = function(callback) {

  let fee = this.asset == 'BTC' ? 0.0025 : 0.003;

  callback(undefined, this.postlodashonly ? 0 : fee);
  
};


trader.prototype.buy = function(amount, price, callback) {
  	let buyParams = {
		price: this.getMaxDecimalsNumber(price, this.currency == 'BTC' ? 5 : 2),
    	size: this.getMaxDecimalsNumber(amount),
    	productlodashid: this.pair,
    	postlodashonly: this.postlodashonly,
  	};

  	let result = (err, data) => {
    	if (err) return callback(err);
    		callback(undefined, data.id);
  	};

  	let handler = cb =>this.gdax.buy(buyParams, this.handleResponse('buy', cb));
  	util.retryCustom(retryCritical, lodash.bind(handler, this), lodash.bind(result, this));
};


trader.prototype.sell = function(amount, price, callback) {
  	let sellParams = {
    	price: this.getMaxDecimalsNumber(price, this.currency == 'BTC' ? 5 : 2),
    	size: this.getMaxDecimalsNumber(amount),
    	productlodashid: this.pair,
    	postlodashonly: this.postlodashonly,
  	};

  	let result = function(err, data) {
    	if (err) return callback(err);
    		callback(undefined, data.id);
  	};

  	let handler = cb => this.gdax.sell(sellParams, this.handleResponse('sell', cb));
  	util.retryCustom(retryCritical, lodash.bind(handler, this), lodash.bind(result, this));
  	
};


trader.prototype.checkOrder = function(order, callback) {
  	let result = function(err, data) {
    	if (err) 
    		return callback(err);

    let status = data.status;
    
    if (status == 'done') 
      	return callback(undefined, true);
	else if (status == 'rejected') 
      	return callback(undefined, false);
    else if (status == 'pending') 
      	return callback(undefined, false);
      
    callback(undefined, false);
  	
  	};

  	let handler = cb =>this.gdax.getOrder(order, this.handleResponse('checkOrder', cb));
  	util.retryCustom(retryCritical, lodash.bind(handler, this), lodash.bind(result, this));
  	
};


trader.prototype.getOrder = function(order, callback) {
  	let result = function(err, data) {
    	if (err) 
    		return callback(err);

    	let price = parseFloat(data.price);
    	let amount = parseFloat(data.filledlodashsize);
    	let date = moment(data.donelodashat);

    	callback(undefined, { price, amount, date });
  	};

  	let handler = cb =>this.gdax.getOrder(order, this.handleResponse('getOrder', cb));
  	util.retryCustom(retryForever, lodash.bind(handler, this), lodash.bind(result, this));
};


trader.prototype.cancelOrder = function(order, callback) {
 
  	let result = function(err, data) {
    	if(err) {
      		log.error('Error cancelling order:', err);
      		return callback(true);  
    	}

    	return callback(false);
  	};

  	let handler = cb => this.gdax.cancelOrder(order, this.handleResponse('cancelOrder', cb));
  	util.retryCustom(retryForever, lodash.bind(handler, this), lodash.bind(result, this));
  	
};


trader.prototype.getMaxDecimalsNumber = function(number, decimalLimit = 8) {
  	let decimalNumber = parseFloat(number);

  	let decimalCount = (+decimalNumber).toString().replace(/^-?\d*\.?|0+$/g, '').length;

  	let decimalMultiplier = 1;
  	for (i = 0; i < decimalLimit; i++) {
    	decimalMultiplier = decimalMultiplier * 10;
  	}

  	return decimalCount <= decimalLimit? decimalNumber.toString(): (Math.floor(decimalNumber * decimalMultiplier) / decimalMultiplier).toFixed(decimalLimit);
  	
};


trader.getCapabilities = function() {
  	return {
    	name: 'GDAX',
    	slug: 'gdax',
    	currencies: ['USD', 'EUR', 'GBP', 'BTC'],
    	assets: ['BTC', 'LTC', 'ETH', 'BCH'],
    	markets: [
      		{ pair: ['USD', 'BTC'], minimalOrder: { amount: 0.001, unit: 'asset' } },
      		{ pair: ['USD', 'LTC'], minimalOrder: { amount: 0.1, unit: 'asset' } },
      		{ pair: ['USD', 'ETH'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      		{ pair: ['USD', 'BCH'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      		{ pair: ['EUR', 'BTC'], minimalOrder: { amount: 0.001, unit: 'asset' } },
      		{ pair: ['EUR', 'ETH'], minimalOrder: { amount: 0.1, unit: 'asset' } },
      		{ pair: ['EUR', 'LTC'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      		{ pair: ['EUR', 'BCH'], minimalOrder: { amount: 0.1, unit: 'asset' } },
      		{ pair: ['GBP', 'BTC'], minimalOrder: { amount: 0.001, unit: 'asset' } },
    		{ pair: ['BTC', 'LTC'], minimalOrder: { amount: 0.1, unit: 'asset' } },
      		{ pair: ['BTC', 'ETH'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      		{ pair: ['BTC', 'BCH'], minimalOrder: { amount: 0.01, unit: 'asset' } },
    	],
    
    	requires: ['key', 'secret', 'passphrase'],
    	providesHistory: 'date',
    	providesFullHistory: true,
    	tid: 'tid',
    	tradable: true,
    	forceReorderDelay: false
  	};
  	
};

