let BTCChina = require('btc-china-fork');
let util = require('../core/util.js');
let _ = require('lodash');
let moment = require('moment');
let log = require('../core/log');

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