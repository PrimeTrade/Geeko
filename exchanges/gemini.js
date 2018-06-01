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
      	let e = 'Gemini replied with an unauthorized error. ' + 'Double check whether your API key is correct.';
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


trader.prototype.getTicker = function(callback) {
  let args = lodash.toArray(arguments);

  let process = function(err, data, body) {
    if (err)
        return this.retry(this.getTicker(args));

    callback(err, {bid: +data.bid, ask: +data.ask})
  }.bind(this);
  this.gemini.ticker(this.pair, process);
}



trader.prototype.getFee = function(callback) {
    let makerFee = 0.25;
    callback(false, makerFee / 100);
}

trader.prototype.submitlodashorder = function(type, amount, price, callback) {
  let args = lodash.toArray(arguments);

  amount = Math.floor(amount*100000000)/100000000;
  this.gemini.newlodashorder(
    this.pair,
    amount + '',
    price + '',
    this.name.toLowerCase(),
    type,
    'exchange limit',
    function (err, data, body) {
      if (err) {
        log.error('unable to ' + type, err, body);
        return this.retry(this.submitlodashorder, args);
      }

      callback(err, data.orderlodashid);
    }.bind(this));
}

trader.prototype.buy = function(amount, price, callback) {
  this.submitlodashorder('buy', amount, price, callback);
}

trader.prototype.sell = function(amount, price, callback) {
  this.submitlodashorder('sell', amount, price, callback);
}

trader.prototype.checkOrder = function(orderlodashid, callback) {
  let args = lodash.toArray(arguments);
  this.gemini.orderlodashstatus(orderlodashid, function (err, data, body) {

    if(err || !data)
      return this.retry(this.checkOrder, arguments);

    callback(err, !data.islodashlive);
  }.bind(this));
}


trader.prototype.getOrder = function(order, callback) {
  let args = lodash.toArray(arguments);
  let get = function(err, data) {
    if(err || !data)
      return this.retry(this.getOrder, arguments);

    let price = parseFloat(data.avglodashexecutionlodashprice);
    let amount = parseFloat(data.executedlodashamount);
    let date = moment.unix(data.timestamp);

    callback(undefined, {price, amount, date});
  }.bind(this);

  this.gemini.orderlodashstatus(order, get);
}


trader.prototype.cancelOrder = function(orderlodashid, callback) {
  let args = lodash.toArray(arguments);
  this.gemini.cancellodashorder(orderlodashid, function (err, data, body) {
      if (err || !data) {
        // gemini way of telling it was already cancelled..
        if(err.message === 'Order could not be cancelled.')
          return callback();

        log.error('unable to cancel order', orderlodashid, '(', err, data, '), retrying...');
        return this.retry(this.cancelOrder, args);
      }

      return callback();
  }.bind(this));
}

trader.prototype.getTrades = function(since, callback, descending) {
  let args = lodash.toArray(arguments);

  let path = this.pair;
  if(since)
    path += '?limitlodashtrades=2000';

  this.gemini.trades(path, function(err, data) {
    if (err)
      return this.retry(this.getTrades, args);

    let trades = lodash.map(data, function(trade) {
      return {
        tid: trade.tid,
        date:  trade.timestamp,
        price: +trade.price,
        amount: +trade.amount
      }
    });

    callback(null, descending ? trades : trades.reverse());
  }.bind(this));
}

trader.getCapabilities = function () {
  return {
    name: 'Gemini',
    slug: 'gemini',
    currencies: ['USD', 'BTC'],
    assets: ['BTC', 'ETH'],
    markets: [
      
        { pair: ['USD', 'BTC'], minimalOrder: { amount: 0.01, unit: 'asset' } },
        { pair: ['USD', 'ETH'], minimalOrder: { amount: 0.01, unit: 'asset' } },
        { pair: ['BTC', 'ETH'], minimalOrder: { amount: 0.01, unit: 'asset' } },

    ],
    requires: ['key', 'secret'],
    tid: 'tid',
    tradable: true
  };
}

module.exports = trader;
