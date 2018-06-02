let Zaif = require("zaif.jp");
let util = require('../core/util.js');
let _ = require('lodash');
let moment = require('moment');
let log = require('../core/log');

let trader = function(config) {
    _.bindAll(this);
    if(_.isObject(config)) {
        this.key = config.key;
        this.secret = config.secret;
        this.clientID = config.username;
    }
    this.name = 'Zaif';
    this.balance = 0;
    this.price = 0;

    this.zaif = Zaif.createPrivateApi(this.key, this.secret, 'user agent is node-zaif');
    this.api = Zaif.PublicApi;
}

//trying again after 10 seconds
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
        function() { method.apply(self, args) },
        wait
    );
};

trader.prototype.getPortfolio = (callback)=> {
    let set = (data)=> {
        let portfolio = [];
        _.each(data.funds, (amount, asset)=> {
//      if(asset.indexOf('available') !== -1) {
            asset = asset.substr(0, 3).toUpperCase();
            portfolio.push({name: asset, amount: parseFloat(amount)});
//      }
        });
        callback(err, portfolio);
    };
    this.zaif.getInfo().then(_.bind(set, this));
};

trader.prototype.getTicker = (callback)=> {
    this.api.ticker('btc_jpy').then(callback);
};

trader.prototype.getFee = (callback)=> {
    let makerFee = 0.0;
    callback(false, makerFee / 100);
};

trader.prototype.buy = (amount, price, callback)=> {
    let set = (result)=> {
        if(!result)
            return log.error('unable to buy:', result);

        callback(null, result.order_id);
    };

//  amount *= 0.995; // remove fees
    // prevent: Ensure that there are no more than 8 digits in total.
    amount *= 100000000;
    amount = Math.floor(amount);
    amount /= 100000000;
    this.zaif.trade('bid', price, amount).then(_.bind(set, this));
};