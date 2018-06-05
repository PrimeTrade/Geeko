let _ = require('lodash');
let moment = require('moment');
let log = require('../core/log');
let Server = require('../web/server.js');

let Actor = function (next) {
    _.bindAll(this);

    this.server = new Server();
    this.server.setup(next);
}

Actor.prototype.init = function(data) {
    this.server.broadcastHistory(data);
};

Actor.prototype.processCandle = function(candle, next) {
    this.server.broadcastCandle(candle);

    next();
};

Actor.prototype.processAdvice = function(advice) {
    this.server.broadcastAdvice(advice);
};

module.exports = Actor;