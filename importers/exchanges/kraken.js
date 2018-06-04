let KrakenClient = require('kraken-api-es5')
let lodash = require('lodash');
let moment = require('moment');

let util = require('../../core/util.js');
let log = require('../../core/log');
let Errors = require('../../core/error.js')

let config = util.getConfig();

let dirs = util.dirs();

let Fetcher = require(dirs.exchanges + 'kraken');

util.makeEventEmitter(Fetcher);

let end = false;
let done = false;
let from = false;

let lastId = false;
let prevLastId = false;

let fetcher = new Fetcher(config.watch);

let fetch = () => {
    fetcher.import = true;

    if (lastId) {
        let tidAsTimestamp = lastId / 1000000;
        setTimeout(() => {
            fetcher.getTrades(tidAsTimestamp, handleFetch)
        }, 500);
    }
    else
        fetcher.getTrades(from, handleFetch);
}

let handleFetch = (err, trades) => {
    if (err) {
        log.error(`There was an error importing from Kraken ${err}`);
        fetcher.emit('done');
        return fetcher.emit('trades', []);
    }

    let last = moment.unix(lodash.last(trades).date);
    lastId = lodash.last(trades).tid

    if(last < from) {
        log.debug('Skipping data, they are before from date', last.format());
        return fetch();
    }

    if  (last > end || lastId === prevLastId) {
        fetcher.emit('done');

        let endUnix = end.unix();
        trades = lodash.filter(
            trades,
            t => t.date <= endUnix
        )
    }

    prevLastId = lastId
    fetcher.emit('trades', trades);
}

module.exports = function (daterange) {

    from = daterange.from.clone();
    end = daterange.to.clone();

    return {
        bus: fetcher,
        fetch: fetch
    }
}