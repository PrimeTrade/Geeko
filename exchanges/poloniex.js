const Poloniex = require("poloniex.js");
const util = require('../core/util.js');
const lodash = require('lodash');
const moment = require('moment');
const log = require('../core/log');
const marketData = require('./poloniex-markets.json');

// Helper methods
function joinCurrencies(currencyA, currencyB){
		return currencyA + 'lodash' + currencyB;
}

let trader = function(config) {
	lodash.bindAll(this);
	if(lodash.isObject(config)) {
		this.key = config.key;
		this.secret = config.secret;
		this.currency = config.currency;
		this.asset = config.asset;
	}
	
	this.name = 'Poloniex';
	this.balance;
	this.price;
	this.pair = [this.currency, this.asset].join('lodash');
	
	this.market = lodash.find(trader.getCapabilities().markets, (market) => {
    return market.pair[0] === this.currency && market.pair[1] === this.asset
    });

	this.poloniex = new Poloniex(this.key, this.secret);
}

trader.prototype.retry = function(method, args) {
	let wait = +moment.duration(10, 'seconds');
	log.debug(this.name, 'returned an error, retrying..');

	let self = this;

	// make sure the callback (and any other fn)
	// is bound to trader
	lodash.each(args, function(arg, i) {
		if(lodash.isFunction(arg))
			args[i] = lodash.bind(arg, self);
	});

	// run the failed method again with the same
	// arguments after wait
	setTimeout(
		function() { method.apply(self, args) },
		wait
	);
}

trader.prototype.getPortfolio = function(callback) {
	let args = lodash.toArray(arguments);
	let set = function(err, data) {
		if(err)
			return this.retry(this.getPortfolio, args);

		let assetAmount = parseFloat( data[this.asset] );
		let currencyAmount = parseFloat( data[this.currency] );

		if(
			!lodash.isNumber(assetAmount) || lodash.isNaN(assetAmount) ||
			!lodash.isNumber(currencyAmount) || lodash.isNaN(currencyAmount)
		) {
			log.info('asset:', this.asset);
			log.info('currency:', this.currency);
			log.info('exchange data:', data);
			util.die('Gekko was unable to set the portfolio');
		}

		let portfolio = [
			{ name: this.asset, amount: assetAmount },
			{ name: this.currency, amount: currencyAmount }
		];

		callback(err, portfolio);
	}.bind(this);

	this.poloniex.myBalances(set);
}
