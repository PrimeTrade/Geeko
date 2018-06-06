let _ = require('lodash');
let util = require('../../core/util');
let log = require(`${util.dirs().core}log`);
let handle = require('./handle');
let mongoUtil = require('./util');
let Reader = function Reader() {
    _.bindAll(this);
    this.db = handle;
    this.collection = this.db.collection(mongoUtil.settings.historyCollection);
    this.pair = mongoUtil.settings.pair.join('_');
}
Reader.prototype.mostRecentWindow = function mostRecentWindow(from,to,next) {
    let mFrom = from.unix();
    let mTo = to.unix();
    let maxAmount = mTo - mFrom + 1;
    this.collection.find({pair: this.pair, start: { $gte: mFrom, $lte: mTo}}).sort({start: -1}, (err,docs) => {
        if(err){
            return util.die('At `mostRecentWindow` DB error');
        }
        if(docs.length === 0){
            log.debug('No candles are available');
            return next(false);
        }
        if(docs.length === maxAmount){
            log.debug('Available full history');
            return next({
                mFrom,
                mTo
            });
        }
        let mostRecent = _.first(docs).start;
        let gapIndex = _.findIndex(docs, (r,i) => r.start !== mostRecent - i*60);

        if(gapIndex === -1){
            let leastRecent = _.last(docs).start;
            return next({
                from: leastRecent,
                to: mostRecent
            });
        }
        return next({
            from: docs[gapIndex - 1].start,
            to: mostRecent
        });
    })
}
Reader.prototype.get = function get(from,to,what,next) {
    this.collection.find({
        pair: this.pair,
        start: { $gte: from, $lte: to}}).sort({start: 1},(err,docs) => {
            if(err){
                return util.die('At `get` DB error');
            }
            return next(null,docs);
    });
}
Reader.prototype.count = function fCount(from,to,next) {
    this.collection.count({
        pair: this.pair,
        start: {$gte: from,
        $lte: to}
    },(err,count) => {
        if(err){
            return util.die('At `count` DB error ');
        }
        return next(null,count);
    })
}
Reader.prototype.countTotal = function countTotal(next) {
    this.collection.find({pair: this.pair}, (err,count)=>{
        if(err){
            return util.die('At `countTotal` DB error');
        }
        return next(null,count);
    })
}
Reader.prototype.getBoundry = function getBoundary(next) {
    this.collection.find({
        pair: this.pair}
        ,{start:1}).sort({start:1}).limit(1,(err,docs) => {
            if(err){
                return util.die('At `getBoundary` DB error');
            }
            let start = _.first(docs).start;
        this.collection.find(
            { pair: this.pair },
            { start: 1 }).sort({ start: -1 }).limit(1, (err2, docs2) => {
            if (err2) {
                return util.die('DB error at `getBoundry`');
            }
            var end = _.first(docs2).start;
            return next(null, { first: start, last: end });
        });
        return null;
    });
}
Reader.prototype.tableExists = function (name,next) {
    return next(null,true);
}
Reader.prototype.close = function () {
    this.db = null;
}
module.exports = Reader;