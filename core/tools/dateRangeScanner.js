let BATCH_SIZE = 60;
let MISSING_CANDLES_ALLOWED = 3;

let _ = require('lodash');
let moment = require('moment');
let async = require('async');

let util = require('../util');
let config = util.getConfig();
let dirs = util.dirs();
let log = require(dirs.core + 'log');

let adapter = config[config.adapter];
let Reader = require(dirs.gekko + adapter.path + '/reader');
let reader = new Reader();

let scan = function (done) {
    log.info('Scanning local history for backstable dateranges');

    reader.tableExists('candles', (err,exists) => {
        if(err)
            return done(err,null,reader);
        if(!exists)
            return done(null, [], reader);

        async.parallel(
            {
                boundary: reader.getBoundry,
                available: reader.countTotal
             } ,  (err,res) => {
                let first = res.boundary.first;
                let last = res.boundary.last;

                let optimal = (last - first) / 60;
                log.debug('Available', res.available);
                log.debug('Optimal',optimal);

                if(res.available === optimal+1){
                    log.info('Geeko is able to fully use the local history');
                    return done(false, [{
                        from: first,
                        to: last,
                    }],reader);
                }

                let missing = optimal - res.available + 1;
                log.info('The database has $(missing) candles missing, figuring out which ones ');


                let iterator ={
                    from:last - (BATCH_SIZE * 60),
                    to: last
                }
                let batches = [];
                async.whilst(
                    () => {
                        return iterator.from > first


                    },
                    next => {
                        let from = iterator.from;
                        let to = iterator.to;
                        reader.count(
                            from,
                            iterator.to,
                            (err,count) => {
                                let complete = count + MISSING_CANDLES_ALLOWED > BATCH_SIZE;
                                if (complete)
                                    batches.push({
                                        to: to,
                                        from: from
                                    });
                                next();
                            }
                        );
                        iterator.from -= BATCH_SIZE * 60;
                        iterator.to -= BATCH_SIZE * 60;

                    },
                    () =>  {
                        if(!_.size(batches))
                            util.die('Not enough data to work with ',true);

                        let ranges = [batches.shift()];
                        _.each(batches,batch => {
                            let curRange = _.last(ranges);
                            if(batch.to === curRange.from)
                                curRange.from = batch.from;
                            else
                                ranges.push(batch);
                        })
                        ranges = ranges.reverse();
                        _.map(ranges, r=> {
                            return{
                                from: r.to,
                                to: r.from

                            }
                        });
                        return done(false,ranges,reader);
                    }
                )
            }
        );
    });


}
module.exports = scan;