let _ = require('lodash');
let util = require('../../util');
let dirs = util.dirs();
let moment = require('moment');
let async = require('async');
let os = require('os');
let dateRangeScan = require('../dateRangeScan/parent');

module.exports = (config, done)=>{
    util.setConfig(config);

    let adapter = config[config.adapter];
    let scan = require(dirs.gekko + adapter.path + '/scanner');

    scan((err, markets)=>{
        if(err)
            return done(err);

        async.eachLimit(markets, os.cpus().length, (market, next)=>{
            let marketConfig = _.clone(config);
            marketConfig.watch = market;

            dateRangeScan(marketConfig, (err, ranges)=>{
                if(err)
                    return next();

                market.ranges = ranges;
                next();
            });

        },err=>{
            let resp = {
                datasets: [], errors: []
            }
            markets.forEach(market =>{
                if(market.ranges)
                    resp.datasets.push(market);
                else
                    resp.errors.push(market);
            })
            done(err, resp);
        })
    });
}
