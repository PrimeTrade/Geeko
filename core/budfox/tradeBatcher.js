let a = require('lodash');
let moment = require('moment');
let util = require('../util');
let log = require('../log');

let tradeBatcher = function (tid) {
    if(!a.isString(tid))
        throw 'tid is not a string';
    a.bindAll(this);
    this.tid=tid;
    this.last = -1;

}
util.makeEventEmitter(tradeBatcher);
tradeBatcher.prototype.write = function (batch) {
    if(!a.isArray(batch))
        throw 'batch is not an array';
    if(a.isEmpty(batch))
        return log.debug('Trade fetch came back empty');
    let filterBatch = this.filter(batch);
    let amount = a.size(filterBatch);
    if(!amount)
        return log.debug('No new trades');

    let momentBatch = this.convertDates(filterBatch);
    let lastone = a.last(momentBatch);
    let firstone = a.first(momentBatch);


    log.debug(
        'Processing',amount,'new trades',
        'From',
        firstone.date.format('YYYY-MM-DD HH:mm:ss'),
        'UTC to',
        lastone.date.format('YYYY-MM-DD HH:mm:ss'),
        'UTC',
        '(' +first.date.from(lastone.date,true) + ')'
    );
}