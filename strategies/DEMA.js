//const _ = require('lodash');
const log = require('../core/log');

let method = {
    init: () => {
        this.name = 'DEMA';
        this.currentTrend = undefined;
        this.requiredHistory = this.tradingAdvisor.historySize;
        //define required indicators
        this.addIndicator('dema', 'DEMA', this.settings);
        this.addIndicator('sma', 'SMA', this.settings.weight);
    },
    update: (candle) => {
        //actions to perform on every new candle
    },
    log: () => {
        let dema = this.indicators.dema;
        let sma = this.indicators.sma;
        log.debug('Calculated DEMA and SMA properties for candle:');
        log.debug('\t Inner EMA:', dema.inner.result.toFixed(8));
        log.debug('\t Outer EMA:', dema.outer.result.toFixed(8));
        log.debug('\t DEMA:', dema.result.toFixed(5));
        log.debug('\t SMA', sma.result.toFixed(5));
        log.debug('\t DEMA age', dema.inner.age, 'candles');
    },
    check: (candle) => {
        let dema = this.indicators.dema;
        let sma = this.indicators.sma;
        let resDEMA = dema.result;
        let resSMA = sma.result;
        let price = candle.close;
        let diff = resSMA - resDEMA;

        let message = '@' + price.toFixed(8) + '(' + resDEMA.toFixed(5) + '/' + diff.toFixed(5) + ')';
        if (diff > this.settings.threshold.up) {
            log.debug('we are currently in uptrend', message);
            if (this.currentTrend !== 'up') {
                this.currentTrend = 'up';
                this.advice('long');
            } else
                this.advice();

        } else if (diff < this.settings.thresholds.down) {
            log.debug('we are currently in a downtrend', message);

            if (this.currentTrend !== 'down') {
                this.currentTrend = 'down';
                this.advice('short');
            } else
                this.advice();

        } else {
            log.debug('we are currently not in an up or down trend', message);
            this.advice();
        }
    }
};
module.exports = method;