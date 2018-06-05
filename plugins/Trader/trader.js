let _ = require('lodash');
let util = require('../../core/util.js');
let config = util.getConfig();
let dirs = util.dirs();

let log = require(dirs.core + 'log');
let Manager = require('./portfolioManager');

let Trader = function (next) {
    _.bindAll(this);
    this.manager = new Manager(_.extend(config.trader,config.watch));
    this.manager.init(next);
    let sendPortfolio = false;
    this.manager.on('trade', trade => {
        if(!sendPortfolio && this.initialPortfolio){
            this.emit('portfolioUpdate', this.initialPortfolio);
            sendPortfolio = true;
        }
        this.emit('trade',trade);
    });
    this.manager.once('portfolioUpdate',portfolioUpdate => {
        this.initialPortfolio = portfolioUpdate;
    })
}
util.makeEventEmitter(Trader);
Trader.prototype.processCandle = (candle, done) => done();
Trader.prototype.processAdvice = function (advice) {
    if (advice.recommendation === 'long'){
        log.info(
            'Trader',
            'Received advice to go long.',
            'Buying ', config.trader.asset
        );
        this.manager.trade('BUY');
    } else if(advice.recommendation == 'short'){
        log.info(
            'Trader',
            'Received advice to go short.',
            'Selling ', config.trader.asset
        );
        this.manager.trade('SELL');
    }
}
module.exports = Trader;
