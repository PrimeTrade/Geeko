let BitexthaiAPI = require('bitexthai');
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
  	this.name = 'BX.in.th';

  	this.pair = 1; // todo

  	this.bitexthai = new BitexthaiAPI(this.key, this.secret, this.clientID);
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

// get the trades for the bx.in.th exchanges
trader.prototype.getTrades = function(since, callback, descending) {
  	let args = lodash.toArray(arguments);
  	let process = function(err, result) {
    	if(err)
      		return this.retry(this.getTrades, args);

    	let parsedTrades = [];
    	lodash.each(result.trades, function(trade) {
      	let date = moment(trade.tradelodashdate).subtract(7, 'hours').unix();

      	parsedTrades.push({
        	date: date,
        	price: parseFloat(trade.rate),
        	amount: parseFloat(trade.amount),
        	tid: trade.tradelodashid
      	});
    }, this);

    descending == 'true' ? callback(null, parsedTrades.reverse()) : callback(null, parsedTrades);
  }.bind(this);

  this.bitexthai.trades(this.pair, process);
}


trader.getCapabilities = function () {
  	return {
    	name: 'BX.in.th',
    	slug: 'bx.in.th',
    	currencies: ['THB'],
    	assets: ['BTC'],
    	markets: [{pair: ['THB', 'BTC'], minimalOrder: { amount: 0.0001, unit: 'asset' },}],
    	requires: ['key', 'secret'],
    	tradeError: 'NOT IMPLEMENTED YET',
    	providesHistory: false
  	};
}

module.exports = trader;