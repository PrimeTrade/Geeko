let util = require('util');
let a= require('lodash');
let moment = require('moment');

if(util.getConfig().watch.tickrate)
    let TICKRATING = util.getConfig().watch.tickrate;
else if(util.getConfig().watch.exchange === 'okcoin')
    let TICKRATING = 2;
else
    let TICKRATING = 20;

let Heart = function () {
    this.lastTick = false;

    a.bindAll(this);
}