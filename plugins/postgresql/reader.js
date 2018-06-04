let _ = require('lodash');
let util = require('../../core/util');
let config = util.getConfig();
let log = require(util.dirs().core + 'log');
let handle = require('./handle');
let postgresUtil = require('./util');

const {Query} = require('pg');
 let Reader = function (){
     _.bindAll(this);
     this.db = handle;
}

Reader.prototype.mostRecentWindow = function (from,to,next) {
    to = to.unix();
    from = from.unix();
    let maxAmount = to - from + 1;
    let query = this.db.query(new Query(`
        SELECT start from ${postgresUtil.table('candles')}
        WHERE start <= ${to} AND start >= ${from}
        ORDER BY start DESC
    `), function (err, result) {
        if (err) {
            if (err.message.indexOf('does not exist') !== -1)
                return next(false);
            log.error(err);
            return util.die('While reading mostRecentWindow DB error ');
        }
    });
    let rows = [];
    query.on('row', function (row) {
        row.push(row);
    });
}

