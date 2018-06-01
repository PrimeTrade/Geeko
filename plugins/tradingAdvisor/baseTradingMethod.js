let _ = require('lodash');
let fs = require('fs');
let util = require('../../core/util');
let config = util.getConfig();
let dirs = util.dirs();
let log = require(dirs.core + 'log');

let ENV = util.gekkoEnv();
let mode = util.gekkoMode();
let startTime = util.getStartTime();

let talib = require(dirs.core + 'talib');
if(talib == null)
{
log.warn('Unavailable TALIB indicators,could not be loaded');
}

let tulind = require(dirs.core + 'tulind');
if(tulind == null)
{
log.warn('Unavailable TULIND indicators,could not be loaded');
}

let indicatorsPath = dirs.methods + 'indicators/';
let indicatorFiles = fs.readdirSync(indicatorsPath);
let indicators = {};

_.each(indicatorFiles, function(indicator){
const indicatorName = indicator.split(".")[0];
if(indicatorName[0] != "_")
try{
indicators[indicatorName] = require(indicatorsPath + indicator);
}
catch(e)
{
log.error("Failed to load indicator",indicatorName);
}
});

let allowedIndicators = _.keys[Indicators];
let allowedTalibIndicators = _.keys[talib];
let allowedTulindIndicators = _.keys[tulind];

let Base = function(settings){
_.bindAll(this);

this.age = 0;
this.processedTicks = 0;
this.setup = false;
this.settings = settings;
this.tradingAdvisor = config.tradingAdvisor;

this.requiredHistory = 0;
this.priceValue = 'close';
this.indicators = {};
this.talibIndicators = {};
this.tulipIndicators = {};
this.asyncTick = false;
this.candlePropsCacheSize = 1000;
this.deferredTicks = [];

this._prevAdvice;

this.candleProps = {
open: [],
close: [],
high: [],
low: [],
volume: [],
vwp: [],
trades: []
};

_.each(['init', 'check']),function (fn) {
    if(!this[fn]){
    util.die('No' +fn + 'function in this trading method found')},this);
if(!this.update)
    this.update = function () {

    };
if(!this.end)
    this.end = function () {

    };
if(!this.onTrade)
    this.onTrade = function () {

    };
this.init();
if(!config.debug ||  !this.log)
    this.log = function () {

    };
this.setup = true;
if(_.size(this.talibIndicators) || _.size(this.tulipIndicators))
    this.asyncTick = true;

if(_.size(this.Indicators))
    this.hasSyncIndicators = true;

}
util.makeEventEmitter(Base);

Base.prototype.tick = function (candle) {
    if(
        this.asyncTick && this.hasSyncIndicators && this.age !== this.processedTicks;
){
        return this.deferredTicks.push(candle);
    }
    this.age++;

    if(this.asyncTick){
        this.candleProps.open.push(candle.open);
        this.candleProps.high.push(candle.high);
        this.candleProps.low.push(candle.low);
        this.candleProps.close.push(candle.close);
        this.candleProps.volume.push(candle.volume);
        this.candleProps.vwp.push(candle.vwp);
        this.candleProps.trades.push(candle.trades);

        if(this.age > this.candlePropsCacheSize){
            this.candleProps.open.shift();
            this.candleProps.high.shift();
            this.candleProps.low.shift();
            this.candleProps.close.shift();
            this.candleProps.volume.shift();
            this.candleProps.vwp.shift();
            this.candleProps.trades.shift();

        }
    }
    let price = candle[this.priceValue];
    _.each(this.indicators,function (i) {
        if(i.input === 'price')
            i.update(price);
        if(i.input === 'candle')
            i.update(candle);

    },this);
    if(!this.asyncTick){
        this.propogateTick(candle);
        else
        {
            let next = _.after(
                _.size(this.talibIndicators) + _.size(this.tulipIndicators),
                () => this.propogateTick(candle)
            );

            let basectx = this;
            let talibResultHandler = function (err,result) {
                if(err)
                    util.die('TALIB ERROR: ', err);
                this.result = _.mapValues(result, v => _.last(v));
                next(candle);
            }
            _.each(this.talibIndicators,
                indicator => indicator.run(
                    basectx.candleProps,
                    talibResultHandler.bind(indicator)
                ));

            let tulindResultHandler = function (err,result) {
                if(err)
                    util.die('TULIP ERROR: ',err);
                this.result = _.mapValues(result, v => _.last(v));
                next(candle);
            }
            _.each(
                this.tulipIndicators,
                indicator => indicator.run(
                    basectx.candleProps,
                    tulindResultHandler.bind(indicator)
                )
            );
        }
        this.propogateCustomCandle(candle);
    }
    
}
}