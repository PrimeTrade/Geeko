let log = require('../core/log');
let moment = require('moment');
let _ = require('lodash');
let xmpp = require('node-xmpp-client');
let config = require('../core/util').getConfig();
let xmppbot = config.xmppbot;
let utc = moment.utc;



let Actor = function() {
    _.bindAll(this);

    this.bot = new xmpp.Client({ jid: xmppbot.client_id,
        password: xmppbot.client_pwd,
        host: xmppbot.client_host,
        port: xmppbot.client_port
    });

    this.advice = 'Do not got one yet';
    this.adviceTime = utc();
    this.state = xmppbot.status_msg;
    this.price = 'Do not know yet';
    this.priceTime = utc();

    this.commands = {
        ';;advice': 'emitAdvice',
        ';;price': 'emitPrice',
        ';;donate': 'emitDonation',
        ';;real advice': 'emitRealAdvice',
        ';;help': 'emitHelp'
    };

    this.rawCommands = _.keys(this.commands);

    this.bot.addListener('online', this.setState);
    this.bot.addListener('stanza', this.rawStanza);
    this.bot.addListener("error", this.logError);
    this.bot.connection.socket.setTimeout(0)
    this.bot.connection.socket.setKeepAlive(true, 10000)

}

Actor.prototype.setState = function() {
    let elem = new xmpp.Element('presence', { }).c('show').t('chat').up().c('status').t(this.state)
    this.bot.send(elem);
};

Actor.prototype.rawStanza = function(stanza) {
    if (stanza.is('presence') && (stanza.attrs.type == 'subscribe')) {
        this.bot.send(new xmpp.Element('presence', { to: stanza.attrs.from, type: 'subscribed' }));
    }
    if (stanza.is('message') &&
        stanza.attrs.type !== 'error') {


        let from = stanza.attrs.from;
        let body = stanza.getChild('body');
        if (!body) {
            return;
        }

        let message_recv = body.getText();
        this.verifyQuestion(from, message_recv);
    }
};

Actor.prototype.sendMessageTo = function(receiver, message){
    this.bot.send(new xmpp.Element('message', { to: receiver, type: 'chat' }).
        c('body').t(message)
    );
};
Actor.prototype.sendMessage = function(message) {
    this.sendMessageTo(this.from, message);
};

Actor.prototype.processCandle = function(candle) {
    this.price = candle.close;
    this.priceTime = candle.start;
};

Actor.prototype.processAdvice = function(advice) {
    if (xmppbot.muteSoft && advice.recommendation === 'soft') return;
    this.advice = advice.recommendation;
    this.adviceTime = utc();

    if(xmppbot.emitUpdates)
        this.newAdvice(xmppbot.receiver);
};

Actor.prototype.verifyQuestion = function(receiver, text) {
    if(text in this.commands)
        this[this.commands[text]](receiver);
}

Actor.prototype.newAdvice = function(receiver) {
    this.sendMessageTo(receiver, 'Important news!');
    this.emitAdvice(receiver);
}


Actor.prototype.emitAdvice = function(receiver) {
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

    this.sendMessageTo(receiver, message);
};


Actor.prototype.emitPrice = function(receiver) {

    let message = [
        'Current price at ',
        config.watch.exchange,
        ' ',
        config.watch.currency,
        '/',
        config.watch.asset,
        ' is ',
        this.price,
        ' ',
        config.watch.currency,
        ' (from ',
        this.priceTime.fromNow(),
        ')'
    ].join('');

    this.sendMessageTo(receiver, message);
};


Actor.prototype.emitDonation = function(receiver) {
    let message = 'If you want to donate then, you can send your coins here:';
    message += '\nBTC:\t19UGvmFPfFyFhPMHu61HTMGJqXRdVcHAj3';

    this.sendMessageTo(receiver, message);
};

Actor.prototype.emitHelp = function(receiver) {
    let message = _.reduce(
        this.rawCommands,
        function(message, command) {
            return message + ' ' + command + ',';
        },
        'possible commands are:'
    );

    message = message.substr(0, _.size(message) - 1) + '.';

    this.sendMessageTo(receiver, message);

}

Actor.prototype.emitRealAdvice = function(receiver) {
    let realAdvice = [
        'I don\'t throw darts at a board. I bet on sure things. Read Sun-tzu, The Art of War. Every battle is won before it is ever fought.',
        'Ever wonder why fund managers can\'t beat the S&P 500? \'Cause they\'re sheep, and sheep get slaughtered.',
        'If you\'re not inside, you\'re outside!',
        'The most valuable commodity I know of is information.',
        'It\'s not a question of enough, pal. It\'s a zero sum game, somebody wins, somebody loses. Money itself isn\'t lost or made, it\'s simply transferred from one perception to another.',
        'What\'s worth doing is worth doing for money. (Wait, wasn\'t I a free and open source bot?)',
        'When I get a hold of the son of a bitch who leaked this, I\'m gonna tear his eyeballs out and I\'m gonna suck his fucking skull.'
    ];

    this.sendMessageTo(receiver, _.first(_.shuffle(realAdvice)));
}

Actor.prototype.logError = function(message) {
    log.error('XMPP ERROR:', message);
};


module.exports = Actor;
