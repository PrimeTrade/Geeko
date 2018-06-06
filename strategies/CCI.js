const _ = require('lodash');
const log = require('../core/log');
let method = {
    init: () => {
        this.currentTrend = undefined;
        this.requiredHistory = this.tradingAdvisor.historySize;
        this.age = 0;
        this.trend = {
            direction: undefined,
            duration: 0,
            persisted: false,
            adviced: false
        };
        this.historySize = this.settings.history;
        this.ppoadv = 'none';
        this.uplevel = this.settings.thresholds.up;
        this.downlevel = this.settings.thresholds.down;
        this.persisted = this.settings.thresholds.persistence;

        this.addIndicator('cci', 'CCI', this.settings);
    },
    //on every new candle what happens
    update: (candle) => {
    },
//for debugging log the last calculated EMA's and diff
    log: (candle) => {
        let cci = this.indicators.cci;
        if (typeof(cci.result) === 'boolean') {
            log.debug('Insufficient data available. Age: ', cci.size, ' of ', cci.maxSize);
            return;
        }

        log.debug('calculated CCI properties for candle:');
        log.debug('\t', 'Price:\t\t', candle.close.toFixed(8));
        log.debug('\t', 'CCI tp:\t', cci.tp.toFixed(8));
        log.debug('\t', 'CCI tp/n:\t', cci.avgtp.toFixed(8));
        log.debug('\t', 'CCI md:\t', cci.mean.toFixed(8));
        if (typeof(cci.result) === 'boolean')
            log.debug('\t In sufficient data available.');
        else
            log.debug('\t', 'CCI:\t\t', cci.result.toFixed(2));
    },

    check: (candle) => {
        let lastPrice = candle.close;
        this.age++;
        let cci = this.indicator.cci;
        if (typeof(cci.result) === 'number') {
            //overbought
            if (cci.result >= this.uplevel && (this.trend.persisted || this.persisted === 0) && !this.trend.adviced && this.trend.direction === 'overbought') {
                this.trend.adviced = true;
                this.trend.duration++;
                this.advice('short');
            }
            else if (cci.result >= this.uplevel && this.trend.direction !== 'overbought') {
                this.trend.duration = 1;
                this.trend.direction = 'overbought';
                this.trend.persisted = false;
                this.trend.adviced = false;
                if (this.persisted === 0) {
                    this.trend.adviced = true;
                    this.advice('short');
                }
            } else if (cci.result >= this.uplevel) {
                this.trend.duration++;
                if (this.trend.duration >= this.persisted) {
                    this.trend.persisted = true;
                }
            } else if (cci.result <= this.downlevel && (this.trend.persisted || this.persisted === 0) && !this.trend.adviced && this.trend.direction === 'oversold') {
                this.trend.adviced = true;
                this.trend.duration++;
                this.advice('long');
            } else if (cci.result <= this.downlevel && this.trend.direction !== 'oversold') {
                this.trend.duration = 1;
                this.trend.direction = 'oversold';
                this.trend.persisted = false;
                this.trend.adviced = false;
                if (this.persisted === 0) {
                    this.trend.adviced = true;
                    this.advice('long');
                }
            } else if (cci.result <= this.downlevel) {
                this.trend.duration++;
                if (this.trend.duration >= this.persisted) {
                    this.trend.persisted = true;
                }
            } else {
                if (this.trend.direction !== 'nodirection') {
                    this.trend = {
                        direction: 'nodirection',
                        duration: 0,
                        persisted: false,
                        adviced: false
                    };
                } else {
                    this.trend.duration++;
                }
                this.advice();
            }
        } else {
            this.advice();
        }
        log.debug("Trend: ", this.trend.direction, " for ", this.trend.duration);
    }
};
module.exports = method;