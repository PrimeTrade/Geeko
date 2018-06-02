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