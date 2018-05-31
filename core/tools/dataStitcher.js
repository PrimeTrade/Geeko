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
        let minuteAgo = endTime.diff(idealExchangeStartTime, 'minutes');
        let maxMinutesAgo = 4*60;
        if(minuteAgo > maxMinutesAgo)
        {
            log.info('\t Preventing Geeko from requesting', minuteAgo, 'minutes of history');
            idealExchangeStartTime = endTime.clone().subtract(maxMinutesAgo, 'minutes');
            idealExchangeStartTimeTS = idealExchangeStartTime.unix();

        }
        log.debug('\t Fetching exchange data since', this.ago(idealExchangeStartTimeTS))
        this.checkExchangeTrades(idealExchangeStartTime, function (err,exchangeData) {
            log.debug('\t Available exchange data: ');
            log.debug('\t\t from: ', this.ago(exchangeData.from));
            log.debug('\t\t to: ',this.ago(exchangeData.to));

            if(localData && exchangeData && exchangeData.from < localData.from){
                log.debug('Exchange offer more data than locally available. Ignoring local data');
                localData = false;
            }
            let stitchable = localData && exchangeData.from <= localData.to ;
            if(stitchable){
                log.debug('\t Stitching datasets');
                if(idealStartTime.unix() >= localData.from){
                    log.info(
                        '\t Full history locally available'
                    );

                }
                else {
                    log.info(
                        '\tPartial history locally available, but',
                        Math.round((localData.from - idealStartTime.unix()) / 60),
                        'minutes are missing.')
                    log.info('\tSeeding the trading method with',
                        'partial historical data (Geeko needs more time before',
                        'it can give advice).'
                    );
                }
                let from = localData.from;
                let to = moment.unix(exchangeData.from).utc()
                    .startOf('minute')
                    .subtract(1, 'minute')
                    .unix();

                log.debug('\tSeeding with:');
                log.debug('\t\tfrom:', this.ago(from));
                log.debug('\t\tto:', this.ago(to));
                return this.seedLocalData(from, to, done);

            } else if(!stitchable) {
                log.debug('\tUnable to stitch datasets.')

                log.info(
                    '\tNot seeding locally available data to the trading method.'
                );

                if(exchangeData.from < idealExchangeStartTimeTS) {
                    log.info('\t Exchange returned enough data!');
                } else if(localData) {
                    log.info(
                        '\tThe exchange does not return enough data.',
                        Math.round((localData.from - idealStartTime.unix()) / 60),
                        'minutes are still missing.'
                    );
                }
            }

            done();

        }.bind(this));
    }.bind(this));
}

Stitcher.prototype.checkExchangeTrades = function(since, next) {
    let provider = config.watch.exchange.toLowerCase();
    let DataProvider = require(util.dirs().gekko + 'exchanges/' + provider);

    let exchangeConfig = config.watch;


    if (_.isObject(config.trader) && config.trader.enabled) {
        exchangeConfig = _.extend(config.watch, config.trader);
    }

    let watcher = new DataProvider(exchangeConfig);

    watcher.getTrades(since, function(e, d) {
        if(_.isEmpty(d))
            return util.die(
                `Geeko tried to retrieve data since ${since.format('YYYY-MM-DD HH:mm:ss')}, however
        ${provider} did not return any trades.`
            );

        next(e, {
            from: _.first(d).date,
            to: _.last(d).date
        })
    });
}

Stitcher.prototype.seedLocalData = function(from, to, next) {
    this.reader.get(from, to, 'full', function(err, rows) {
        rows = _.map(rows, row => {
            row.start = moment.unix(row.start);
            return row;
        });

        this.batcher.write(rows);
        this.reader.close();
        next();

    }.bind(this));
}

module.exports = Stitcher;
