let util = require('../core/util');
let config = util.getConfig();
let log = require('../core/log');
let redisBeacon = config.redisBeacon;
let watch = config.watch;

let subscriptions = require('../subscriptions');
let _ = require('lodash');

let redis = require("redis");

let Actor = function (done) {
    _.bindAll(this);

    this.market = [
        watch.exchange,
        watch.currency,
        watch.asset
    ].join('-');
    this.init(done);
}

let proto = {};
_.each(redisBeacon.broadcast,function (es) {
    let subscription = _.find(subscriptions, function (su) {
        return su.event === es
    });

    if(!subscription)
        util.die("Geeko does not know this event: " + es);
    let channel = redisBeacon.channelPrefix + subscription.event;
    proto[subscription.handler] = function(message, cb) {
        if(!_.isFunction(cb))
            cb = _.noop;

        this.emit(channel, {
            market: this.market,
            data: message
        }, cb);
    };

}, this)

Actor.prototype = proto;

Actor.prototype.init = function(done) {
    this.client = redis.createClient(redisBeacon.port, redisBeacon.host);
    this.client.on('ready', _.once(done));
}

Actor.prototype.emit = function(channel, message) {
    log.debug('Going to publish to redis channel:', channel);

    let data = JSON.stringify(message);
    this.client.publish(channel, data);
}

module.exports = Actor;
