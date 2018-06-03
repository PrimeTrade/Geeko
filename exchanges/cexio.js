let CEXio = require('cexio'),
    moment = require('moment'),
    async = require('async'),
    _ = require('lodash'),
    util = require('../core/util'),
    log = require('../core/log');

let trader = (config)=> {
    this.user = config.username;
    this.key = config.key;
    this.secret = config.secret;
    this.currency = config.currency.toUpperCase();
    this.asset = config.asset.toUpperCase();
    this.pair = this.asset + '_' + this.currency;
    this.name = 'cex.io';

    this.cexio = new CEXio(
        this.pair,
        this.user,
        this.key,
        this.secret
    );

    _.bindAll(this);
};

trader.prototype.getTrades = (since, callback, descending)=> {
    let args = _.toArray(arguments);
    let process = (err, trades)=> {
        if(err || !trades || trades.length === 0)
            return this.retry(this.getTrades, args, err);

        if(descending)
            callback(null, trades);
        else
            callback(null, trades.reverse());
    };

    this.cexio.trades({}, _.bind(process, this));
};

trader.prototype.buy = (amount, price, callback)=> {
    // Prevent "You incorrectly entered one of fields."
    // because of more than 8 decimals.
    amount *= 100000000;
    amount = Math.floor(amount);
    amount /= 100000000;

    log.debug('BUY', amount, this.asset, '@', price, this.currency);

    let set = (err, data)=> {
        if(err)
            return log.error('unable to buy:', err);
        if(data.error)
            return log.error('unable to buy:', data.error);

        log.debug('BUY order placed.  Order ID', data.id);
        callback(null, data.id);
    };

    this.cexio.place_order('buy', amount, price, _.bind(set, this));
};

trader.prototype.sell = (amount, price, callback)=> {
    // Prevent "You incorrectly entered one of fields."
    // because of more than 8 decimals.
    amount *= 100000000;
    amount = Math.floor(amount);
    amount /= 100000000;

    // test placing orders which will not be filled
    //price *= 10; price = price.toFixed(8);

    log.debug('SELL', amount, this.asset, '@', price, this.currency);

    let set = (err, data)=> {
        if(err)
            return log.error('unable to sell:', err);
        if(data.error)
            return log.error('unable to sell:', data.error);

        log.debug('SELL order placed.  Order ID', data.id);
        callback(null, data.id);
    };

    this.cexio.place_order('sell', amount, price, _.bind(set, this));
};

trader.prototype.retry = (method, args, err)=> {
    let wait = +moment.duration(10, 'seconds');
    log.debug(this.name, 'returned an error, retrying..', err, 'waiting for', wait, 'ms');

    if (!_.isFunction(method)) {
        log.error(this.name, 'failed to retry, no method supplied.');
        return;
    }

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

trader.prototype.getTicker = (callback)=> {
    let set = (err, data)=> {
        let ticker = {
            ask: data.ask,
            bid: data.bid
        };
        callback(err, ticker);
    };
    this.cexio.ticker(_.bind(set, this));
};