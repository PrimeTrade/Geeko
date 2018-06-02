const kraken = require('kraken-api-es5');
const moment = require('moment');
const _ = require('lodash');
const util = require('../core/util');
const Errors = require('../core/error');
const log = require('../core/log');
const marketData = require('./kraken-markets.json');

let trader = function(config) {
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

    this.kraken = new kraken(
        this.key,
        this.secret,
        {timeout: +moment.duration(60, 'seconds')}
    );
}

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

trader.prototype.processError = function(funcName, error) {
    if (!error) return undefined;

    if (!error.message.match(recoverableErrors)) {
        log.error(`[kraken.js] (${funcName}) returned an irrecoverable error: ${error.message}`);
        return new Errors.AbortError('[kraken.js] ' + error.message);
    }

    log.debug(`[kraken.js] (${funcName}) returned an error, retrying: ${error.message}`);
    return new Errors.RetryError('[kraken.js] ' + error.message);
};

trader.prototype.handleResponse = function(funcName, callback) {
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