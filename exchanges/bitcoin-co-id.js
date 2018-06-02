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