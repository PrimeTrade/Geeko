let _ = require('lodash');
let util = require('../../core/util');
let dirs = util.dirs();
let events = require('events');
let log = require(dirs.core + 'log');
let async = require('async');
let checker = require(dirs.core + 'exchangeChecker.js');
let moment = require('moment');

class Trade {
    constructor(conf){
        this.conf;
        this.exchange = conf.exchange;
        this.portfolio = conf.portfolio;
        this.currency = conf.currency;
        this.asset = conf.asset;
        this.action = conf.action;
        this.isActive = true;
        this.isDeactivating = false;
        this.orderIds = [];
        this.exchangeMeta = checker.settings({exchange: this.exchange.name});
        this.marketConfig = _.find(this.exchangeMeta.markets, function (p) {
            return _.first(p.pair) === conf.currency.toUpperCase() && _.last(p.pair) === conf.asset.toUpperCase();
        });
        this.minimalOrder = this.marketConfig.minimalOrder;
        log.debug("Created new Trade class to ", this.action, this.asset + "/" + this.currency);
        if(_.isNumber(conf.keepAsset)) {
            log.debug('keep asset is active. will try to keep at least ' + conf.keepAsset + ' ' + conf.asset);
            this.keepAsset = conf.keepAsset;
        } else {
            this.keepAsset = 0;
        }

        this.doTrade()
    }

    deactivate(callback) {
        this.isDeactivating = true;

        log.debug("attempting to stop Trade class from", this.action + "ING", this.asset + "/" + this.currency)

        let done = () => {
            this.isActive = false;
            log.debug("successfully stopped Trade class from", this.action + "ING", this.asset + "/" + this.currency)
            if (_.isFunction(callback))
                callback();
        }

        if (_.size(this.orderIds)) {
            this.cancelLastOrder(done)
        } else {
            done()
        }
    }
    doTrade(retry){
        if(!this.isActive || this.isDeactivating)
            return false;
        if(!retry && _.size(this.orderIds))
            return this.cancelLastOrder(() => this.doTrade());
        let act = () => {
            let amount,price;
            if(this.action === 'BUY'){
                amount = this.portfolio.getBalance(this.currency) / this.portfolio.ticker.ask;
                if(amount>0){
                    price = this.portfolio.ticker.bid;
                    this.buy(amount,price);

                }
            }
            else if (this.action === 'SELL'){
                amount = this.portfolio.getBalance(this.asset) -this.keepAsset;
                if(amount > 0){
                    price = this.portfolio.ticker.ask;
                    this.sell(amount,price);
                }
            }
        }
        async.series([
            this.portfolio.setTicker.bind(this.portfolio),
            this.portfolio.setPortfolio.bind(this.portfolio),
            this.portfolio.setFee.bind(this.portfolio),

        ],act);
    }
}


