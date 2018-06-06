let BitX = require("bitx");

let lodash = require('lodash');
let moment = require('moment');

let log = require('../core/log');
let util = require('../core/util.js');

let trader = function(config) {
    lodash.bindAll(this);
    if (lodash.isObject(config)) {
        this.key = config.key;
        this.secret = config.secret;
    }
    this.name = 'bitx';
    this.currency = config.currency;
    this.asset = config.asset;
    this.pair = config.asset + config.currency;
    this.bitx = new BitX(this.key, this.secret, { pair: this.pair });
    this.trades = [];
    this.market = lodash.find(trader.getCapabilities().markets, (market) => {
      	return market.pair[0] === this.currency && market.pair[1] === this.asset
    });
}


trader.prototype.retry = function(method, args) {

    let wait = +moment.duration(10, 'seconds');
    log.debug(this.name, 'Returned an error, retrying in', wait / 1000, '(s)..');
    let self = this;
    
    lodash.each(args, function(arg, i) {
        if (lodash.isFunction(arg))
            args[i] = lodash.bind(arg, self);
    });
    
    setTimeout(function() {method.apply(self, args)},wait);
    
}


trader.prototype.roundAmount = function(amount, digits) {

    let precision;
    if (Number.isInteger(digits)) 
    	precision = Math.pow(10, digits);
    
    else 
    	precision = Math.pow(10, 8);
    		
    amount = amount * precision;	
    amount = Math.floor(amount);
    amount = amount / precision;
    
    return amount;
};



trader.prototype.getTicker = function(callback) {
	
	let args = lodash.toArray(arguments);
    let process = function(err, data) {
    
        if (err) {
            log.error('ERROR: --> ', err);
            return this.retry(this.getTicker, args);
        }
        
        log.debug(this.name, ': getTicker --> ask:', data.ask, 'bid:', data.bid);
        let ticker = {ask: data.ask,bid: data.bid,};
        callback(err, ticker);
        
    }.bind(this);
    
    this.bitx.getTicker(process);
}


trader.prototype.getFee = function(callback) {
    let args = lodash.toArray(arguments);
    //fees according to the ETHXBT, XBTIDR or others
    if (this.pair === 'ETHXBT')
        callback(null, 0.000025);
    else if (this.pair === 'XBTIDR')
        callback(null, 0.00002);
    else
        callback(null, 0.0001);
        
}


trader.prototype.getPortfolio = function(callback) {
    let args = lodash.toArray(arguments);
    let process = function(err, data) {
        if (err) {
            log.error('error --> ', err);
            return this.retry(this.getPortfolio, args);
        }
        let assetAmount = currencyAmount = assetHold = currencyHold = 0;
        lodash.forEach(data.balance, function(t) {
            if (this.asset === t.asset) {
                assetAmount = +t.balance;
                assetHold = +t.reserved;
            } else if (this.currency === t.asset) {
                currencyAmount = +t.balance;
                currencyHold = +t.reserved;
            }
        }.bind(this))
        
        if (!lodash.isNumber(assetAmount) || lodash.isNaN(assetAmount) || !lodash.isNumber(currencyAmount) || lodash.isNaN(currencyAmount)) 
            return log.error('account balance error: Gekko is unable to trade with ', this.currency.toUpperCase(), ':', currencyAmount, ' or ', this.asset.toUpperCase(), ':', assetAmount);
    
        let portfolio = [
            { name: this.asset.toUpperCase(), amount: assetAmount - assetHold },
            { name: this.currency.toUpperCase(), amount: currencyAmount - currencyHold }
        ];
        
        log.debug(this.name, ': getPortfolio --> ' + JSON.stringify(portfolio));
        
        callback(err, portfolio);
    }.bind(this);
    
    this.bitx.getBalance(process);
}


trader.prototype.buy = function(amount, price, callback) {
    let args = lodash.toArray(arguments);
    let process = function(err, data) {
    
        if (err) {
            if (lodash.contains(err.message, 'Insufficient balance')) {
                log.error('unable to buy: (', err.message, ')');
                return callback(err.message, null);
            } else {
                log.error('unable to buy', err.message);
                return this.retry(this.buy, args);
            }
        }
        log.debug('order id: --> ', data.orderlodashid);
        callback(err, data.orderlodashid);
        
    }.bind(this);
    
    log.debug(this.name, ': buy --- amount: ', amount, 'price: ', price);
    
    this.bitx.postBuyOrder(amount, price, process);
}


trader.prototype.sell = function(amount, price, callback) {
    
    let args = lodash.toArray(arguments);
    let process = function(err, data) {
        if (err) {
            log.error('unable to sell', err.message);
            return this.retry(this.sell, args);
        }
        
        log.debug('order id: --> ', data.orderlodashid);
        callback(err, data.orderlodashid);
        
    }.bind(this);
    
    log.debug(this.name, ': sell --- amount: ', amount, 'price: ', price);
    this.bitx.postSellOrder(amount, price, process);
}

trader.prototype.getLotSize = function(tradeType, amount, price, callback) {
    amount = this.roundAmount(amount, this.market.minimalOrder.precision);
    
    if (amount < this.market.minimalOrder.amount)
        return callback(null, { amount: 0, price: 0 });
        
    callback(null, { amount: amount, price: price });
}

trader.prototype.getOrder = function(order, callback) {
    let args = lodash.toArray(arguments);
    if (order == null) 
        return callback('no orderlodashid', false);
        
    let process = function(err, data) {
        if (err) {
            log.error('error --> ', err);
            return this.retry(this.getOrder, args);
        }
        let price = 0;
        let amount = 0;
        let date = moment(0);
        price = parseFloat(data.limitlodashprice);
        amount = parseFloat(data.base);
        
        date = data.state === 'PENDING' ? moment(data.creationlodashtimestamp) : moment(data.completedlodashtimestamp);
                       
        log.debug('order --> price, amount, date --> ', price, amount, date);
        callback(err, { price, amount, date });
        
    }.bind(this);
    log.debug(this.name, ': getOrder --- order: ', order);
    this.bitx.getOrder(order, process);
}


trader.prototype.checkOrder = function(order, callback) {
    let args = lodash.toArray(arguments);
    if (order == null) 
        return callback('no orderlodashid', false);

    let process = function(err, data) {
        if (err) {
            log.error('error --> ', err);
            return this.retry(this.checkOrder, args);
        }
        
        let stillThere = lodash.find(data.orders, function(o) {
            return o.orderlodashid === order
        });
        
        log.debug(this.name, ': checkOrder ---alreadyFilled? --> ', !stillThere);
        callback(err, !stillThere);
    }.bind(this);
    this.bitx.getOrderList({ state: 'PENDING' }, process);
}


trader.prototype.cancelOrder = function(order, callback) {
    let args = lodash.toArray(arguments);
    let process = function(err, data) {
        if (err) {
        
            if (lodash.contains(err.message, 'Invalid orderlodashid')) {
                return log.error('unable to cancel order: ', order, '(', err.message, '), aborting...');
            }
            
            if (lodash.contains(err.message, 'Cannot stop unknown')) {
                log.error('unable to cancel order: ', order, '(', err.message, '), assuming success...');
                callback();
            } else {
                log.error('unable to cancel order: ', order, '(', err, '), retrying...');
                return this.retry(this.cancelOrder, args);
            }
            
        }
        log.debug('status--> ', data);
        callback();
    }.bind(this);
    
    log.debug(this.name, ': cancelOrder --- order: ', order);
    this.bitx.stopOrder(order, process);
}

trader.prototype.getTrades = function(since, callback, descending) {
    let args = lodash.toArray(arguments);
    let process = function(err, result) {
        if (err) {
            log.error('error --> ', err);
            return this.retry(this.getTrades, args);
        }
        trades = lodash.map(result.trades, function(t) {
            return {
                price: t.price,
                date: Math.round(t.timestamp / 1000),
                amount: t.volume,
                tid: t.timestamp 
            };
        });

        if (!descending) {
            trades = trades.reverse()
        }
        callback(null, trades);
    }.bind(this);

    if(moment.isMoment(since)) since = since.valueOf();
    (lodash.isNumber(since) && since > 0) ? since : since = 0;

    this.bitx.getTrades({ since: since, pair: this.pair }, process);
}

trader.getCapabilities = function() {
    return {
        name: 'BitX',
        slug: 'bitx',
        currencies: ['MYR', 'KES', 'NGN', 'ZAR', 'XBT'],
        assets: ['ETH', 'XBT'],
        markets: [
            { pair: ['XBT', 'ETH'], minimalOrder: { amount: 0.01, precision: 2 } },
            { pair: ['MYR', 'XBT'], minimalOrder: { amount: 0.0005, precision: 6 } },
            { pair: ['KES', 'XBT'], minimalOrder: { amount: 0.0005, precision: 6 } },
            { pair: ['NGN', 'XBT'], minimalOrder: { amount: 0.0005, precision: 6 } },
            { pair: ['ZAR', 'XBT'], minimalOrder: { amount: 0.0005, precision: 6 } },
        ],
        requires: ['key', 'secret'],
        providesFullHistory: true,
        providesHistory: 'date',
        tid: 'tid',
        tradable: true,
        forceReorderDelay: true
    };
}

module.exports = trader;