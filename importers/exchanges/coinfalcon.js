const moment = require('moment');
const util = require('../../core/util.js');
const lodash = require('lodash');
const log = require('../../core/log');

let config = util.getConfig();
let dirs = util.dirs();

let Fetcher = require(dirs.exchanges + 'coinfalcon');

util.makeEventEmitter(Fetcher);

let end = false;
let done = false;
let from = false;

let fetcher = new Fetcher(config.watch);

let fetch = () => {
  	fetcher.import = true;
  	log.debug('[CoinFalcon] Getting trades from: ', from);
  	fetcher.getTrades(from, handleFetch, true);
};

let handleFetch = (unk, trades) => {
  	if (trades.length > 0) {
    	let last = moment.unix(lodash.last(trades).date).utc();
    	let next = last.clone();
  	} 
  	else {
    	let next = from.clone().add(1, 'h');
    	log.debug('Import step returned no results, moving to the next 1h period');
  	}

  	if (from.add(1, 'h') >= end) {
    	fetcher.emit('done');
		let endUnix = end.unix();
    	trades = lodash.filter(trades, t => t.date <= endUnix);
  	}

  	from = next.clone();
  	fetcher.emit('trades', trades);
};

module.exports = function(daterange) {
  	from = daterange.from.clone().utc();
  	end = daterange.to.clone().utc();

  	return {
    	bus: fetcher,
    	fetch: fetch,
  	};
};