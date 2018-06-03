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
}