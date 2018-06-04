const _ = require('lodash');
const async = require('async');
let pg = require('pg');

const util = require('../../core/util');
const config = util.getConfig();
const dirs = util.dirs();
let postgresUtil = require('./util');

let connectionString = config.postgresql.connectionString;

module.exports = done => {
    let scanClient = new pg.Client(connectionString+ "/postgres");
    let markets = [];
    scanClient.connect(function (err) {
        if(err){
            util.die(err);
    }
    let sql = "select database from pg_database";
    if(postgresUtil.useSingleDatabase()){
        sql = "select database from pg_database where database name=' " +postgresUtil.database() +"'";
    }
    let query = scanClient.query(sql,function (err,result) {
        async.each(result.rows, (dbRow,next) => {
            let scanTablesClient = new pg.Client(connectionString + "/" +dbRow.databasename);
            let dbName = dbRow.databasename;

            scanTablesClient.connect(function (err) {
                if(err){
                    return next();
                }
                let query = scanTablesClient.query(`
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema= '${postgresUtil.schema()}'
                `,function (err,result) {
                    if(err){
                        return util.die('At `scanning tables` DB error');
                    }
                    _.each(result.rows,table => {
                        let parts = table.table_name.split('_');
                        let first = parts.shift();
                        let exchangeName = dbName;

                        if(postgresUtil.useSingleDatabase()){
                            exchangeName = first;
                            first = parts.shift();
                        }
                        if(first === 'candles')
                            markets.push({
                                exchange: exchangeName,
                                currency: _.first(parts),
                                asset: _.last(parts),
                            });
                    });
                    scanTablesClient.end();
                    next();
                });
            });
        },
            err => {
            scanClient.end();
            done(err, markets);
            });
    });
});
}