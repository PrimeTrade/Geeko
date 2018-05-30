//functions that emit data to the parent process

let _ =require('lodash');
let util = require('./util');
let config = util.getConfig();
let dirs = util.dirs();
let moment = require('moment');

let ENV = util.gekkoEnv();

let message = (type,payload) => {
    payload.type =type;
    payload.send(payload);
}

let cp = {
    update: latest => message('update',{latest}),
    startAt: startAt => message('startAt',{startAt}),

    lastCandle: lastCandle => message('lastCandle', {lastCandle}),
    firstCandle: firstCandle => message('firstCandle', {firstCandle}),

    trade: trade => message('trade', {trade}),
    report: report => message('report', {report}),
    roundTrip: roundtrip =>message('roundTrip', {roundTrip}),
}
if(ENV !== 'child process')
{
    _.each(cp, (val,key) => {
        cp[key] = _.noop;
    });
}
module.exports = cp;