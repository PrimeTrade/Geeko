let bitstamp = require('bitstamp');
let _ = require('lodash');
let log = require('../core/log');
let moment = require('moment');
let util = require('../core/util');

let trader = (config)=>{
    _.bindAll(this);
    if(_.isObject(config)){
        this.key = config.key;
        this.secret = config.secret;
        this.clientID = config.username;
        this.asset = config.asset.toLowerCase();
        this.currency = config.currency.toLowerCase();
        this.market = this.asset + this.currency;
    }
    this.name = 'Bitstamp';
    this.bitstamp = new bitstamp(this.key, this.secret, this.clientID);
}

//if exchange errors we retry again after 10 sec
trader.prototype.retry = (method, args)=>{
    let wait = +moment.duration(10, 'seconds');
    log.debug(this.name, 'returned an error, retrying...');

    let self = this;

    _.each(args, (arg, i)=>{
        if(_.isFunction(arg))
            args[i] = _.bind(arg, self);
    });
    setTimeout(
        ()=>{
            method.apply(self, args)
        },
        wait
    );
};
trader.prototype.getPortfolio = (callback)=>{
    let args = _.toArray(arguments);
    let set = (err, data)=>{
        if(data && data.error){
            err = data.error;
        }
        if(err){
            if(err.meta && err.meta.reason === 'API key not found')
                util.die('Bitstamp says this API keys is invalid..');
            log.error('BITSTAMP API ERROR:', err);
            return this.retry(this.getPortfolio, args);
        }
        let portfolio = [];
        _.each(data, (amount, asset)=>{
            if(asset.indexOf('available') !== -1){
                asset = asset.substr(0, 3).toUpperCase();
                portfolio.push({name: asset, amount: parseFloat(amount)});
            }
        });
        callback(err, portfolio);
    };
    set.bind(this);
    this.bitstamp.balance(this.market, set);
};

trader.prototype.getTicker = (callback)=>{
    this.bitstamp.ticker(this.market, callback);
};


