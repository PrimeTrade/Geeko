let _ = require('lodash');
let log = require('../core/log');
let util = require('../core/util');
let config = util.getConfig();
let pushoverConfig = config.pushover;
let push = require("pushover-notifications");

let PushOver = function () {
    _.bindAll(this);
    this.pr;
    this.price = 'N/A';
    this.setup();
}

PushOver.prototype.setup = function(){
    let PushoverSetup = function () {
        this.pr = new push({
            user: pushoverConfig.user,
            token: pushoverConfig.key,
        });

        if(pushoverConfig.sendPushoverOnStart){
            this.start(
                "Started geeko",
                [
                    "Just started watching",
                    config.watch.exchange,
                    ' ',
                    config.watch.currency,
                    '/',
                    config.watch.asset,
                    "I will let you know when i get some advice"
                ].join('')
            );
        } else
            log.debug('Setup pushover advisor');
    }
    PushoverSetup.call(this);
}

PushOver.prototype.send = function (subject,content) {
    let message = {
        message: content,
        title: pushoverConfig.tag + subject,
        device: 'devicename',
        priority: 1
    };
    this.pr.send(msg,function (err,result) {
        if(err){

            throw err;
        }
        console.log(result);
    });
}

PushOver.prototype.processCandle = function (candle,callback){
    this.price = candle.close;
    callback();
}

PushOver.prototype.processAdvice = function (advice) {
    if (advice.recommendation == 'soft' && pushoverConfig.muteSoft) return;
    let text = [
        advice.recommendation,
        this.price
    ].join(' ');
    let subject = text;
    this.send(subject, text);
}

Pushover.prototype.checkResults = function(err) {
    if(err)
        log.warn('error sending pushover', err);
    else
        log.info('Send advice via pushover.');
}

module.exports = Pushover;
