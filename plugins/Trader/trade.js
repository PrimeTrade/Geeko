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
    buy(amount,price){
        let minimum = 0;
        let process = (err,order) => {
            if(!this.isActive || this.isDeactivating){
                return log.debug(this.action,"trade class is no longer active");
            }
            if(!order.amount || order.amount <minimum){
                return log.warn('wanted to buy',this.asset,'but the amount is too small','(' +parseFloat(amount).toFixed(8) + '.@',parseFloat(price).toFixed(8),') at',
                    this.exchange.name);

            }
            log.info(
                'attempting to BUY',
                order.amount,
                this.asset,
                'at',
                this.exchange.name,
                'price:',
                order.price
            );

            this.exchange.buy(order.amount,order.price,_bind(this.noteOrder,this));

        }
        if (_.has(this.exchange, 'getLotSize')) {
            this.exchange.getLotSize('buy', amount, price, _.bind(process));
        } else {
            minimum = this.getMinimum(price);
            process(undefined, { amount: amount, price: price });
        }
    }
    sell(amount, price) {
        let minimum = 0;
        let process = (err, order) => {

            if(!this.isActive || this.isDeactivating){
                return log.debug(this.action, "trade class is no longer active")
            }
        if(!order.amount || order.amount  < minimum)
        {
        return log.warn('wanted to sell',this.currency,'but the amount is too small', '(' +parseFloat(amount).toFixed(8) + '@', parseFloat(price)
            .toFixed(8), ') at', this.exchange.name);
        }
        log.info('attempting to SELL',order.amount,this.asset,'at',this.exchange.name,'price: ',order.price);
            this.exchange.sell(order.amount,order.price,_.bind(this.noteOrder,this));
        }
        if(_.has(this.exchange, 'getLotSize')){
            this.exchange.getLotSize('sell',amount,price,_.bind(process));

        }
        else {
            minimum = this.getMinimum(price);
            process(undefined,{ amount: amount,price: price});
        }

        }
        checkOrder(){
        let handleCheckResult = function (err,filled) {
            if(this.isDeactivating){
                return log.debug("trade: checkOrder(): ",this.action, "currently trade class is deactivating,stop check order");
                }
                if(!this.isActive){
                return log.debug("trade: checkOrder(): ",this.action, "trade class is no longer active,stop check order");
                }
                if(!filled){
                log.info(this.action, 'order was not fully filled,cancelling and creating new order');
                log.debug("trade: checkOrder(): ",this.action + "order ID: ", _.last(this.orderIds));
                this.exchange.cancelOrder(_.last(this.orderIds),_.bind(handleCancelResult,this));
                return;
                }
                log.info("Trade was successful",this.action + "ING",this.asset + "/" + this.currency);
                this.isActive = false;
                this.relayOrder();
                }
                let handleCancelRequest = function (alreadyFilled) {
                    if(alreadyFilled)
                        return;
                    if(this.exchangeMeta.forceReorderDelay){
                    let wait = 10;
                    log.debug(`Waiting ${wait} seconds before starting a new trade on ${this.exchangeMeta.name}!`);
                    setTimeout(
                        () => this.doTrade(true), +moment.duration(wait,'seconds')
                    );
                    return;
                    }
                    this.doTrade(true);
                }
                this.exchange.checkOrder(_.last(this.orderIds),_.bind(handleCheckResult,this));

        }
        cancelLastOrder(done){
        log.debug("trade: cancelLastOrder(): cancelling last "+ this.action + "order ID: ",_.last(this.orderIds));
        this.exchange.cancelOrder(_.last(this.orderIds), alreadyFilled => {
            if(alreadyFilled)
                return this.relayOrder(done);
            done();
        });
        }
        noteOrder(err,order){
        if(err){
            util.die(err);
        }
        this.orderIds.push(order);
        let cancelDelay = this.conf.orderUpdateDelay || 1;
        setTimeout(_.bind(this.checkOrder,this), util.minToMs(cancelDelay));

        }
        relayOrder(done){
    let relay = (err,res) => {
        let price = 0;
        let amount = 0;
        let date = moment(0);
        _.each(res.filter(o => !_.isUndefined(0) && o.amount), order => {
            date = _.max([moment(order.date), date]);
            price = ((price * amount) + (order.price * order.amount)) / (order.amount + amount);
            amount += +order.amount;
        });
        async.series([
            this.portfolio.setTicker.bind(this.portfolio),
            this.portfolio.setPortfolio.bind(this.portfolio)
        ], () => {
            const portfolio = this.portfolio.convertPortfolio(this.asset, this.currency);

            this.emit('trade', {
                date,
                price,
                portfolio: portfolio,
                balance: portfolio.balance,
                action: this.action.toLowerCase(),
            });
            if (_.isFunction(done))
                done();
        });



    let getOrders = _.map(
        this.orderIds,
        order => next => this.exchange.getOrder(order, next)
    );

    async.series(getOrders, relay);
}

getMinimum(price){
    if(this.minimalOrder.unit === 'currency')
        return this.minimalOrder.amount / price;
    else
        return this.minimalOrder.amount;
}
}

util.makeEventEmitter(Trade)

module.exports = Trade

