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

trader.prototype.getTicker = function(callback) {
	let args = lodash.toArray(arguments);
	this.poloniex.getTicker(function(err, data) {
		if(err)
			return this.retry(this.getTicker, args);

		let tick = data[this.pair];

		callback(null, {
			bid: parseFloat(tick.highestBid),
			ask: parseFloat(tick.lowestAsk),
		});

	}.bind(this));
}

trader.prototype.getFee = function(callback) {
	let set = function(err, data) {
		if(err || data.error)
			return callback(err || data.error);

		callback(false, parseFloat(data.makerFee));
	}
	this.poloniex.lodashprivate('returnFeeInfo', lodash.bind(set, this));
}

trader.prototype.getLotSize = function(tradeType, amount, price, callback) {
  if (amount < this.market.minimalOrder.amount)
    return callback(undefined, { amount: 0, price: 0 });

  if (amount * price < this.market.minimalOrder.order)
    return callback(undefined, { amount: 0, price: 0});

  callback(undefined, { amount: amount, price: price });
}

trader.prototype.buy = function(amount, price, callback) {
	let args = lodash.toArray(arguments);
	let set = function(err, result) {
		if(err || result.error) {
			log.error('unable to buy:', err, result);
			return this.retry(this.buy, args);
		}

		callback(null, result.orderNumber);
	}.bind(this);

	this.poloniex.buy(this.currency, this.asset, price, amount, set);
}

trader.prototype.sell = function(amount, price, callback) {
	let args = lodash.toArray(arguments);
	let set = function(err, result) {
		if(err || result.error) {
			log.error('unable to sell:', err, result);
			return this.retry(this.sell, args);
		}

		callback(null, result.orderNumber);
	}.bind(this);

	this.poloniex.sell(this.currency, this.asset, price, amount, set);
}

trader.prototype.checkOrder = function(order, callback) {
	let check = function(err, result) {
		let stillThere = lodash.find(result, function(o) { return o.orderNumber === order });
		callback(err, !stillThere);
	}.bind(this);

	this.poloniex.myOpenOrders(this.currency, this.asset, check);
}
