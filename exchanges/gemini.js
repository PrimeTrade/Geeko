let lodash = require('lodash');
let moment = require('moment');

let Gemini = require('gemini-exchange-coffee-api/lib/gemini');
let util = require('../core/util.js');
let log = require('../core/log');


let trader = function(config) {
  	lodash.bindAll(this);
  	if(lodash.isObject(config)) {
    	this.key = config.key;
    	this.secret = config.secret;
  	}
  	this.name = 'Gemini';
  	this.asset = config.asset;
  	this.currency = config.currency;
  	this.pair = this.asset + this.currency;
  	this.gemini = new Gemini(this.key, this.secret);

  	this.balance;
  	this.price;
}


trader.prototype.retry = function(method, args) {
	let wait = +moment.duration(10, 'seconds');
  	log.debug(this.name, 'returned an error, retrying..');

  	let self = this;

  	lodash.each(args, function(arg, i) {
    	if(lodash.isFunction(arg))
      		args[i] = lodash.bind(arg, self);
  	});

  	setTimeout(function() { method.apply(self, args) },wait);
}

trader.prototype.getPortfolio = function(callback) {
  	let args = lodash.toArray(arguments);
  	this.gemini.walletlodashbalances(function (err, data, body) {

    if(err && err.message === '401') {
      	let e = 'Gemini replied with an unauthorized error. ';
      	e += 'Double check whether your API key is correct.';
      	util.die(e);
    }

    if(err || !data)
      	return this.retry(this.getPortfolio, args);

    // We are only interested in funds in the "exchange" wallet
    data = data.filter(c => c.type === 'exchange');

    let asset = lodash.find(data, c => c.currency.toUpperCase() === this.asset);
    let currency = lodash.find(data, c => c.currency.toUpperCase() === this.currency);

    let assetAmount, currencyAmount;

    if(lodash.isObject(asset) && lodash.isNumber(+asset.available) && !lodash.isNaN(+asset.available)){
      	assetAmount = +asset.available;
    }
    else {
      	log.error(`Gemini did not provide ${this.asset} amount, assuming 0`);
      	assetAmount = 0;
    }

    if(lodash.isObject(currency) && lodash.isNumber(+currency.available) && !lodash.isNaN(+currency.available)){
      	currencyAmount = +currency.available;
      }
    else {
      	log.error(`Gemini did not provide ${this.currency} amount, assuming 0`);
      	currencyAmount = 0;
    }

    const portfolio = [{ name: this.asset, amount: assetAmount },{ name: this.currency, amount: currencyAmount },];

    callback(err, portfolio);
  }.bind(this));
}
