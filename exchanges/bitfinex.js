const _ = require('lodash');
const util = require('../core/util');
const moment = require('moment');
const log = require('../core/log');
const Bitfinex = require('bitfinex-api-node');
const errors = require('../core/error');
const marketData = require('./bitfinex-markets.json');

let trader = (config)=>{
  _.bindAll(this);
  if(_.isObject(config)){
      this.key = config.key;
      this.secret = config.secret;
  }
  this.name = 'Bitfinex';
  this.price = undefined;
  this.balance = undefined;
  this.asset = config.asset;
  this.currency = config.currency;
  this.pair = this.asset + this.currency;
  this.bitfinex = new Bitfinex(this.key, this.secret, {version:1}).rest;
};

let criticalRetry = {
    retires: 10,
    factor: 1.2,
    minTimeout: 10*1000,
    maxTimeout: 60*1000
};

let foreverRetry = {
    forever: true,
    factor: 1.2,
    minTimeout: 10*1000,
    maxTimeout: 300*1000
};

let recoverableErrors = new RegExp(/(SOCKETTIMEDOUT|TIMEDOUT|CONNRESET|CONNREFUSED|NOTFOUND|429|443|5\d\d)/g);

trader.prototype.processError = (func, error)=>{
    if(!error) return undefined;
    if (!error.message.match(recoverableErrors)){
        log.error(`[bitfinex.js] (${func}) returned an irrecoverable error: ${error.message}`);
        return new errors.AbortError('[bitfinex.js]'+ error.message);
    }
    log.debug(`[bitfinex.js] (${func}) returned an error, retrying: ${error.message}`);
    return new errors.RetryError('[bitfinex.js]'+ error.message);
};

trader.prototype.handleResponse = (func, callback)=>{
    return (error, data, body)=>{
        return callback(this.processError(func, error),data);
    }
};

trader.prototype.getPortfolio = (callback)=>{
    let process = (err, data)=>{
        if(err) return callback(err);
        //interested in funds in the "exchange" wallet
        data = data.filter(c=> c.type === 'exchange');
        const asset = _.find(data, c=> c.currency.toUpperCase() === this.asset);
        const currency = _.find(data, c=> c.currency.toUpperCase() === this.currency);
        let assetAmount, currencyAmount;
        if(_.isObject(asset) && _.isNumber(+asset.available) && !_.isNaN(+asset.available))
            assetAmount = +asset.available;
        else {
            log.error(`Bitfinex did not provide ${this.asset} amount, assuming 0`);
            assetAmount = 0;
        }

        if(_.isObject(currency) && _.isNumber(+currency.available) && !_.isNaN(+currency.available))
            currencyAmount = +currency.available;
        else{
            log.error(`Bitfinex did not provide ${this.currency} amount, assuming 0`);
            currencyAmount = 0;
        }
        const portfolio = [
            {name: this.asset, amount: assetAmount},
            {name: this.currency, amount: currencyAmount},
        ];
        callback(undefined, portfolio);
    };
    let handler = (cb)=> this.bitfinex.wallet_balances(this.handleResponse('getPortfolio', cb));
    util.retryCustom(foreverRetry, _.bind(handler, this), _.bind(process, this));
};

trader.prototype.getTicker = (callback)=>{
    let process = (err, data)=>{
        if(err) return callback(err);
        callback(undefined, {bid: +data.bid, ask: +data.ask})
    };

    let handler = (cb)=> this.bitfinex.ticker(this.pair, this.handleResponse('getTicker', cb));
    util.retryCustom(foreverRetry, _.bind(handler, this), _.bind(process, this));
};

//maker fee is 0.1%
trader.prototype.getFee = (callback)=>{
    let makerFee = 0.1;
    callback(undefined, makerFee / 100);
};

trader.prototype.submit_order = (type, amount, price, callback)=>{
    let process = (err, data)=>{
        if(err) return callback(err);
        callback(err, data.order_id);
    };
    amount = Math.floor(amount*100000000)/100000000;
    let handler = (cb)=> this.bitfinex.new_order(this.pair, amount +'', price +'', this.name.toLowerCase(), type, 'exchange limit', this.handleResponse('submitOrder', cb));
    util.retryCustom(retryCritical, _.bind(handler, this), _.bind(process, this));
};

trader.prototype.buy = (amount, price, callback)=>{
    this.submit_order('buy', amount, price, callback);
};

trader.prototype.sell = (amount, price, callback)=>{
    this.submit_order('sell', amount, price, callback);
};

trader.prototype.getTrades = (since, callback, decending)=>{
    let process = (err, data)=>{
        if(err) return callback(err);
        let trades = _.map(data, (trade)=>{
            return{
                tid: trade.id,
                date: trade.timestamp,
                price: +trade.price,
                amount: +trade.amount
            }
        });
        callback(undefined, decending ? trades : trades.reverse());
    };
    let path = this.pair;
    if(since)
        path += '?limit_trades=2000';
    let handler = (cb)=> this.bitfinex.trades(path, this.handleResponse('getTrades', cb));
    util.retryCustom(foreverRetry, _.bind(handler, this), _.bind(process, this));
};