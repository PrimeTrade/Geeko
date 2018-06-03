let moment = require('moment');
let util = require('../../core/util.js');
let lodash = require('lodash');
let log = require('../../core/log');

let config = util.getConfig();
let dirs = util.dirs();

let Fetcher = require(dirs.exchanges + 'bitx');

util.makeEventEmitter(Fetcher);

let end = false;
let from = false;
let next = false;
let REQUESTlodashINTERVAL = 15 * 1000;

Fetcher.prototype.getTrades = function(since, callback, descending) {
	let retryCritical = {
        retries: 10,
        factor: 1.25,
        minTimeout: REQUESTlodashINTERVAL,
        maxTimeout: REQUESTlodashINTERVAL * 10
    };

    let handleResponse = (callback) => {
        return (error, body) => {
            if (body && !lodash.isEmpty(body.code)) {
                error = new Error(`ERROR ${body.code}: ${body.msg}`);
            }
            if(error) log.error('ERROR:', error.message, 'Retrying...');
            return callback(error, body);
        }
    }

    let process = (err, result) => {
        if (err) {
            log.error('Error importing trades:', err);
            return;
        }
        trades = lodash.map(result.trades, function(t) {
            return {
                price: t.price,
                date: Math.round(t.timestamp / 1000),
                amount: t.volume,
                tid: t.timestamp
            };
        });
        callback(null, trades.reverse());
    }

    if(moment.isMoment(since)) 
    	since = since.valueOf();
    
    (lodash.isNumber(since) && since > 0) ? since : since = null;

    let handler = (cb) => this.bitx.getTrades({ since: since, pair: this.pair }, handleResponse(cb));
    
    util.retryCustom(retryCritical, lodash.bind(handler, this), lodash.bind(process, this));
}

let fetcher = new Fetcher(config.watch);

let fetch = () => {
    fetcher.import = true;
    setTimeout( () => fetcher.getTrades(from, handleFetch), REQUESTlodashINTERVAL);
};

let handleFetch = (err, trades) => {
    if (err) {
        log.error(`There was an error importing from BitX ${err}`);
        fetcher.emit('done');
        return fetcher.emit('trades', []);
    }

    if (trades.length > 0) {
        from = moment.utc(lodash.last(trades).tid + 1).clone();
    } else {
        fetcher.emit('done');
    }

    if (from >= end) {
        fetcher.emit('done');
        let endUnix = end.unix();
        trades = lodash.filter(trades, t => t.date <= endUnix);
    }

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