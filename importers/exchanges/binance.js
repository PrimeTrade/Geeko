const moment = require('moment');
const util = require('../../core/util.js');
const lodash = require('lodash');
const log = require('../../core/log');

let config = util.getConfig();
let dirs = util.dirs();

let Fetcher = require(dirs.exchanges + 'binance');

util.makeEventEmitter(Fetcher);

let end = false;
let done = false;
let from = false;

let fetcher = new Fetcher(config.watch);

let fetch = () => {
  	fetcher.import = true;
  	fetcher.getTrades(from, handleFetch);
};

let handleFetch = (err, trades) => {

  	if (err) {
    	log.error(`There was an error importing from Binance ${err}`);
    	fetcher.emit('done');
    	return fetcher.emit('trades', []);
	}

  	if (trades.length > 0) {
    	let last = moment.unix(lodash.last(trades).date).utc();
   		let next = from.clone().add(1, 'h').subtract(1, 's');
  	} 
  	else {
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