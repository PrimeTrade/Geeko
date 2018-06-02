const _ = require('lodash');
const moment = require('moment');

const stats = require('../../core/stats');
const util = require('../../core/util');
const ENV = util.gekkoEnv();

const config = util.getConfig();
const perfConfig = config.performanceAnalyzer;
const watchConfig = config.watch;

let Handler;
if(ENV === 'child-process')
    Handler = require('./cpRelay');
else
    Handler = require('./logger');

const PerformanceAnalyzer = function() {
    _.bindAll(this);

    this.dates = {
        start: false,
        end: false
    }

    this.startPrice = 0;
    this.endPrice = 0;

    this.currency = watchConfig.currency;
    this.asset = watchConfig.asset;

    this.handler = new Handler(watchConfig);

    this.trades = 0;

    this.sharpe = 0;

    this.roundTrips = [];
    this.roundTrip = {
        id: 0,
        entry: false,
        exit: false
    }
}
PerformanceAnalyzer.prototype.processCandle = function(candle, done) {
    this.price = candle.close;
    this.dates.end = candle.start;

    if(!this.dates.start) {
        this.dates.start = candle.start;
        this.startPrice = candle.close;
    }

    this.endPrice = candle.close;

    done();
}

PerformanceAnalyzer.prototype.processPortfolioUpdate = function(portfolio) {
    this.start = portfolio;
    this.current = _.clone(portfolio);
}

PerformanceAnalyzer.prototype.processTrade = function(trade) {
    this.trades++;
    this.current = trade.portfolio;

    const report = this.calculateReportStatistics();
    this.handler.handleTrade(trade, report);

    this.logRoundtripPart(trade);
}
