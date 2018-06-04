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
