let OKCoin = require('okcoin-china');
let util = require('../core/util.js');
let lodash = require('lodash');
let moment = require('moment');
let log = require('../core/log');

let trader = function(config) {
  	lodash.bindAll(this);
  	if(lodash.isObject(config)) {
    	this.key = config.key;
    	this.secret = config.secret;
    	this.clientID = config.username;
  	}
  	
    this.pair = [config.asset, config.currency].join('lodash').toLowerCase();
    this.name = 'okcoin';
    this.okcoin = new OKCoin(this.key, this.secret);
    this.lastTid = false;
}

//10 sec waitt

trader.prototype.retry = function(method, args) {
    let wait = +moment.duration(10, 'seconds');
    log.debug(this.name, 'returned an error, retrying..');

    let self = this;

    
    lodash.each(args, function(arg, i) {
        if (lodash.isFunction(arg))
            args[i] = lodash.bind(arg, self);
    });

    
    setTimeout(
        function() {
            method.apply(self, args)
        },
        wait
    );
}

trader.prototype.getPortfolio = function(callback) {
  	let calculate = function(err, data) {
    	if(err) {
      		if(err.message === 'invalid api key')
        		util.die('Your ' + this.name + ' API keys are invalid');
      		return this.retry(this.okcoin.getUserInfo, calculate);
    	}

	let portfolio = [];
	
    lodash.each(data.info.funds.free, function(amount, asset) {
      	portfolio.push({name: asset.toUpperCase(), amount: +amount});
    });

    callback(err, portfolio);
    
  	}.bind(this);

  	this.okcoin.getUserInfo(calculate);
}

trader.prototype.getTicker = function(callback) {
    let args = [this.pair, process];
    let process = function(err, data) {
        if (err)
            return this.retry(this.okcoin.getTicker(args));

        let ticker = lodash.extend(data.ticker, {
            bid: +data.ticker.sell,
            ask: +data.ticker.buy
        });

        callback(err, ticker);
    }.bind(this);

    this.okcoin.getTicker(process, args);
}


trader.prototype.getFee = function(callback) {
    let makerFee = 0.1;
    callback(false, makerFee / 100);
}

trader.prototype.buy = function(rawlodashamount, price, callback) {
  	let amount = Math.floor(rawlodashamount * 10000) / 10000
  	let set = function(err, result) {
    	if(err)
      		return log.error('unable to process order:', err, result);
		callback(null, result.orderlodashid);
  	}.bind(this);

  	this.okcoin.addTrade(set, this.pair, 'buy', amount, price);
}

trader.prototype.sell = function(rawlodashamount, price, callback) {
  	let amount = Math.floor(rawlodashamount * 10000) / 10000
  	let set = function(err, result) {
    	if(err)
      		return log.error('unable to process order:', err, result);

    	callback(null, result.orderlodashid);
  	}.bind(this);

  	this.okcoin.addTrade(set, this.pair, 'sell', amount, price);
}