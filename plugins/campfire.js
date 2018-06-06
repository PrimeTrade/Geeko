let _ = require('lodash');
let moment = require('moment');
let Ranger = require('ranger');
let config = require('../core/util').getConfig().campfire;

let Actor = function () {
    _.bindAll(this);
    this.commands = [{
        'handler' : 'advice',
        'callback' : this.sayAdvice(),
        'description': "Depending on the current trend,advice on what position to take"
    },{
        'handler' : 'price',
        'callback' : this.sayPrice(),
        'description' : "The current price of the asset in the configured currency"
    },{
        'handler' : 'donate',
        'callback' : this.sayDonate(),
        'description' : "Where to send all of that extra coin that's weighing you down"
    },{
        'handler' : 'help',
        'callback' : this.sayHelp(),
        'description' : "You are here"
    }];

    this.advice = null;
    this.adviceTime = Moment.utc();
    this.price = null;
    this.priceTime = Moment.utc();

    this.client = Ranger.createClient(config.account,config.apiKey);
    this.client.room(config.roomId, this.joinRoom);
    this.client.me(this.whoAmI);
};

Actor.prototype = {
    processCandle: function (candle,done) {
        this.price = candle.close();
        this.priceTime = candle.date.start();
        done();

    },
    processAdvice: function (advice) {
        if (campfire.muteSoft && advice.recommendation === 'soft')
            return;
        this.advice = advice.recommendation;
        this.adviceTime = Moment.utc();

        if(config.emitUpdates){
            this.sayAdvice();
        }
    },
    sayAdvice: function(){
        let message;

        if(this.price !== null){
            message = ["We think you should", this.advice + ".", "(" + this.adviceTime.fromNow() + ")"];
        }
        else {
            message = ["We don't know the price right now."];
        }
        this.room.speak(message.join(' '));

    },
    sayDonate: function () {
        this.room.speak("If you had like to donate a few coins, you can send them here : 13r1jyivitShUiv9FJvjLH7Nh1ZZptumwW");
    },
    sayHelp: function () {
        this.room.speak("I listen for the following inquiries..." ,this.pasteDescriptions);
    },
    pasteDescriptions: function () {
        let descriptions = _.map(this.commands, function (command) {
            return [command.handler + ':', command.description].join('');
        },this).join('\n');
        this.room.paste(descriptions);
    },
    joinRoom: function (room) {
        this.room = room,
            this.room.join(this.listenForCommands);
    },
    listenForCommands: function () {
        this.room.listen(this.executeCommands);
    },
    executeCommands: function (message) {
        if(message.userId === this.userId)
            return false;
        if(message.body === null)
            return false;
        _.each(this.commands,function (command) {
            if(this.textHasCommandForBot(message.body,config.nickname, command.handler)){
                command.callback();
            }
        },this);
    },

    textHasCommandForBot: function (text,nickname,handler) {
        let normalizedText = text.toLowerCase();
        let normalizedNickname = nickname.toLowerCase();
        let normalizedHanlder = handler.toLowerCase();

        let nicknameWasMentioned = normalizedText.indexOf(normalizedNickname) >= 0;
        let handlerWasMentioned = normalizedText.indexOf(normalizedHanlder) >= 0;

        return nicknameWasMentioned && handlerWasMentioned;
    },
    whoAmI: function (user) {
        this.user = user;
    }
};

module.exports = Actor;