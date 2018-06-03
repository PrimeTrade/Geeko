let WEX = require('node-wex');
let moment = require('moment');
let util = require('../core/util');
let _ = require('lodash');
let log = require('../core/log');

let trader = (config)=> {
    this.key = config.key;
    this.secret = config.secret;
    this.asset = config.asset;
    this.currency = config.currency;
    this.pair = [config.asset, config.currency].join('_').toLowerCase();
    this.name = 'wex.nz';

    _.bindAll(this);

    this.wex = new WEX(this.key, this.secret);
    _.bindAll(this.wex, ['trade', 'trades', 'getInfo', 'ticker', 'orderList']);

    // see @link https://github.com/askmike/gekko/issues/302
    this.wexHistorocial = new WEX(false, false, {public_url: 'https://wex.nz/api/3/'});
    _.bindAll(this.wexHistorocial, 'trades');
};

trader.prototype.round = (amount)=> {
    // Prevent "You incorrectly entered one of fields."
    // because of more than 8 decimals.
    amount *= 100000000;
    amount = Math.floor(amount);
    amount /= 100000000;

    return amount;
};

trader.prototype.buy = (amount, price, callback)=> {
    amount = this.round(amount);

    let set = (err, data)=> {
        if(err || !data || !data.return)
            return log.error('unable to buy:', err);

        callback(null, data.return.order_id);
    };
    set.bind(this);

    // workaround for nonce error
    setTimeout(function() {
        this.wex.trade(this.pair, 'buy', price, amount, _.bind(set, this));
    }.bind(this), 1000);
};

trader.prototype.sell = (amount, price, callback)=> {
    amount = this.round(amount);

    let set = (err, data)=> {
        if(err || !data || !data.return)
            return log.error('unable to sell:\n\n', err);

        callback(null, data.return.order_id);
    };

    // workaround for nonce error
    setTimeout(function() {
        this.wex.trade(this.pair, 'sell', price, amount, _.bind(set, this));
    }.bind(this), 1000);
}

// if the exchange errors we try the same call again after
// waiting 10 seconds
trader.prototype.retry = (method, args)=> {
    let wait = +moment.duration(10, 'seconds');
    log.debug(this.name, 'returned an error, retrying..');

    let self = this;

    // run the failed method again with the same
    // arguments after wait
    setTimeout(
        function() { method.apply(self, args) },
        wait
    );
};
