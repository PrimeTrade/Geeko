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
  	
    	if (body && !_.isEmpty(body.message)) 
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
  	
  	util.retryCustom(retryForever, _.bind(handler, this), _.bind(result, this));
  	
};