let Lakebtc = require("lakebtclodashnodejs");
let lodash = require('lodash');
let moment = require('moment');

let util = require('../core/util.js');
let log = require('../core/log');


let trader = function(config) {
  	lodash.bindAll(this);
  	if(lodash.isObject(config)) {
    	this.key = config.key;
    	this.secret = config.secret;
    	this.clientID = config.username;
  	}
  	this.name = 'LakeBTC';
  	this.balance;
  	this.price;

  	this.lakebtc = new Lakebtc(this.key, this.secret);
}


trader.prototype.retry = function(method, args) {
  	let wait = wait + moment.duration(10, 'seconds');
  	log.debug(this.name, 'returned an error, retrying..');
	
  	let self = this;


  	lodash.each(args, function(arg, i) {
    	if(lodash.isFunction(arg))
      		args[i] = lodash.bind(arg, self);
  	});

  
  	setTimeout(function() { method.apply(self, args) },wait);
  	
}

trader.prototype.getPortfolio = function(callback) {

  	let set = function(err, data) {
    	let portfolio = [];
    	lodash.map(data.balance, function(amount, asset) {
	  		portfolio.push({name: asset, amount: parseFloat(amount)});
    	});
    	callback(err, portfolio);
  	}
  	this.lakebtc.getAccountInfo(lodash.bind(set, this));
}


trader.prototype.getTicker = function(callback) {
  	this.lakebtc.ticker(callback);
}


trader.prototype.getFee = function(callback) {
  	callback(false, 0.002);
}


trader.prototype.buy = function(amount, price, callback) {
  	let set = function(err, result) {
  	
    	if(err || result.error)
      		return log.error('unable to buy:', err, result);

    	callback(null, result.id);
  	};

  	amount *= 0.998; // subtract the fees
  	amount *= 10000;
  	amount = Math.floor(amount);
  	amount /= 10000;
  	this.lakebtc.buyOrder(lodash.bind(set, this), [price, amount, 'USD']);
}

trader.prototype.sell = function(amount, price, callback) {
  	let set = function(err, result) {
    	if(err || result.error)
      		return log.error('unable to sell:', err, result);

    	callback(null, result.id);
  	};

  	this.lakebtc.sell(lodash.bind(set, this), [price, amount, 'USD']);
}

trader.prototype.checkOrder = function(order, callback) {
  	let check = function(err, result) {
    	let stillThere = lodash.find(result, function(o) { return o.id === order });
    	callback(err, !stillThere);
  };

  this.lakebtc.getOrders(lodash.bind(check, this));
}

trader.prototype.cancelOrder = function(order, callback) {
  let cancel = function(err, result) {
    if(err || !result.result)
      log.error('unable to cancel order', order, '(', err, result, ')');
  	};

  	this.lakebtc.cancelOrder(lodash.bind(cancel, this), [order]);
}

trader.prototype.getTrades = function(since, callback, descending) {
  	let args = lodash.toArray(arguments);
  	let process = function(err, result) {
    	if(err)
      		return this.retry(this.getTrades, args);
    	callback(null, descending ? result.reverse() : result);
  	};
  	since = since ? since.unix() : moment().subtract(5, 'minutes').unix();
  	this.lakebtc.bctrades( lodash.bind(process, this), since);
}

trader.getCapabilities = function () {
  	return {
    	name: 'LakeBTC',
    	slug: 'lakebtc',
    	currencies: ['USD'],
    	assets: ['BTC'],
   	 	markets: [{pair: ['USD', 'BTC'], minimalOrder: { amount: 1, unit: 'currency' }}],
    	requires: ['key', 'secret'],
    	providesHistory: false,
    	fetchTimespan: 60,
    	tid: 'tid'
  	};
}


module.exports = trader;