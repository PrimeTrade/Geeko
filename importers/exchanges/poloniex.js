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


let fetcher = new Fetcher(config.watch);

let fetch = () => {
  	log.info(config.watch.currency,config.watch.asset,'Requesting data from',iterator.from.format('YYYY-MM-DD HH:mm:ss') + ',','to',iterator.to.format('YYYY-MM-DD HH:mm:ss'));

  	if(util.gekkoEnv === 'child-process') {
    	let msg = ['Requesting data from',iterator.from.format('YYYY-MM-DD HH:mm:ss') + ',','to',iterator.to.format('YYYY-MM-DD HH:mm:ss')].join('');
    	process.send({type: 'log', log: msg});
  	}
  	fetcher.getTrades(iterator, handleFetch);
}

let handleFetch = trades => {
  	iterator.from.add(batchSize, 'minutes').subtract(overlapSize, 'minutes');
  	iterator.to.add(batchSize, 'minutes').subtract(overlapSize, 'minutes');

  	if(!lodash.size(trades)) {
    
    	if(iterator.to.clone().add(batchSize * 4, 'minutes') > end) {
      		fetcher.emit('done');
    	}

    	return fetcher.emit('trades', []);
  	}

  	let last = moment.unix(lodash.last(trades).date);

  	if(last > end) {
    	fetcher.emit('done');

    	let endUnix = end.unix();
    	trades = lodash.filter(trades,t => t.date <= endUnix);
  	}

  	fetcher.emit('trades', trades);
}


module.exports = function (daterange) {
	iterator = {
    	from: daterange.from.clone(),
    	to: daterange.from.clone().add(batchSize, 'minutes')
  	}
  
  
	end = daterange.to.clone();

  	return {bus: fetcher,fetch: fetch}
}
