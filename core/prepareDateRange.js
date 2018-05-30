let _ = require('lodash');
let util = require('./util');
let config = util.getConfig();
let dirs = util.dirs();
let prompt = require('prompt-lite');
let moment = require('moment');
let log = require(dirs.core + 'log');
let scan = require(dirs.tool + 'dataRangeScanner');

// helper to store eventually detected daterange.

let setDateRange = (from,to)=>{
    config.backtest.daterange = {
        from: moment.unix(from).utc().format(),
        to: moment.unix(to).utc().format(),
    };
    util.setConfig(config);
}

module.exports = (done)=>{
    scan((err,ranges)=>{
        if(_.size(ranges)===0)
            util.die('No history found for this market',true);

        if(_.size(ranges)===1){
            let r= _.first(ranges);
            log.info('Gekko war able to find a single daterange in the locally stored history:');
            log.info('\t', 'from:', moment.unix(r.from).utc().format('YYYY-MM-DD HH:mm:ss'));
            log.info('\t','to:',moment.unix(r.to).utc().format('YYYY-MM-DD HH:mm:ss'));

            setDateRange(r.from, r.to);
            return done();
        }

        log.info('Gekko detected multiple dateranges in the locally stored history.',
        'Please pick the daterange you are interested in testing:');

        _.each(ranges, (range,i)=>{
            log.info('\t\t',`OPTION ${i+1}:`);
            log.info('\t','from:',moment.unix(range.from).utc().format('YYYY-MM-DD HH:mm:ss'));
            log.info('\t','to:',moment.unix(range.to).utc().format('YYYY-MM-DD HH:mm:ss'));
        });

        promt.get({name:'option'},(err, result)=>{
            let option = parseInt(result,option);
            if(option === NaN)
                util.die('Not an option..',true);

            let range = ranges[option-1];

            if(!range)
                util.die('Not an option..',true);

            setDateRange(range.from, range.to);
            return done();
        });
    });
}