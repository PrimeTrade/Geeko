let _ = require('lodash');
let log = require('../core/log');
let util = require('../core/util');
let config = util.getConfig();
let pushbullet = require("pushbullet");
let pushbulletConfig = config.pushbullet;

let PushBullet = function (done) {
    _.bindAll(this);
    this.pusher;
    this.price = 'N/A';
    this.done = done;
    this.setup();
};

PushBullet.prototype.setup = function (done) {
    let setupPushBullet = function (err,result) {
        if(pushbulletConfig.sendMessageOnStart){
            let title = pushbulletConfig.tag;
            let exchange = config.watch.exchange;
            let currency = config.watch.currency;
            let asset = config.watch.asset;
            let body = "I have started watching as Geeko started"
            +exchange +" " +currency +" " +asset +" I will let you know when i get some advice";
            this.mail(title,body);

        }else {
            log.debug('On startup skipping send message');
        }
    };
    setupPushBullet.call(this);
};

PushBullet.prototype.processCandle = function (candle,done) {
    this.price = candle.close;
    done();
};

PushBullet.prototype.processAdvice = function (advice) {
    if(advice.recommendation == "soft" && pushbulletConfig.muteSoft)
        return;
    let text = [
        'Gekko is watching ',
        config.watch.exchange,
        ' and has detected a new trend, advice is to go ',
        advice.recommendation,
        '.\n\nThe current ',
        config.watch.asset,
        ' price is ',
        this.price
    ].join('');
    let subject = pushbulletConfig.tag + 'Go: new advice' + advice.recommendation;
    this.mail(subject,text);
};

Pushbullet.prototype.mail = function(subject, content, done) {
    let pusher = new pushbullet(pushbulletConfig.key);
    pusher.note(pushbulletConfig.email, subject, content, function(error, response) {
        if(error || !response) {
            log.error('Pushbullet ERROR:', error)
        } else if(response && response.active){
            log.info('Pushbullet Message Sent')
        }
    });
};

Pushbullet.prototype.checkResults = function(err) {
    if(err)
        log.warn('error sending email', err);
    else
        log.info('Send advice via email.');
};

module.exports = Pushbullet;
