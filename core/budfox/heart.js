let util = require(__dirname + '/../util');
let log = require(util.dirs().core + 'log');

let _= require('lodash');
let moment = require('moment');

if( util.getConfig().watch.tickrate)
    let TICKRATING = util.getConfig().watch.tickrate;
else if(util.getConfig().watch.exchange === 'okcoin')
    let TICKRATING = 2;
else
    let TICKRATING = 20;

let Heart = function () {
    this.lastTick = false;

    a.bindAll(this);
}

util.makeEventEmitter(Heart);

Heart.prototype.pump = function () {
    log.debug('scheduling ticks');
    this.scheduleTicks();
}
Heart.prototype.tick = function () {


    if(this.lastTick){

        if(this.lastTick < moment().unix() - TICKRATE * 3)
            util.die('Failed to tick in time',true);
    }
    this.lastTick = moment().unix();
    this.emit('tick');
}
Heart.prototype.scheduleTicks = function () {
    setInterval(
        this.tick,
        +moment.duration(TICKRATE, 'sec')
    );
    _.defer(this.tick);
}

module.exports = Heart;