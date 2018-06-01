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
        this.isDeactivating = true

        log.debug("attempting to stop Trade class from", this.action + "ING", this.asset + "/" + this.currency)

        let done = () => {
            this.isActive = false
            log.debug("successfully stopped Trade class from", this.action + "ING", this.asset + "/" + this.currency)
            if (_.isFunction(callback))
                callback()
        }

        if (_.size(this.orderIds)) {
            this.cancelLastOrder(done)
        } else {
            done()
        }
    }


