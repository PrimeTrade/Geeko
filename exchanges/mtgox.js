let MtGoxClient = require("mtgox-apiv2");
let lodash = require('lodash');
let moment = require('moment');

let util = require('../core/util.js');
let log = require('../core/log');


let trader = function(config) {
  	if(lodash.isObject(config)) {
    	this.key = config.key;
    	this.secret = config.secret;
    	this.currency = config.currency || 'USD';

    	this.pair = 'BTC' + this.currency;
  	}
  	this.name = 'Mt. Gox';

  	lodash.bindAll(this);

  	this.mtgox = new MtGoxClient(this.key, this.secret, this.pair);
}


trader.prototype.buy = function(amount, price, callback) {

  	let process = function(err, result) {
    	this.checkUnauthorized(err);
    	if(err || result.result === 'error')
      		log.error('unable to buy (', err, result, ')');

    	callback(null, result.data);
  	};
  	this.mtgox.add('bid', amount, price, lodash.bind(process, this));
}


//check for authorised user to sell
trader.prototype.sell = function(amount, price, callback) {
  	let process = function(err, result) {
    	this.checkUnauthorized(err);
    
    	if(err || result.result === 'error')
      		log.error('unable to sell (', err, result, ')');

    	callback(null, result.data);
  	};
  	this.mtgox.add('ask', amount, price, lodash.bind(process, this));
}


trader.prototype.getTrades = function(since, callback, descending) {
  	if(since && !lodash.isNumber(since))
    	since = util.toMicro(since);

  	let args = lodash.toArray(arguments);
  	this.mtgox.fetchTrades(since, lodash.bind(function(err, trades) {
    	if (err || !trades)
      		return this.retry(this.getTrades, args);

    	trades = trades.data;
    	if (trades.length === 0)
      		return this.retry(this.getTrades, args);

		descending == true ? callback(false, trades.reverse()) : callback(false, trades) ; 
  	}, this));

}



trader.prototype.retry = function(method, args) {
  	let wait = wait + moment.duration(10, 'seconds');
  	log.debug(this.name, 'returned an error, retrying..');

  	let self = this;

  	lodash.each(args, function(arg, i) {
    	if(lodash.isFunction(arg))
      		args[i] = lodash.bind(arg, self);
  	});


  	setTimeout(function() { method.apply(self, args) }, wait);
}


trader.prototype.checkUnauthorized = function(err) {
  	if(err && err.message === 'Request failed with 403')
    	util.die('It appears your ' + this.name + ' API key and secret are incorrect');
}


trader.prototype.getPortfolio = function(callback) {
  	let args = lodash.toArray(arguments);
  	let calculate = function(err, result) {
    	this.checkUnauthorized(err);
    	if(err)
      		return this.retry(this.getPortfolio, args);

    	if(!('Wallets' in result.data))
      		log.error('unable to get portfolio, do I have getlodashinfo rights?');

    	let assets = [];
    	lodash.each(result.data.Wallets, function(wallet, name) {
      		let amount = parseFloat(wallet.Balance.value);
      		assets.push({name: name, amount: amount});
    	});
    	callback(null, assets);
  	};

  	this.mtgox.info(lodash.bind(calculate, this));
}

trader.prototype.getFee = function(callback) {
  	let args = lodash.toArray(arguments);
  	let calculate = function(err, result) {
    	this.checkUnauthorized(err);
    	if(err)
    		return this.retry(this.getFee, args);

    	let fee = result.data.TradelodashFee / 100;
    	callback(null, fee);
  	};

  	this.mtgox.info(lodash.bind(calculate, this));
}


trader.prototype.checkOrder = function(order, callback) {
  	let args = lodash.toArray(arguments);
  	let check = function(err, result) {
    	if(err)
      		return this.retry(this.checkOrder, args);

    	let stillThere = lodash.find(result.data, function(o) { return o.oid === order });
    	callback(null, !stillThere);
  	};

  	this.mtgox.orders(lodash.bind(check, this));
}

trader.prototype.cancelOrder = function(order) {
  	let cancel = function(err, result) {
    	if(err || result.result !== 'succes')
      		log.error('unable to cancel order', order, '(', err, result, ')');
  	};

  	this.mtgox.cancel(order, lodash.bind(cancel, this));
}


trader.prototype.getTicker = function(callback) {
  	let args = lodash.toArray(arguments);
  	let set = function(err, result) {
    	if(err)
      		return this.retry(this.getTicker, args);

    	let ticker = {
      		bid: result.data.buy.value,
      		ask: result.data.sell.value
    	}
    	callback(err, ticker);
  	};

  	this.mtgox.ticker(lodash.bind(set, this));
}


trader.getCapabilities = function () {
  	return {};
}

module.exports = trader;