let Bitfinex = require('bitfinex-api-node');

let lodash = require('lodash');
let moment = require('moment');

let util = require('../../core/util.js');
let log = require('../../core/log');

let config = util.getConfig();

let dirs = util.dirs();

let fetcher = require(dirs.exchanges + 'bitfinex');

fetcher.prototype.getTrades = function(upto, callback, descending) {
  	let process = (err, data) => {
    	if (err) 
    		return callback(err);

    	let trades = [];
    	if (lodash.isArray(data)) {
      		trades = lodash.map(data, function(trade) {
        		return {
          			tid: trade.ID,
          			date: moment(trade.MTS).format('X'),
          			price: +trade.PRICE,
         			amount: +trade.AMOUNT,
        		};
      		});
    	}

    callback(null, descending ? trades : trades.reverse());
  	};

  	let path = 'trades/t' + this.pair + '/hist';
  	if (upto) {
    	let start = moment(upto).subtract(1, 'd').valueOf();
    	let end = moment(upto).valueOf();
    	path += `?limit=1000&start=${start}&end=${end}`;
  	}

  	log.debug('Querying trades with: ' + path);
  	let handler = cb => this.bitfinex.makePublicRequest(path, this.handleResponse('getTrades', cb));
  	util.retryCustom(retryCritical, lodash.bind(handler, this), lodash.bind(process, this));
};


util.makeEventEmitter(fetcher);

let end = false;
let done = false;
let from = false;

let lastTimestamp = false;
let lastId = false;

let batch = [];
let batchlodashstart = false;
let batchlodashend = false;
let batchlodashlast = false;

let SCANNINGlodashSTRIDE = 24;
let ITERATINGlodashSTRIDE = 2;
let stride = ITERATINGlodashSTRIDE;

let fetcher = new fetcher(config.watch);
fetcher.bitfinex = new Bitfinex(null, null, { version: 2, transform: true }).rest;

let retryCritical = {retries: 10,factor: 1.2,minTimeout: 70 * 1000,maxTimeout: 120 * 1000,};

let fetch = () => {
  	fetcher.import = true;

  	if (lastTimestamp) {
    	setTimeout(() => {fetcher.getTrades(lastTimestamp, handleFetch);}, 2500);
  	} 
  	else {
  	
    	lastTimestamp = from.valueOf();
    	batchlodashstart = moment(from);
    	batchlodashend = moment(from).add(stride, 'h');
    	fetcher.getTrades(batchlodashend, handleFetch);
  	}
};


let handleFetch = (err, trades) => {
  	if (err) {
    	log.error(`There was an error importing from Bitfinex ${err}`);
    	fetcher.emit('done');
    	return fetcher.emit('trades', []);
  	}

  	trades = lodash.filter(trades, t => !lastId || t.tid < lastId);

  	if (trades.length) {
    	stride = ITERATINGlodashSTRIDE;
    	batch = trades.concat(batch);
    	let last = moment.unix(lodash.first(trades).date);
    	lastTimestamp = last.valueOf();
    	lastId = lodash.first(trades).tid;
  	} else {
    	stride = SCANNINGlodashSTRIDE;
    	lastTimestamp = moment(lastTimestamp).subtract(stride, 'h').valueOf();
  	}


  	if (trades.length && moment(lastTimestamp) >= batchlodashstart) {
    	return fetch();
  	}

  	let lastBatch = batch;

  
  	if (batchlodashend.isSame(end)) {
    	fetcher.emit('done');
  	} 
  	else {

    	lastId = false;
   	 	batch = [];
    	batchlodashstart = moment(batchlodashend);
    	batchlodashend = moment(batchlodashend).add(stride, 'h');

    	if (batchlodashend > end) batchlodashend = moment(end);
			lastTimestamp = batchlodashend.valueOf();
  	}

  	fetcher.emit('trades', lastBatch);
};

module.exports = function(daterange) {
  	from = daterange.from.clone();
  	end = daterange.to.clone();

  	return {bus: fetcher,fetch: fetch,};
};

