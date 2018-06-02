const Kraken = require('kraken-api-es5');
const moment = require('moment');
const _ = require('lodash');
const util = require('../core/util');
const Errors = require('../core/error');
const log = require('../core/log');
const marketData = require('./kraken-markets.json');

let trader = (config)=> {
    _.bindAll(this);

    if(_.isObject(config)) {
        this.key = config.key;
        this.secret = config.secret;
        this.currency = config.currency.toUpperCase()
        this.asset = config.asset.toUpperCase();
    }
    this.name = 'kraken';
    this.since = null;

    this.market = _.find(trader.getCapabilities().markets, (market) => {
        return market.pair[0] === this.currency && market.pair[1] === this.asset
    });
    this.pair = this.market.book;
    this.kraken = new Kraken(
        this.key,
        this.secret,
        {timeout: +moment.duration(60, 'seconds')}
    );
};

let retryCritical = {
    retries: 10,
    factor: 1.2,
    minTimeout: 1000,
    maxTimeout: 30 * 1000
};

let retryForever = {
    forever: true,
    factor: 1.2,
    minTimeout: 10 * 1000,
    maxTimeout: 30 * 1000
};

let recoverableErrors = new RegExp(/(SOCKETTIMEDOUT|TIMEDOUT|CONNRESET|CONNREFUSED|NOTFOUND|API:Rate limit exceeded|API:Invalid nonce|Service:Unavailable|Request timed out|Response code 5)/)
trader.prototype.processError = (funcName, error)=> {
    if (!error)
        return undefined;
    if (!error.message.match(recoverableErrors)) {
        log.error(`[kraken.js] (${funcName}) returned an irrecoverable error: ${error.message}`);
        return new Errors.AbortError('[kraken.js] ' + error.message);
    }
    log.debug(`[kraken.js] (${funcName}) returned an error, retrying: ${error.message}`);
    return new Errors.RetryError('[kraken.js] ' + error.message);
};

trader.prototype.handleResponse = (funcName, callback)=> {
    return (error, body) => {
        if(!error) {
            if(_.isEmpty(body) || !body.result)
                error = new Error('NO DATA WAS RETURNED');

            else if(!_.isEmpty(body.error))
                error = new Error(body.error);
        }
        return callback(this.processError(funcName, error), body);
    }
};

trader.prototype.getTrades = (since, callback, descending)=> {
    let startTs = since ? moment(since).valueOf() : null;
    let processResults = (err, trades)=> {
        if (err) return callback(err);

        let parsedTrades = [];
        _.each(trades.result[this.pair], (trade)=> {
            // Even when you supply 'since' you can still get more trades than you asked for, it needs to be filtered
            if (_.isNull(startTs) || startTs < moment.unix(trade[2]).valueOf()) {
                parsedTrades.push({
                    tid: moment.unix(trade[2]).valueOf() * 1000000,
                    date: parseInt(Math.round(trade[2]), 10),
                    price: parseFloat(trade[0]),
                    amount: parseFloat(trade[1])
                });
            }
        }, this);

        if(descending)
            callback(undefined, parsedTrades.reverse());
        else
            callback(undefined, parsedTrades);
    };

    let reqData = {
        pair: this.pair
    };

    if(since) {
        // Kraken wants a tid, which is found to be timestamp_ms * 1000000 in practice. No clear documentation on this though
        reqData.since = startTs * 1000000;
    }

    let handler = (cb) => this.kraken.api('Trades', reqData, this.handleResponse('getTrades', cb));
    util.retryCustom(retryForever, _.bind(handler, this), _.bind(processResults, this));
};

trader.prototype.getPortfolio = (callback)=> {
    let setBalance = (err, data)=> {
        if(err) return callback(err);
        log.debug('[kraken.js] entering "setBalance" callback after kraken-api call, data:' , data);
        let assetAmount = parseFloat( data.result[this.market.prefixed[1]] );
        let currencyAmount = parseFloat( data.result[this.market.prefixed[0]] );

        if(!_.isNumber(assetAmount) || _.isNaN(assetAmount)) {
            log.error(`Kraken did not return portfolio for ${this.asset}, assuming 0.`);
            assetAmount = 0;
        }

        if(!_.isNumber(currencyAmount) || _.isNaN(currencyAmount)) {
            log.error(`Kraken did not return portfolio for ${this.currency}, assuming 0.`);
            currencyAmount = 0;
        }

        let portfolio = [
            { name: this.asset, amount: assetAmount },
            { name: this.currency, amount: currencyAmount }
        ];

        return callback(undefined, portfolio);
    };

    let handler = (cb) => this.kraken.api('Balance', {}, this.handleResponse('getPortfolio', cb));
    util.retryCustom(retryForever, _.bind(handler, this), _.bind(setBalance, this));
};

// This assumes that only limit orders are being placed with standard assets pairs
// It does not take into account volume discounts.
// Base maker fee is 0.16%, taker fee is 0.26%.
trader.prototype.getFee = function(callback) {
    const makerFee = 0.16;
    callback(undefined, makerFee / 100);
};