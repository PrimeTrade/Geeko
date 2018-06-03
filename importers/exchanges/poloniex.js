let Poloniex = require("poloniex.js");
let util = require('../../core/util.js');
let lodash = require('lodash');
let moment = require('moment');
let log = require('../../core/log');

let config = util.getConfig();

let dirs = util.dirs();

let Fetcher = require(dirs.exchanges + 'poloniex');

let batchSize = 120;
let overlapSize = 10;


function joinCurrencies(currencyA, currencyB){
	return currencyA + 'lodash' + currencyB;
}


Fetcher.prototype.getTrades = function(range, callback) {
  	let args = lodash.toArray(arguments);
  	let process = function(err, result) {
    if(err || result.error)
      	return this.retry(this.getTrades, args);

    if(lodash.size(result) === 50000) {
      	util.die('too many trades');
    }

    result = lodash.map(result, function(trade) {
      	return {tid: trade.tradeID,amount: +trade.amount,date: moment.utc(trade.date).format('X'),price: +trade.rate};
    });

    callback(result.reverse());
    
  	}.bind(this);

	let params = {currencyPair: joinCurrencies(this.currency, this.asset)}

  	params.start = range.from.unix();
  	params.end = range.to.unix();

  	this.poloniex.lodashpublic('returnTradeHistory', params, process);
}

util.makeEventEmitter(Fetcher);

let iterator = false;
let end = false;
let done = false;
