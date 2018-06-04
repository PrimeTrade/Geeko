let _  = require('lodash');
let util = require('../../core/util');
let dirs = util.dirs();
let events = require('events');
let log = require(dirs.core + 'log');
let async = require('async');

class Portfolio {
    constructor(conf,exchange){
        _.bindAll(this);
        this.conf = conf;
        this.exchange = exchange;
        this.portfolio = {};
        this.fee = null;
        this.ticker = null;
    }
    getBalance(fund){
        return this.getFund(fund).amount;
    }
    getFund(fund){
        return _.find(this.portfolio,function (f) {
            return f.name === fund
        });

    }
    convertPortfolio(asset,currency){
        let asset = _.find(this.portfolio, a => a.name === this.conf.asset).amount;
        let currency = _.find(this.portfolio, a=> a.name === this.conf.currency).amount;

        return{
            currency,
            asset,
            balance: currency + (asset * this.ticker.bid)
        }
    }
    logPortfolio(){
        log.info(this.exchange.name, 'portfolio: ');
        _.each(this.portfolio,function (fund) {
            log.info('\t', fund.name + ':' , parseFloat(fund.amount).toFixed(12));
        });
    };
    setPortfolio(callback){
        let set = (err,fullPortfolio) => {
            if(err)
                util.die(err);
            const portfolio = [this.conf.currency, this.conf.asset]
                .map(name => {
                    let item = _.find(fullPortfolio, {name});
                    if(!item)
                    {
                        log.debug(`Unable to find "${name}" in portfolio by exchange,assuming 0. `);
                        item = {name, amount: 0};

                    }
                    return item;
                });
            if(_.isEmpty(this.portfolio)){
                this.portfolio = portfolio;
                this.emit('portfolioUpdate', this.convertPortfolio(this.conf.asset,this.conf.currency,this.ticker.bid));

            }
            this.portfolio = portfolio;
            if(_.isFunction(callback))
                callback();

        }
        this.exchange.getPortfolio(set);

    }
    setFee(callBack){
        let set = (err,fee) => {
            this.fee = fee;
            if(err)
                util.die(err);
            if(_.isFunction(callBack))
                callBack();
        }
        this.exchange.getFee(set);
    }
    setTicker(callBack){
        let set = (err,ticker) => {
            this.ticker = ticker;
            if(err)
                util.die(err);
            if(_.isFunction(callBack))
                callBack();
        }
        this.exchange.getTicker(set);

    }

}
util.makeEventEmitter(Portfolio);
module.exports = Portfolio;
