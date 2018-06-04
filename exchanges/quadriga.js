//markset detection of outstanding orders

const QuadrigaCX = require('quadrigacx');
const moment = require('moment');
const lodash = require('lodash');

const util = require('../core/util');
const log = require('../core/log');
const marketData = require('./quadriga-markets.json');


let trader = function(config) {
  	lodash.bindAll(this);

  	if(lodash.isObject(config)) {
    	this.key = config.key;
    	this.secret = config.secret;
    	this.clientId = config.username;
    	this.asset = config.asset.toUpperCase();
    	this.currency = config.currency.toUpperCase();
  	}
  
  	this.name = 'quadriga';
  	this.since = null;

  	this.market = lodash.find(trader.getCapabilities().markets, (market) => {
    	return market.pair[0] === this.currency && market.pair[1] === this.asset
  	});
  	this.pair = this.market.book;
  
  	this.quadriga = new QuadrigaCX(
    this.clientId ? this.clientId : "1",
    this.key ? this.key : "",
    this.secret ? this.secret : "",
  );
}

//some of the helper functions
trader.prototype.retry = function(method, warn, args, error) {
  	let wait = +moment.duration(30, 'seconds');
  	if (error.code === 200) 
  	{
    	log.debug(`${this.name}: API rate limit exceeded! unable to call ${method}, will retry in 2 minutes`)
    	wait = +moment.duration(120, 'seconds');
  	}
  	else 
  	{
    	log.debug(JSON.stringify(error));
    	log.debug(`${this.name}: ${warn}, will retry in 30 seconds`);
  	}

  	let self = this;

  	lodash.each(args, function(arg, i) {
    	if(lodash.isFunction(arg))
      		args[i] = lodash.bind(arg, self);
  		});

  
  	setTimeout(function() { method.apply(self, args) },wait);
  	
};


// functions for getting the details of trades
trader.prototype.getTrades = function(since, callback, descending) {
  	let args = lodash.toArray(arguments);
  	let process = function(err, trades) {
    	if (trades && trades.error) 
    		return this.retry(this.getTrades, 'unable to get trades', args, trades.error);
    	if (err) 
    		return this.retry(this.getTrades, 'unable to get trades', args, err);

    	let parsedTrades = [];
    	lodash.each(trades, function(trade) {parsedTrades.push({tid: trade.tid,date: trade.date,price: parseFloat(trade.price),amount: parseFloat(trade.amount)});
    }, this);

    if(descending)
      callback(null, parsedTrades);
    else
      callback(null, parsedTrades.reverse());
  	};

  	let reqData = {book: this.pair,time: 'hour'};

  	this.quadriga.api('transactions', reqData, lodash.bind(process, this));
};


trader.prototype.getPortfolio = function(callback) {
  	let args = lodash.toArray(arguments);
  	let set = function(err, data) {

    if (data && data.error) 
    	return this.retry(this.getPortfolio, 'unable to get balance', args, data.error);
    if (err) 
    	return this.retry(this.getPortfolio, 'unable to get balance', args, err);

    let assetAmount = parseFloat( data[this.asset.toLowerCase() + 'lodashavailable'] );
    let currencyAmount = parseFloat( data[this.currency.toLowerCase() + 'lodashavailable'] );

    if(!lodash.isNumber(assetAmount) || lodash.isNaN(assetAmount)) {
      	log.error(`Quadriga did not return balance for ${this.asset.toLowerCase()}, assuming 0.`);
      	assetAmount = 0;
    }

    if(!lodash.isNumber(currencyAmount) || lodash.isNaN(currencyAmount)) {
      	log.error(`Quadriga did not return balance for ${this.currency.toLowerCase()}, assuming 0.`);
      	currencyAmount = 0;
    }

    let portfolio = [{ name: this.asset, amount: assetAmount },{ name: this.currency, amount: currencyAmount }];
    callback(err, portfolio);
  	};

  	this.quadriga.api('balance', lodash.bind(set, this));
};


trader.prototype.getFee = function(callback) {
  callback(false, 0.005);
};


trader.prototype.getTicker = function(callback) {
  	let set = function(err, data) {

    if (data && data.error) 
    	return this.retry(this.getTicker, 'unable to get quote', args, data.error);
    if (err) 
    	return this.retry(this.getTicker, 'unable to get quote', args, err);

    let ticker = {ask: data.ask,bid: data.bid};
    callback(err, ticker);
  	};

  	this.quadriga.api('ticker', {book: this.pair}, lodash.bind(set, this));
};

trader.prototype.roundAmount = function(amount) {
  	let precision = 100000000;

  	let parent = this;
  	let market = trader.getCapabilities().markets.find(function(market){ return market.pair[0] === parent.currency && market.pair[1] === parent.asset });

  	if(Number.isInteger(market.precision))
    	precision = Math.pow(10, market.precision);
 
  	amount *= precision;
  	amount = Math.floor(amount);
  	amount /= precision;
  	return amount;
};


trader.prototype.addOrder = function(tradeType, amount, price, callback) {

  	let args = lodash.toArray(arguments);

  	amount = this.roundAmount(amount);
  	log.debug(tradeType.toUpperCase(), amount, this.asset, '@', price, this.currency);

  	let set = function(err, data) {

    	if (data && data.error) 
    		return this.retry(this.addOrder, 'unable to place order', args, data.error);
    	
    	if (err) 
    		return this.retry(this.addOrder, 'unable to place order', args, err);
    
    	let txid = data.id;
    	log.debug('added order with txid:', txid);

    	callback(undefined, txid);
  	};

  	this.quadriga.api(tradeType, {book: this.pair,price: price,amount: amount}, lodash.bind(set, this));
};


trader.prototype.getOrder = function(order, callback) {
  	let args = lodash.toArray(arguments);

  	let get = function(err, data) {
    	if (data && data.error) 
    		return this.retry(this.getOrder, 'unable to get order', args, data.error);
    	if (err) 
    		return this.retry(this.getOrder, 'unable to get order', args, err);

    	let price = parseFloat( data[0].price );
    	let amount = parseFloat( data[0].amount );
    	let date = (data[0].updated) ? moment.unix( data[0].updated ) : false;

    	callback(undefined, {price, amount, date});
  	}.bind(this);

  	this.quadriga.api('lookuplodashorder', {id: order}, get);
}


trader.prototype.buy = function(amount, price, callback) {
  	this.addOrder('buy', amount, price, callback);
};


trader.prototype.sell = function(amount, price, callback) {
  	this.addOrder('sell', amount, price, callback);
};

trader.prototype.checkOrder = function(order, callback) {
  	let args = lodash.toArray(arguments);
  
  	let check = function(err, data) {

    	if (data && data.error) 
    		return this.retry(this.checkOrder, 'unable to get order', args, data.error);
    	if (err) 
    		return this.retry(this.checkOrder, 'unable to get order', args, err);

    	let result = data[0];
    	let stillThere = result.status === 0 || result.status === 1;
    	callback(err, !stillThere);
  	};

  	this.quadriga.api('lookuplodashorder', {id: order}, lodash.bind(check, this));
};

trader.prototype.cancelOrder = function(order, callback) {
  	let args = lodash.toArray(arguments);
  	let cancel = function(err, data) {

    	if (data && data.error) 
    		return this.retry(this.cancelOrder, 'unable to cancel order', args, data.error);
    
    	if (err) 
    		return this.retry(this.cancelOrder, 'unable to cancel order', args, err);

    	callback();
  	};

  	this.quadriga.api('cancellodashorder', {id: order}, lodash.bind(cancel, this));
};


trader.getCapabilities = function () {
  	return {
		name: 'Quadriga',
    	slug: 'quadriga',
    	currencies: marketData.currencies,
    	assets: marketData.assets,
    	markets: marketData.markets,
    	requires: ['key', 'secret', 'username'],
    	providesHistory: false,
    	tid: 'tid',
    	tradable: true
  	};
}

module.exports = trader;