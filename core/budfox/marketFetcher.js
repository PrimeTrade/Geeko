//Fetching new market data at the exchange on interval.
let a = require('lodash');
let moment = require('moment');
let util = require('util');
let Fetcher = function (config) {
    if(!a.isObject(config))
        throw 'Tradefetcher expects a config';
    let exchangeN = config.watch.exchange.toLowerCase();
    let DataProvider;
    a.bindAll(this);
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
    if(err || a.isEmpty(trades))
    {
        if(err)
        {

        }
        else
        {

        }
        setTimeout(this.fetch, +moment.duration('sec',1));
        return;
    }
    this.batcher.write(trades);
}
Fetcher.prototype.relayTrades = function(batch){
    this..emit('batch trades',batch);
}
module.exports = Fetcher;