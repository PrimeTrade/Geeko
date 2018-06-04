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
