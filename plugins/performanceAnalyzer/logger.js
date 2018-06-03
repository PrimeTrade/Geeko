const _ = require('lodash');
const moment = require('moment');
const humanizeDuration = require('humanize-duration');

const util = require('../../core/util.js');
const dirs = util.dirs();
const mode = util.gekkoMode();
const config = util.getConfig();
const calcConfig = config.paperTrader;
const log = require(dirs.core + 'log');

const Logger = function(watchConfig) {
    this.currency = watchConfig.currency;
    this.asset = watchConfig.asset;

    this.roundtrips = [];
}

Logger.prototype.round = function(amount) {
    return amount.toFixed(8);
}

Logger.prototype.handleStartBalance = function() {
//noop
}
Logger.prototype.logReport = function (trade,report) {
    let start = this.round(report.startBalance);
    let current = this.round(report.balance);
    log.info(`(PROFIT REPORT) original simulated balance:\t ${start} ${this.currency} `);
    log.info(`(PROFIT REPORT) current simulated balance:\t ${current} ${this.currency}`);
    log.info(
        `(PROFIT REPORT) simulated profit:\t\t ${this.round(report.profit)} ${this.currency}`,
        `(${this.round(report.relativeProfit)}%)`
    );
}
Logger.prototype.logRoundtripHeading = function () {
    log.info('(ROUNDTRIP)', 'entry date (UTC)  \texit date (UTC)  \texposed duration\tP&L \tprofit');
}
Logger.prototype.logRoundtrip = function (rt) {
    const display = [
        rt.entryAt.utc().format('YYYY-MM-DD HH:mm'),
        rt.exitAt.utc().format('YYYY-MM-DD HH:mm'),
        (moment.duration(rt.duration).humanize() + "   ").slice(0,16),
        rt.pnl.toFixed(2),
        rt.profit.toFixed(2)
    ];

    log.info('(ROUNDTRIP)', display.join('\t'));
}

