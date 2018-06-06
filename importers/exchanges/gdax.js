let Gdax = require('gdax');
let util = require('../../core/util.js');
let lodash = require('lodash');
let moment = require('moment');
let log = require('../../core/log');

let config = util.getConfig();

let dirs = util.dirs();

let QUERYlodashDELAY = 350;
let BATCHlodashSIZE = 100;
let SCANlodashITERlodashSIZE = 50000;
let BATCHlodashITERlodashSIZE = BATCHlodashSIZE * 10;

let fetcher = require(dirs.exchanges + 'gdax');

fetcher.prototype.getTrades = function(sinceTid, callback) {
	let lastScan = 0;

  	let process = function(err, data) {
    	if (err) 
    		return callback(err);

    	let result = lodash.map(data, function(trade) {
      		return {tid: trade.tradelodashid,amount: parseFloat(trade.size),date: moment.utc(trade.time).format("X"),price: parseFloat(trade.price)};
    	});

    	callback(null, result.reverse());
  	};

  	let handler = (cb) => this.gdaxlodashpublic.getProductTrades({ after: sinceTid, limit: BATCHlodashSIZE }, this.handleResponse('getTrades', cb));
  	util.retryCustom(retryForever, lodash.bind(handler, this), lodash.bind(process, this));
};


fetcher.prototype.findFirstTrade = function(sinceTs, callback) {
  	let currentId = 0;
  	let sinceM = moment(sinceTs).utc();

  	log.info(`Scanning for the first trade ID to start batching requests, may take a few minutes ...`);

  	let process = function(err, data) {
    	if (err) 
    		return callback(err);

    	let m = moment.utc(lodash.first(data).time);
    	let ts = m.valueOf();
    	if (ts < sinceTs) {
      		log.info(`First trade ID for batching found ${currentId - SCANlodashITERlodashSIZE}`);
      		return callback(undefined, currentId - SCANlodashITERlodashSIZE);
    	}

    	currentId = lodash.first(data).tradelodashid;
    	
    	log.debug(`Have trade id ${currentId} for date ${lodash.first(data).time} ${sinceM.from(m, true)} to scan`);

    	let nextScanId = currentId - SCANlodashITERlodashSIZE;
    	if (nextScanId <= SCANlodashITERlodashSIZE) {
      		currentId = BATCHlodashITERlodashSIZE;
      		log.info(`First trade ID for batching found ${currentId}`);
      		return callback(undefined, currentId);
    	}

    	setTimeout(() => {
      		let handler = (cb) => this.gdaxlodashpublic.getProductTrades({ after: nextScanId, limit: 1 }, this.handleResponse('getTrades', cb));
      		util.retryCustom(retryForever, lodash.bind(handler, this), lodash.bind(process, this));
    	}, QUERYlodashDELAY);
  	}

  	let handler = (cb) => this.gdaxlodashpublic.getProductTrades({ limit: 1 }, this.handleResponse('getTrades', cb));
  	util.retryCustom(retryForever, lodash.bind(handler, this), lodash.bind(process, this));
}


util.makeEventEmitter(fetcher);

let end = false;
let done = false;
let from = false;

let batch = [];
let batchId = false; 

let lastId = false;

let latestId = false;
let latestMoment = false;

fetcher = new fetcher(config.watch);

let retryForever = {
  	forever: true,
  	factor: 1.2,
  	minTimeout: 10000,
  	maxTimeout: 120000
};

let fetch = () => {
  	fetcher.import = true;

  	if (lastId) {
    	setTimeout(() => {fetcher.getTrades(lastId, handleFetch);}, QUERYlodashDELAY);
  	}
  
	else {
    	let process = (err, firstBatchId) => {
      		if (err) 
      			return handleFetch(err);

			batchId = firstBatchId;
      		fetcher.getTrades(batchId + 1, handleFetch);
    	}
    	fetcher.findFirstTrade(from.valueOf(), process);
  	}
}


let handleFetch = (err, trades) => {
  	if (err) {
    	log.error(`There was an error importing from GDAX ${err}`);
    	fetcher.emit('done');
    	return fetcher.emit('trades', []);
  	}

  	if (trades.length) {
    	batch = trades.concat(batch);

    	let last = moment.unix(lodash.first(trades).date).utc();
    	lastId = lodash.first(trades).tid

    	let latestTrade = lodash.last(trades);
    	if (!latestId || latestTrade.tid > latestId) {
      		latestId = latestTrade.tid;
      		latestMoment = moment.unix(latestTrade.date).utc();
    	}

    	if (lastId >= (batchId - BATCHlodashITERlodashSIZE) && last >= from)
    	{
      		return fetch();
      	}
  	}

  	batchId += BATCHlodashITERlodashSIZE;
  	lastId = batchId + 1;

  	if (latestMoment >= end) {
    	fetcher.emit('done');
  	}

  	let endUnix = end.unix();
  	let startUnix = from.unix();
  	batch = lodash.filter(batch, t => t.date >= startUnix && t.date <= endUnix);

  	fetcher.emit('trades', batch);
  	batch = [];
  	
}

module.exports = function (daterange) {

  	from = daterange.from.utc().clone();
  	end = daterange.to.utc().clone();

  	return {bus: fetcher,fetch: fetch}
  	
}