let _ = require('lodash');
let moment = require('moment');
let Bittrex = require('node.bittrex.api');
let util = require('../core/util');
let log = require('../core/log');

let joinCurrencies = (currencyA, currencyB)=>{
    return currencyA + '-' + currencyB;
};

let trader = (config)=>{
    _.bindAll(this);
    if(!config.key){
        //no api key defined so we set dummy key to start Bittrex module
        config.key = 'dummy';
        config.secret = 'dummy';
    }
    if(_.isObject(config)){
        this.key = config.key;
        this.secret = config.secret;
        this.currency = config.currency;
        this.asset = config.asset;
    }
    this.name = 'Bittrex';
    this.balance = undefined;
    this.price = undefined;
    this.pair = [this.currency, this.asset].join('-');

    Bittrex.options({
        'apikey': this.key,
        'apisecret': this.secret,
        'stream': false,
        'verbose': false,
        'cleartext': false
    });
    log.debug('Init', 'NEw Bittrex Trader', {currency: this.currency, asset: this.asset});
    this.bittrexApi = Bittrex;
};
trader.prototype.retry = (method, args)=> {
    let wait = +moment.duration(10, 'seconds');
    log.debug(this.name, 'returned an error, retrying.', args);

    let self = this;


    _.each(args, (arg, i)=> {
        if(_.isFunction(arg))
            args[i] = _.bind(arg, self);
    });

    //run again after some wait
    setTimeout(
        function() { method.apply(self, args) },
        wait
    );
};

trader.prototype.getPortfolio = (callback)=> {
    let args = _.toArray(arguments);
    log.debug('getPortfolio', 'called');

    let set = (data, err)=> {
        if(err) {
            log.error('getPortfolio', 'Error', err);
            return this.retry(this.getPortfolio, args);
        }
        data = data.result;
        let assetEntry = _.find(data, function(i) { return i.Currency === this.asset}.bind(this));
        let currencyEntry = _.find(data, function(i) { return i.Currency === this.currency}.bind(this));

        if(_.isUndefined(assetEntry)) {
            assetEntry = {
                Available: 0.0,
                Currency: this.asset
            }
        }
        if(_.isUndefined(currencyEntry)) {
            currencyEntry = {
                Available: 0.0,
                Currency: this.currency
            }
        }
        let assetAmount = parseFloat( assetEntry.Available );
        let currencyAmount = parseFloat( currencyEntry.Available );

        if(
            !_.isNumber(assetAmount) || _.isNaN(assetAmount) ||
            !_.isNumber(currencyAmount) || _.isNaN(currencyAmount)
        ) {
            log.info('asset:', this.asset);
            log.info('currency:', this.currency);
            log.info('exchange data:', data);
            util.die('Gekko was unable to set the portfolio');
        }

        let portfolio = [
            { name: this.asset, amount: assetAmount },
            { name: this.currency, amount: currencyAmount }
        ];

        log.debug('getPortfolio', 'result:', portfolio);

        callback(err, portfolio);
    };
    set.bind(this);

    this.bittrexApi.getbalances(set);
};
