let Bitcoincoid = require('bitcoin-co-id-update');
let _ = require('lodash');
let moment = require('moment');
let log = require('../core/log');

let trader = (config)=>{
    _.bindAll(this);
        if(_.isObject(config)) {
            this.key = config.key;
            this.secret = config.secret;
            this.clientID = config.username;
            this.currency = config.currency.toLowerCase();
            this.asset = config.asset.toLowerCase();
            this.pair = this.asset + '_' + this.currency;
        }
        this.name = 'Bitcoin-co-id';
        this.bitcoincoid = new Bitcoincoid(this.key, this.secret);
    };

    trader.prototype.roundAmount = (amount)=> {
        let priceDivider = 100000000; // one hundred million;
        amount *= priceDivider;
        amount = Math.floor(amount);
        amount /= priceDivider;
        return amount;
    };

// if the exchange errors we try the same call again after
// waiting 10 seconds
    trader.prototype.retry = (method, args)=> {
        let wait = +moment.duration(10, 'seconds');
        log.debug(this.name, 'returned an error, retrying..');

        let self = this;

        // make sure the callback (and any other fn)
        // is bound to Trader
        _.each(args, (arg, i)=> {
            if(_.isFunction(arg))
                args[i] = _.bind(arg, self);
        });

        // run the failed method again with the same
        // arguments after wait
        setTimeout(
            ()=> { method.apply(self, args); },
            wait
        );
    };

    trader.prototype.getTicker = (callback)=> {
        let args = _.toArray(arguments),
            set = (err, data)=> {
                if(err)
                    return this.retry(this.getTicker, args);
                let ticker = {
                    ask: this.roundAmount(data.ticker.buy),
                    bid: this.roundAmount(data.ticker.sell),
                };
                callback(err, ticker);
            };
            set.bind(this);
        this.bitcoincoid.getTicker(this.pair, set);
    };

    trader.prototype.getPortfolio = (callback)=> {
        let functionName = 'Trader.getPortfolio()',
            args = _.toArray(arguments);
        let set = (err, data)=> {
            if(err)
                return this.retry(this.getPortfolio, args);
            let assetAmount = this.roundAmount( data.return.balance[this.asset] ),
                currencyAmount = this.roundAmount( data.return.balance[this.currency] ),
                assetHold = this.roundAmount( data.return.balance_hold[this.asset] ),
                currencyHold = this.roundAmount( data.return.balance_hold[this.currency] );

            if(
                !_.isNumber(assetAmount) || _.isNaN(assetAmount) ||
                !_.isNumber(currencyAmount) || _.isNaN(currencyAmount)
            ) {
                return log.error('account balance error: Gekko is unable to trade with ',this.currency.toUpperCase(),':',currencyAmount,' or ',this.asset.toUpperCase(),':',assetAmount);
            }
            let portfolio = [
                { name: this.currency.toUpperCase(), amount: currencyAmount - currencyHold},
                { name: this.asset.toUpperCase(), amount: assetAmount - assetHold }
            ];
            callback(err, portfolio);
        };
        set.bind(this);
        this.bitcoincoid.getAccountBalances(set);
    };
trader.prototype.getTrades = (since, callback, descending)=> {
    let args = _.toArray(arguments);

    if(since)
        since = 150; // ???

    let process = (err, data)=> {
        if(err)
            return this.retry(this.getTrades, args);

        let trades = _.map(data, (trade)=> {
            return {
                price: +trade.price,
                amount: +trade.amount,
                tid: +trade.tid,
                date: trade.date
            };
        });
        callback(null, data.reverse());
    };
    process.bind(this);

    this.bitcoincoid.getTrades(this.pair, process);
}

// bitcoin.co.id: Maker 0% - Taker 0.3%
// Note: trading fee: 0.3% for IDR pairs and 0% for BTC pairs
trader.prototype.getFee = (callback)=> {
    let fee = 0;
    if (this.currency.toUpperCase() === 'IDR')
    {
        fee = 0.003;
    }
    else if (this.currency.toUpperCase() === 'BTC')
    {
        fee = 0.000;
    }

    callback(false, fee);
};

trader.prototype.buy = (amount, price, callback)=> {
    this.type = 'buy';

    // decrease purchase amount by 1% to avoid trying to buy more than balance
    amount -= amount / 100;
    amount = this.roundAmount(amount);

    // decrease purchase price by 1% less than asking price
    // price -= price / 100;
    amount *= price;

    let set = (err, data)=> {
        if(!err && _.isEmpty(data))
            err = 'no data';
        else if(!err && !_.isEmpty(data.errorMessage))
            err = data.errorMessage;
        if(err)
            return log.error('unable to buy', err);
        callback(null, data.return.order_id);
    };
    set.bind(this);
    this.bitcoincoid.createOrders(
        this.pair + '',
        this.type,
        price,
        amount,
        set
    );
};

trader.prototype.sell = (amount, price, callback)=> {
    this.type = 'sell';

    // increase selling price by 1% more than bidding price
    // price += price / 100;

    amount = this.roundAmount(amount);
    let set = (err, data)=> {
        if(!err && _.isEmpty(data))
            err = 'no data';
        else if(!err && !_.isEmpty(data.errorMessage))
            err = data.errorMessage;
        if(err)
            return log.error('unable to sell', err);
        callback(null, data.return.order_id);
    };
    set.bind(this);
    this.bitcoincoid.createOrders(
        this.pair + '',
        this.type,
        price,
        amount,
        set
    );
};
trader.prototype.checkOrder = (order, callback)=> {
    let args = _.toArray(arguments);
    if (order === null) {
        return callback('no order_id', false);
    }
    let check = (err, data)=> {
        if(err){
            return this.retry(this.checkOrder, arguments);
        }
        let status = data.return.order.status;
        if (status === 'filled') {
            return callback(err, true);
        } else if (status === 'open') {
            return callback(err, false);
        }
        callback(err, false);
    };
    check.bind(this);

    this.bitcoincoid.getOrderDetails(this.pair, order, check);
};

trader.prototype.getOrder = (order, callback)=> {
    let args = _.toArray(arguments);
    if (order === null) {
        return callback('no order_id', false);
    }
    let get = (data, err)=> {
        if(err)
            return callback(err);

        let price = 0;
        let amount = 0;
        let date = moment(0);

        if(!data.success)
            return callback(null, {price, amount, date});

        let result = data.return.order;
        let orderAmount = result.order+'_'+this.asset;
        price = result.Price;
        amount = result.orderAmount;

        if(result.status === 'open') {
            date = moment(result.submit_time);
        } else {
            date = moment(result.finish_time);
        }
        callback(err, {price, amount, date});
    };
    get.bind(this);

    this.bitcoincoid.getOrderDetails(this.pair, order, get);
};

trader.prototype.cancelOrder = (order, callback)=> {
    let args = _.toArray(arguments);
    let cancel = function(err, data) {
        if(err) {
            return log.error('unable to cancel order: ', order, '(', err, '), retrying...');
        }
        this.retry(this.cancelOrder, args);
        callback();
    };
    this.bitcoincoid.cancelOrder(this.pair, order, this.type, cancel);
};

trader.getCapabilities = ()=> {
    return {
        name: 'Bitcoin.co.id',
        slug: 'bitcoin-co-id',
        currencies: ['IDR', 'BTC'],
        assets: [
            "BTC", "BCH", "BTG", "ETH", "ETC", "LTC", "NXT", "WAVES", "STR", "XRP", "XZC", "BTS", "DRK", "DOGE", "NEM", "XZR", "DASH", "XLM", "XEM"
        ],
        markets: [

            // IDR <-> XXXX

            { pair: ['IDR', 'BTC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
            { pair: ['IDR', 'BCH'], minimalOrder: { amount: 0.001, unit: 'asset' } },
            { pair: ['IDR', 'BTG'], minimalOrder: { amount: 0.01, unit: 'asset' } },
            { pair: ['IDR', 'ETH'], minimalOrder: { amount: 0.01, unit: 'asset' } },
            { pair: ['IDR', 'ETC'], minimalOrder: { amount: 0.1, unit: 'asset' } },
            { pair: ['IDR', 'LTC'], minimalOrder: { amount: 0.01, unit: 'asset' } },
            { pair: ['IDR', 'NXT'], minimalOrder: { amount: 5, unit: 'asset' } },
            { pair: ['IDR', 'WAVES'], minimalOrder: { amount: 0.1, unit: 'asset' } },
            { pair: ['IDR', 'STR'], minimalOrder: { amount: 20, unit: 'asset' } }, // Listed as XLM
            { pair: ['IDR', 'XRP'], minimalOrder: { amount: 10, unit: 'asset' } },
            { pair: ['IDR', 'XZC'], minimalOrder: { amount: 0.1, unit: 'asset' } },


            // BTC <-> XXXX

            { pair: ['BTC', 'BTS'], minimalOrder: { amount: 0.01, unit: 'asset' } },
            { pair: ['BTC', 'DRK'], minimalOrder: { amount: 0.01, unit: 'asset' } }, // Listed as DASH
            { pair: ['BTC', 'DOGE'], minimalOrder: { amount: 1, unit: 'asset' } },
            { pair: ['BTC', 'ETH'], minimalOrder: { amount: 0.001, unit: 'asset' } },
            { pair: ['BTC', 'LTC'], minimalOrder: { amount: 0.01, unit: 'asset' } },
            { pair: ['BTC', 'NXT'], minimalOrder: { amount: 0.01, unit: 'asset' } },
            { pair: ['BTC', 'STR'], minimalOrder: { amount: 0.01, unit: 'asset' } }, // Listed as XLM
            { pair: ['BTC', 'NEM'], minimalOrder: { amount: 1, unit: 'asset' } }, // Listed as XEM
            { pair: ['BTC', 'XRP'], minimalOrder: { amount: 0.01, unit: 'asset' } }

        ],
        requires: ['key', 'secret'],
        tid: 'tid',
        providesHistory: true,
        providesFullHistory: false,
        tradable: true
    };
};

module.exports = trader;