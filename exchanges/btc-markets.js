let BTCMarkets = require('btc-markets');
let _ = require('lodash');
let moment = require('moment');
let log = require('../core/log');

let trader = (config)=> {
    _.bindAll(this);
    if(_.isObject(config)) {
        this.key = config.key;
        this.secret = config.secret;
        this.clientID = config.username;
        this.currency = config.currency;
        this.asset = config.asset;
    }
    this.name = 'BTC Markets';
    this.priceDivider = 100000000; // one hundred million
    this.btcmakets = new BTCMarkets(this.key, this.secret);
};

// if the exchange errors we try the same call again after
// waiting 10 seconds
trader.prototype.retry = (method, args)=> {
    let wait = +moment.duration(10, 'seconds');
    log.debug(this.name, 'returned an error, retrying..');

    let self = this;

    // make sure the callback (and any other fn)
    // is bound to trader
    _.each(args, (arg, i)=> {
        if(_.isFunction(arg))
            args[i] = _.bind(arg, self);
    });

    // run the failed method again with the same
    // arguments after wait
    setTimeout(
        function() { method.apply(self, args) },
        wait
    );
};

trader.prototype.getPortfolio = (callback)=> {
    let set = (err, data)=> {

        if(!_.isEmpty(data.errorMessage))
            return callback('BTC-MARKET API ERROR: ' + data.errorMessage);

        let portfolio = _.map(data, (balance)=> {
            return {
                name: balance.currency,
                amount: balance.balance / this.priceDivider
            }
        }, this);

        callback(err, portfolio);
    };
    set.bind(this);

    this.btcmakets.getAccountBalances(set);
};

trader.prototype.getTicker = (callback)=> {
    let args = _.toArray(arguments);
    let set = (err, result)=> {
        if(err)
            return this.retry(this.getTicker, args);

        callback(null, {
            bid: result.bestBid,
            ask: result.bestAsk
        });
    };
    set.bind(this);
    this.btcmakets.getTick(this.asset, this.currency, set);
};

trader.prototype.getFee = (callback)=> {
    let args = _.toArray(arguments);
    let set = (err, data)=> {

        if(!err && _.isEmpty(data))
            err = 'no data';
        else if(!err && !_.isEmpty(data.errorMessage))
            err = data.errorMessage;
        if(err){
            log.error('unable to retrieve fee', err, ' retrying...');
            return this.retry(this.getFee, args);
        }
        data.tradingFeeRate /= this.priceDivider;
        callback(false, data.tradingFeeRate);
    };
    set.bind(this);
    this.btcmakets.getTradingFee(this.asset, this.currency, set);
};

trader.prototype.buy = (amount, price, callback)=> {

    price *= this.priceDivider;
    amount = Math.floor(amount * this.priceDivider);
    let id = Math.random() + '';
    let set = (err, data)=> {
        if(!err && _.isEmpty(data))
            err = 'no data';
        else if(!err && !_.isEmpty(data.errorMessage))
            err = data.errorMessage;
        if(err)
            return log.error('unable to buy', err);
        callback(null, data.id);
    };
    set.bind(this);
    this.btcmakets.createOrder(
        this.asset,
        this.currency,
        price,
        amount,
        'Bid',
        'Limit',
        id,
        set
    );
};

trader.prototype.sell = (amount, price, callback)=> {
    price *= this.priceDivider;
    amount = Math.floor(amount * this.priceDivider);
    let id = Math.random() + '';
    let set = (err, data)=>{
        if(!err && _.isEmpty(data))
            err = 'no data';
        else if(!err && !_.isEmpty(data.errorMessage))
            err = data.errorMessage;
        if(err)
            return log.error('unable to sell', err);
        callback(null, data.id);
    };
    set.bind(this);
    this.btcmakets.createOrder(
        this.asset,
        this.currency,
        price,
        amount,
        'Ask',
        'Limit',
        id,
        set
    );
};
