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
    
}