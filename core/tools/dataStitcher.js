let _ = require('lodash');
let fs = require('fs');
let moment = require('moment');

let util = require('../../core/util');
let config = util.getConfig();
let dirs = util.dirs();
let log = require(dirs.core + '/log');

let Stitcher = function (batcher) {
    this.batcher = batcher;
}

Stitcher.prototype.ago = function (ts) {
    let now = moment().utc();
    let then = moment.unix(ts).utc();
    return now.diff(then, 'minutes') + 'minutes ago';

}

Stitcher.prototype.verifyExchange = function () {
    let exchangeChecker = require(dirs.core + 'exchangeChecker');
    let slug = config.watch.exchange.toLowerCase();
    let exchange = exchangeChecker.getExchangeCapabilities(slug);

    if(!exchange)
        util.die(`Unsupported exchange: ${slug}`);

    let error = exchangeChecker.cantMonitor(config.watch);
    if(error)
        util.die(error,true);
}
Stitcher.prototype.prepareHistoricalData = function(done){
    this.verifyExchange();
    if(config.tradingAdvisor.historySize === 0)
        return done();

    let requiredHistory = config.tradingAdvisor.candleSize * config.tradingAdvisor.historySize;
    let Reader = require(dirs.plugins + config.adapter + '/reader');
    this.reader = new Reader;

    log.info(
        '\t The trading method requests',
        requiredHistory,
        'minutes of historic data. Checking availability'
    );
    let endTime = moment().utc().startOf('minute');
    let idealStartTime = endTime.clone().subtract(requiredHistory,'min');

    this.reader.mostRecentWindow(idealStartTime,endTime,function (localData) {
        if(!localData)
        {
            log.info('\t No usable local data variable, trying to get as much as possible from an exchange');
            let idealExchangeStartTime = idealStartTime.clone();
            let idealExchangeStartTimeTS = idealExchangeStartTime.unix();

        }
        else if(idealStartTime.unix() < localData.from)
        {
            log.info('\t Local data is still too recent, trying to get as much as possible from an exchange');
            let idealExchangeStartTime = idealStartTime.clone();
            let idealExchangeStartTimeTS = idealExchangeStartTime.unix();
        }
        else{
            log.debug('\t Available local data: ');
            log.debug('\t \t from: ', this.ago(localData.from));
            log.debug('\t \t to: ',this.ago(localData.to));

            log.info('\t Usable local data available, trying to match with exchange data');

            let secondsOverlap = 60 * 15;
            let idealExchangeStartTimeTS = localData.to - secondsOverlap;
            let idealExchangeStartTime = moment.unix(idealExchangeStartTimeTS).utc();


            util.setConfigProperty(
                'tradingAdvisor',
                'firstFetchSince',
                idealExchangeStartTimeTS
            );
        }

    })
}
