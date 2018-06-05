let moment = require('moment');
let _ = require('lodash');
let log = require('../core/log');
let config = require('../core/util').getConfig();
let ircbot = config.ircbot;
let utc = moment.utc();

let irc = require("irc");

let Actor = function () {
    _.bindAll(this);
    this.bot = new irc.Client(ircbot.server,ircbot.botName, {
        channels: [ircbot.channel]
    });
    this.bot.addListener("message",this.verifyQuestion);
    this.bot.addListener("error",this.logError);

    this.advice = 'Do not get one yet';
    this.adviceTime = utc();

    this.price = 'Do not know yet';
    this.priceTime = utc();

    this.commands = {
        ';;advice' : 'emitAdvice',
        ';;price' : 'emitPrice',
        ';;donate' : 'emitDonation',
        ';;real advice' : 'emitRealAdvice',
        ';;help' : 'emitHelp'
    };
    this.rawCommands = _.keys(this.commands);
}

Actor.prototype.processCandle = function (candle,done) {
    this.price = candle.close;
    this.priceTime = candle.start;

    done();
};

Actor.prototype.processAdvice = function (advice) {
    if(advice.recommendation === "soft" && ircbot.muteSoft)
        return;
    this.advice = advice.recommendation;
    this.adviceTime = utc();

    if(ircbot.emitUpdates)
        this.newAdvice();
};

Actor.prototype.verifyQuestion = function (from,to,text,message) {
    if(text in this.commands)
        this[this.commands[text]]
        ();
}

Actor.prototype.newAdvice = function () {
    this.bot.say(ircbot.channel, 'Important news');
    this.emitAdvice();
}

Actor.prototype.emitAdvice = function () {
    let message = [
        'Advice for ',
        config.watch.exchange,
        ' ',
        config.watch.currency,
        '/',
        config.watch.asset,
        ' using ',
        config.tradingAdvisor.method,
        ' at ',
        config.tradingAdvisor.candleSize,
        ' minute candles, is:\n',
        this.advice,
        ' ',
        config.watch.asset,
        ' (from ',
        this.adviceTime.fromNow(),
        ')'
    ].join('');

    this.bot.say(ircbot.channel, message);
};