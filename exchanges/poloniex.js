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

trader.prototype.getOrder = function(order, callback) {

	let get = function(err, result) {

		if(err)
			return callback(err);

		let price = 0;
		let amount = 0;
		let date = moment(0);

		if(result.error === 'Order not found, or you are not the person who placed it.')
			return callback(null, {price, amount, date});

		lodash.each(result, trade => {

			date = moment(trade.date);
			price = ((price * amount) + (+trade.rate * trade.amount)) / (+trade.amount + amount);
			amount += +trade.amount;

		});

		callback(err, {price, amount, date});
	}.bind(this);

	this.poloniex.returnOrderTrades(order, get);
}

trader.prototype.cancelOrder = function(order, callback) {
	let args = lodash.toArray(arguments);
	let cancel = function(err, result) {

		// check if order is gone already
		if(result.error === 'Invalid order number, or you are not the person who placed the order.')
			return callback(true);

		if(err || !result.success) {
			log.error('unable to cancel order', order, '(', err, result, '), retrying');
			return this.retry(this.cancelOrder, args);
		}

		callback();
	}.bind(this);

	this.poloniex.cancelOrder(this.currency, this.asset, order, cancel);
}

trader.prototype.getTrades = function(since, callback, descending) {

	let firstFetch = !!since;

	let args = lodash.toArray(arguments);
	let process = function(err, result) {
		if(err) {
			return this.retry(this.getTrades, args);
		}

		// Edge case, see here:
		// @link https://github.com/askmike/gekko/issues/479
		if(firstFetch && lodash.size(result) === 50000)
			util.die(
				[
					'Poloniex did not provide enough data. Read this:',
					'https://github.com/askmike/gekko/issues/479'
				].join('\n\n')
			);

		result = lodash.map(result, function(trade) {
			return {
				tid: trade.tradeID,
				amount: +trade.amount,
				date: moment.utc(trade.date).unix(),
				price: +trade.rate
			};
		});

		callback(null, result.reverse());
	};

	let params = {
		currencyPair: joinCurrencies(this.currency, this.asset)
	}

	if(since)
		params.start = since.unix();

	this.poloniex.lodashpublic('returnTradeHistory', params, lodash.bind(process, this));
}

trader.getCapabilities = function () {
	return {
		name: 'Poloniex',
		slug: 'poloniex',
		currencies: marketData.currencies,
		assets: marketData.assets,
		markets: marketData.markets,
		currencyMinimums: {BTC: 0.0001, ETH: 0.0001, XMR: 0.0001, USDT: 1.0},
		requires: ['key', 'secret'],
		tid: 'tid',
		providesHistory: 'date',
		providesFullHistory: true,
		tradable: true
	};
}

module.exports = trader;