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

trader.prototype.getTicker = (callback)=>{
    let args = _.toArray(arguments);
    log.debug('getTicker', 'called');
    this.bittrexApi.getTicker({market: this.pair}, function(data, err){
        if(err)
            return this.retry(this.getTicker, args);
        let tick = data.result;
        log.debug('getTicker', 'result', tick);
        callback(null, {
            bid: parseFloat(tick.Bid),
            ask: parseFloat(tick.Ask)
        })
    }.bind(this));
};

trader.prototype.getFee = (callback)=>{
    log.debug('getFee', 'called');
    callback(false, 0.00025);
};

trader.prototype.buy = (amount, price, callback)=>{
    let args = _.toArray(arguments);
    log.debug('buy', 'called', {amount: amount, price: price});
    let set = (result, err)=>{
        if(err || result.error){
            if(err && err.message === 'INSUFFICIENT_FUNDS'){
                //retry with reduced amount, will be reduced again in the recursive call
                log.error('Error buy ', 'INSUFFICIENT FUNDS', err);
                // correct the amount to avoid an INSUFFICIENT_FUNDS exception
                let correctedAmount = amount - (0.00255*amount);
                log.debug('buy', 'corrected amount', {amount: correctedAmount, price: price});
                return this.retry(this.buy, [correctedAmount, price, callback]);
            } else if (err && err.message === 'DUST_TRADE_DISALLOWED_MIN_VALUE_50K_SAT') {
                callback(null, 'dummyOrderId');
                return;
            }
            log.error('unable to buy:', {err: err, result: result});
            return this.retry(this.buy, args);
        }

        log.debug('buy', 'result', result);
        callback(null, result.result.uuid);
    };
    set.bind(this);

    this.bittrexApi.buylimit({market: this.pair, quantity: amount, rate: price}, set);
};

trader.prototype.sell = (amount, price, callback)=> {
    let args = _.toArray(arguments);

    log.debug('sell', 'called', {amount: amount, price: price});

    let set = (result, err)=> {
        if(err || result.error) {
            log.error('unable to sell:',  {err: err, result: result});

            if(err && err.message === 'DUST_TRADE_DISALLOWED_MIN_VALUE_50K_SAT') {
                callback(null, 'dummyOrderId');
                return;
            }

            return this.retry(this.sell, args);
        }

        log.debug('sell', 'result', result);

        callback(null, result.result.uuid);
    };
    set.bind(this);

    this.bittrexApi.selllimit({market: this.pair, quantity: amount, rate: price}, set);
};

trader.prototype.checkOrder = (order, callback)=> {
    let check = (result, err)=> {
        log.debug('checkOrder', 'called');

        let stillThere = _.find(result.result, function(o) { return o.OrderUuid === order });

        log.debug('checkOrder', 'result', stillThere);
        callback(err, !stillThere);
    };
    check.bind(this);

    this.bittrexApi.getopenorders({market: this.pair}, check);
};
