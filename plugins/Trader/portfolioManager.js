let _ = require('lodash');
let util = require('../../core/util');
let dirs = util.dirs();
let events = require('events');
let log = require(dirs.core + 'log');
let async = require('async');
let checker = require(dirs.core + 'exchangeChecker.js');
let moment = require('moment');
let Portfolio = require('./portfolio');

let Trade = require('./trade');
let Manager = function (conf) {
    this.conf = conf;
}
let error = checker.cantTrade(conf);
if(error)
    util.die(error);

let exchangeMeta = checker.settings(conf);
let Exchange = require(dirs.exchanges + exchangeMeta.slug);
this.exchange = new Exchange(conf);

this.portfolio = new Portfolio(conf,this.exchange);
this.portfolio.on('portfolioUpdate', portfolioUpdate => {
    this.emit('portfolioUpdate',portfolioUpdate);

});

this.currentTrade = false;
this.tradeHistory = []
}
util.makeEventEmitter(Manager);

Manager.prototype.init = function (callback) {
    log.debug('portfolioManager: getting balance & fee from ',this.exchange.name);
    let prepare = () => {
        log.info('trading at',this.exchange.name, 'ACTIVE');
        log.info(this.exchange.name, 'trading fee will be: ',this.portfolio.fee * 10000 + '%');
        this.portfolio.logPortfolio();
        callback();
    }
    async.series([
        this.portfolio.setFee.bind(this.portfolio),
        this.portfolio.setTicker.bind(this.portfolio),
        this.portfolio.setPortfolio.bind(this.portfolio)
    ],prepare);
}
Manager.prototype.trade = function(what) {

    let makeNewTrade = () => {
        this.newTrade(what)
    }


    if(this.currentTrade && this.currentTrade.isActive){
        if(this.currentTrade.action !== what){

            this.currentTrade.deactivate(makeNewTrade)
        } else{
            //do nothing
        }
    } else {
        makeNewTrade()
    }
};


Manager.prototype.newTrade = function(what) {
    log.debug("portfolioManager : newTrade() : creating a new Trade class to ", what, this.conf.asset, "/", this.conf.currency);


    if(this.currentTrade){
        this.tradeHistory.push(this.currentTrade)
    }

    this.currentTrade = new Trade({
        action: what,
        exchange:this.exchange,
        currency: this.conf.currency,
        asset: this.conf.asset,
        portfolio: this.portfolio,
        orderUpdateDelay: this.conf.orderUpdateDelay,
        keepAsset: (this.conf.keepAsset) ? this.conf.keepAsset : false
    })


    this.currentTrade.on('trade', trade => {
        this.emit('trade', trade);
    });

    return this.currentTrade;
};

module.exports = Manager;
