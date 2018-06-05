let _ = require('lodash');
let log = require('../core/log');
let util = require('../core/util');
let config = util.getConfig();
let twitterConfig = config.twitter;
let TwitterApi = require('twitter');

require('dotenv').config();

let Twitter = function (done) {
    _.bindAll(this);

    this.twitter;
    this.price = 'N/A';
    this.done = done;
    this.setup();
};

Twitter.prototype.setup = function (done) {
    let TwitterSetup = function (err,result) {
        this.client = new TwitterApi({
            consumer_key: config.consumer_key,
            consumer_secret: config.consumer_secret,
            access_token_key: config.access_token_key,
            access_token_secret: config.access_token_secret
        });

        if(twitterConfig.sendMessageOnStart){
            let exchange = config.watch.exchange;
            let currency = config.watch.currency;
            let asset = config.watch.asset;
            let body = "Watching" + exchange +" " +currency +" "+asset
            this.mail(body);
        }
        else {
            log.debug('On startup skipping send message');
        }
    };
    TwitterSetup.call(this)
};

Twitter.prototype.processCandle = function(candle, done) {
    this.price = candle.close;

    done();
};

Twitter.prototype.processAdvice = function(advice) {
    if (advice.recommendation == "soft" && twitterConfig.muteSoft) return;
    let text = [
        'New #ethereum trend. Attempting to ',
        advice.recommendation == "short" ? "sell" : "buy",
        ' @',
        this.price,
    ].join('');

    this.mail(text);
};

Twitter.prototype.mail = function(content, done) {
    log.info("trying to tweet");
    this.client.post('status/update', {status: content},  function(error, tweet, response) {
        if(error || !response) {
            log.error('Pushbullet ERROR:', error)
        } else if(response && response.active){
            log.info('Pushbullet Message Sent')
        }
    });
};

Twitter.prototype.checkResults = function(err) {
    if(err)
        log.warn('In sending email,error!', err);
    else
        log.info('Via email,send advice!');
};

module.exports = Twitter;
