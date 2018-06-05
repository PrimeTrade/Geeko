let util = require('../../core/util');
let _ = require('lodash');
let fs = require('fs');
let toml = require('toml');

let config = util.getConfig();
let dirs = util.dirs();
let log = require(dirs.core + 'log');
let candleBatcher = require(dirs.core + 'candleBatcher');

let moment = require('moment');
let isLeecher = config.market && config.market.type === 'leech';

let Actor = function (done) {
    _.bindAll(this);

    this.done = done;
    this.batcher = new CandleBatcher(config.tradingAdvisor.candleSize);
    this.methodName = config.tradingAdvisor.method;
    this.setupTradingMethod();

    let mode = gekkoMode();
    if(mode === 'realTime' && !isLeecher){
        let Stitcher = require(dirs.tools + 'dataStitcher');
        let stitcher = new Stitcher(this.batcher);
        stitcher.prepareHistoricalData(done);
    }
    else

        done();
    }

    util.makeEventEmitter(Actor);
    Actor.prototype.setupTradingMethod = function () {
        if(!fs.existsSync(dirs.methods + this.methodName + '.js'))
            util.die('Geeko can\'t find the strategy " ' +this.methodName + ' " ');

        log.info('\t', 'Using the strategy: ' +this.methodName);

        let method = require(dirs.methods + this.methodName);
        let consultant = require('./baseTradingMethod');
        _.each(method, function (fn,name) {
            Consultant.prototype[name] = [fn];
        });

        if(config[this.methodName]){
            let tradingSettings = config(this.methodName);
            }
            this.method = new Consultant(tradingSettings);
            this.method.on('advice', this.relayAdvice);
            this.method.on('trade', this.processTrade);
            this.batcher.on('candle', this.processCustomCandle);

    }
    //Handlers
    Actor.prototype.processCandle = function (candle,done) {
        this.batcher.write([candle]);
        done();
    }
    Actor.prototype.processCustomCandle = function (candle) {
        this.method.tick(candle);
    }
    Actor.prototype.processTrade = function (trade) {
        this.method.processTrade(trade);
    }
    Actor.prototype.finish = function (done) {
        this.method.finish(done);
    }

    Actor.prototype.relayAdvice = function (Advice) {
        this.emit('advice',advice);
    }
