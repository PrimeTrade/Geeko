const BTCChina = require('btc-china-fork');
const util = require('../core/util.js');
const _ = require('lodash');
const moment = require('moment');
const log = require('../core/log');

let trader = (config)=> {
    _.bindAll(this);
    if(_.isObject(config)) {
        this.key = config.key;
        this.secret = config.secret;
        this.clientID = config.username;
    }
    this.name = 'BTCC';

    this.pair = (config.asset + config.currency).toUpperCase();

    this.btcc = new BTCChina(this.key, this.secret, this.clientID);
};

//retry after 10 seconds
trader.prototype.retry = (method, args)=> {
    let wait = +moment.duration(10, 'seconds');
    log.debug(this.name, 'returned an error, retrying..');

    let self = this;
    _.each(args, (arg, i)=> {
        if(_.isFunction(arg))
            args[i] = _.bind(arg, self);
    });

    //run the method again after some wait
    setTimeout(
        function() { method.apply(self, args) },
        wait
    );
};

trader.prototype.getTicker = (callback)=> {
    let args = _.toArray(arguments);
    let process = (err, result)=> {
        if(err)
            return this.retry(this.getTicker, args);
        callback(null, {
            bid: result.bids[0][0],
            ask: result.asks[0][0]
        });
    };
    process.bind(this);
    this.btcc.getOrderBook(process, this.pair, 1);
};

trader.prototype.getTrades = (since, callback, descending)=> {
    let args = _.toArray(arguments);
    let process = (err, result)=> {
        if(err)
           return this.retry(this.getTrades, args);
        if(descending)
            callback(null, result.reverse());
        else
            callback(null, result);
    };
    process.bind(this);
    if(!since)
        since = 500;
    else
        since = 5000;

    this.btcc.getHistoryData(process, {limit: since});
};

trader.prototype.getPortfolio = (callback)=>{
    let args = _.toArray(arguments);
    let set = (err,data)=>{
        if(err)
            return this.retry(this.getPortfolio, args);
        let portfolio = [];
        _.each(data.result.balance, (obj)=>{
            portfolio.push({name: obj.currency, amount: parseFloat(obj.amount)});
        });
        callback(err, portfolio);
    };
    set.bind(this);
    this.btcc.getAccountInfo(set, 'ALL');
};

trader.prototype.getFee = (callback)=>{
    let args = _.toArray(arguments);
    let set = (err, data)=>{
        if(err)
            this.retry(this.getFee, args);
        callback(false, data.result.profile.trade_fee/100);
    };
    set.bind(this);
    this.btcc.getAccountInfo(set, 'ALL');
};

trader.prototype.buy = (amount, price, callback)=>{
    amount = Math.floor(amount*10000)/10000;
    let set = (err, result)=>{
        if(err)
            return log.error('Unable to buy:',err, result);
        callback(null,result.result);
    };
    set.bind(this);
    this.btcc.createOrder2(set, 'buy', price, amount, this.pair);
};

trader.prototype.sell = (amount, price, callback)=>{
    amount = Math.round(amount * 10000)/10000;
    let set = (err,result)=>{
        if(err)
            return log.error('Unable to sell:', err, result);
        callback(null, result.result);
    };
    set.bind(this);
    this.btcc.createOrder2(set, 'sell', price, amount, this.pair);
};

trader.prototype.checkOrder = (order, callback)=>{
    let args = _.toArray(arguments);
    let check = (err, result)=>{
        if(err)
            this.retry(this.checkOrder, args);
        let done = result.result.order.status === 'closed';
        callback(err, done);
    };
    this.btcc.getOrder(check, order, this.pair, true);
};

trader.prototype.cancelOrder = (order, callback)=>{
    let cancel = (err, result)=>{
        if(err)
            log.error('unable to cancel order', order, `( ${err},${result},)`);
    };
    cancel.bind(this);
    this.btcc.cancelOrder(cancel, order, this.pair);
};

trader.getCapabilities = ()=> {
    return {
        name: 'BTCC',
        slug: 'btcc',
        currencies: ['BTC', 'CNY'],
        assets: ['BTC', 'LTC'],
        markets: [
            { pair: ['CNY', 'BTC'], minimalOrder: { amount: 0.001, unit: 'asset' } },
            { pair: ['CNY', 'LTC'], minimalOrder: { amount: 0.001, unit: 'asset' } },
            { pair: ['BTC', 'LTC'], minimalOrder: { amount: 0.001, unit: 'asset' } }
        ],
        requires: ['key', 'secret'],
        tid: 'tid',
        providesFullHistory: true,
    };
};

module.exports = trader;