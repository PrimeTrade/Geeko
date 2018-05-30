//Fetching new market data at the exchange on interval.
let _ = require('lodash');
let moment = require('moment');
let utc = moment.utc;
let util = require(__dirname + '/../util');
let config = util.getConfig();
let log = require(util.dirs().core +'log');
let exchangeChecker = require(util.dirs().core + 'exchangeChecker');
let tradeBatcher = require(util.dirs().budfox + 'tradeBatcher');
let  Fetcher = function (config) {
    if(!_.isObject(config))
        throw 'Tradefetcher expects a config';
    let exchangeN = config.watch.exchange.toLowerCase();
    let DataProvider = require(util.dirs().gekko + 'exchanges/' + exchangeName);
    _.bindAll(this);
    //Create a public data provider object which can retrieve live  trade information from an exchange
    this.exchangeTrader =new DataProvider(config.watch);
    this.exchange = exchangeChecker.settings(config.watch);
    let requiredHistory = config.tradingAdvisor.candleSize * config.tradingAdvisor.historySize;
//Trading advisor is enabled we might need a very specific fetch
    if(config.tradingAdvisor.enabled && config.tradingAdvisor.firstFetchSince){
        this.firstSince = config.tradingAdvisor.firstFetchSince;

        if(this.exchange.providesHistory === 'date'){
            this.firstSince = moment.unix(this.firstSince).utc();
        }
    }
    this.batcher = new TradeBatcher(this.exchange.tid);

    this.pair = [
        config.watch.asset,
        config.watch.currency
    ].join('/');
//if exchanges returns an error we will keep on retrying until next scheduled fetch
    this.tries = 0;
    this.limit = 20;
    log.info('Starting to watch the market: ',
    this.exchange.name,
    this.pair
    );
    this.tries = 0;
    this.limit = 20;

    this.firstFetch = true;
    this.batcher.on('new batch', this.relayTrades);


}
util.makeEventEmitter(Fetcher);

Fetcher.prototype._fetch = function (since) {
    if(++this.tries >= this.limit)
        return;
    this.exchangeTrader.getTrades(since, this.processTrades,false);
}
Fetcher.prototype.fetch = function () {
    let since = false;
    if(this.firstFetch){
        since = this.firstSince;
        this.firstFetch = false;

    }
    else
        since = false;
    this.tries = 0;
    this.fetch(since);
}
Fetcher.prototype.processTrades = function (err,trades) {
    if(err || _.isEmpty(trades))
    {
        if(err)
        {
            log.warn(this.exchange.name, 'returned an error while fetching trades: ',err);
            log.debug('refetching...');
        }
        else
        log.debug('Trade fetch came back empty, refetching... ');
        setTimeout(this.fetch, +moment.duration('sec',1));
        return;
    }
    this.batcher.write(trades);
}
Fetcher.prototype.relayTrades = function(batch){
    this.emit('batch trades',batch);
}
module.exports = Fetcher;