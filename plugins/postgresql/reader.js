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
    query.on('end', function () {
        if(rows.length === 0){
            return next(false);
        }
        if(rows.length === maxAmount){
            return next({
                from: from,
                to: to,
            });
        }

        let theMostRecent = _.first(rows).start;
        let gapIndex = _.findIndex(rows, function (r,i) {
            return r.start !==  theMostRecent - i*60;
        });
        if (gapIndex === -1){
            let theLeastRecent = _.last(rows).start;
            return next({
                from: theMostRecent,
                to: theMostRecent,
            });
        }
        return next({
            from: rows[gapIndex - 1].start,
            to: theMostRecent,
        });
    });
 }
 Reader.prototype.tableExists = function(name,next){
     this.db.query(`
     SELECT table name
        FROM information_schema.tables
        WHERE table_schema = ' ${postgresUtil.schema()} '
        AND table_name = '${postgresUtil.table(name)}';
        `, function(err,result){
         if(err){
             return util.die('At `tableExists` DB error');
         }
         next(null,result.rows.length === 1);
     });

 }

 Reader.prototype.get = function (from,to,what,next) {
     if(what === 'full'){
         what = '*';
     }
     let query = this.db.query(new Query(`
     SELECT ${what} from ${postgresUtil.table('candles')}
     where start <= ${to} AND start >= ${from}
     ORDER BY start ASC
     `));

     let rows =[];
     query.on('row',function (row) {
         rows.push(row)
     });
     query.on('end',function () {
         next(null,rows);
     });
 }
 Reader.prototype.count = function (from,to,next) {
     let query = this.db.query(new Query(`
     SELECT count(*) as count from ${postgresUtil.table('candles')}
     where start <= ${to} AND start >= ${from}
     `));
     let rows = [];
     query.on('row',function (row) {
         rows.push(row);
     });
     query.on('end',function () {
         next(null,_.first(rows).count);
     });
 }
Reader.prototype.countTotal = function(next) {
    let query = this.db.query(new Query(`
  SELECT COUNT(*) as count from ${postgresUtil.table('candles')}
  `));
    let rows = [];
    query.on('row', function(row) {
        rows.push(row);
    });

    query.on('end',function(){
        next(null, _.first(rows).count);
    });
}

Reader.prototype.getBoundry = function(next) {
    let query = this.db.query(new Query(`
  SELECT (
    SELECT start
    FROM ${postgresUtil.table('candles')}
    ORDER BY start LIMIT 1
  ) as first,
  (
    SELECT start
    FROM ${postgresUtil.table('candles')}
    ORDER BY start DESC
    LIMIT 1
  ) as last
  `));
    let rows = [];
    query.on('row', function(row) {
        rows.push(row);
    });

    query.on('end',function(){
        next(null, _.first(rows));
    });
}

Reader.prototype.close = function() {
    this.db.end();
}

module.exports = Reader;

 

