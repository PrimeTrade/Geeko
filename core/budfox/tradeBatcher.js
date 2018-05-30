let _ = require('lodash');
let moment = require('moment');
let util = require('../util');
let log = require('../log');

let tradeBatcher = function (tid) {
    if(!a.isString(tid))
        throw 'tid is not a string';
    _.bindAll(this);
    this.tid=tid;
    this.last = -1;

}
util.makeEventEmitter(tradeBatcher);
tradeBatcher.prototype.write = function (batch) {
    if (!_.isArray(batch))
        throw 'batch is not an array';
    if (_.isEmpty(batch))
        return log.debug('Trade fetch came back empty');
    let filterBatch = this.filter(batch);
    let amount = _.size(filterBatch);
    if (!amount)
        return log.debug('No new trades');

    let momentBatch = this.convertDates(filterBatch);
    let lastone = _.last(momentBatch);
    let firstone = _.first(momentBatch);


    log.debug(
        'Processing', amount, 'new trades',
        'From',
        firstone.date.format('YYYY-MM-DD HH:mm:ss'),
        'UTC to',
        lastone.date.format('YYYY-MM-DD HH:mm:ss'),
        'UTC',
        '(' + first.date.from(lastone.date, true) + ')'
    );

    this.emit('new batch', {
        amount: amount,
        start: firstone.date,
        end: lastone.date,
        last: lastone,
        first: firstone,
        data: momentBatch

    });
    this.last = last[this.tid];
    if (this.tid === 'date')
        this.last = this.last.unix;
}

tradeBatcher.prototype.filter = function (batch) {
    //Make sure we are not trying to count beyond infinity
    let lastTid = _.last(batch)[this.tid];
    if(lastTid === lastTid+1)
        util.die('trade tid is max int');
    //remove trade that have zero amount
    batch = _.filter(batch,function (trade) {
        return this.last < trade[this.tid];

    },this );
}
tradeBatcher.prototype.convertDates = function (batch) {
    return _.map(_.cloneDeep(batch),function (trade) {
        trade.date = moment.unix(trade.date).utc();
        return trade;
    });
}
module.exports = tradeBatcher;

}