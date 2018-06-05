let _ = require('lodash');
let fs = require('fs');
let pg = require('pg');
let util = require('../../core/util');
let config = util.getConfig();
let dirs = util.dirs();
let log = require(util.dirs().core + 'log');
let postgresUtil = require('./util');
let adapter = config.postgresql;
let pluginHelper = require(dirs.core + 'pluginUtil');
let pluginMock = {
    slug: 'postgresql adapter',
    dependencies: config.postgresql.dependencies
};
let cannotLoad = pluginHelper.cannotLoad(pluginMock);
if(cannotLoad){
    util.die(cannotLoad);
}
let plugins = require(util.dirs().gekko + 'plugins');
let version = adapter.version;
let dbName = postgresUtil.database();
let mode = util.gekkoMode();
let connectionString = config.postgresql.connectionString+"/postgres";
let checkClient = new pg.Client(connectionString);
let client = new pg.Client(config.postgresql.connectionString+"/" +dbName);
checkClient.connect(function (err) {
    if(err){
        util.die(err);
}
log.debug("Check databases exists: "+dbName);
query = checkClient.query("select count(*) from pg_catalog.pg_database where datname = $1",[dbName],
    (err,res) => {
    if(err){
        util.die(err);
    }
    if (res.rows[0].count == 0){
        log.debug("Database "+dbName+ "does not exist");
        if(mode === 'realtime'){
            log.debug("Creating database "+dbName);
            checkClient.query("CREATE DATABASE "+dbName,function (err) {
                if(err){
                    util.die(err);
                }
                else {
                    client.connect(function (err) {
                        if(err){
                            util.die(err);
                        }
                        log.debug("Postgres connected to" +dbName);
                    });
                }
            });
        }else if (mode === 'backtest'){
            util.die(`History does not exist for exchange ${config.watch.exchange}`);
        } else {
            util.die(`Start gekko first in realtime mode to create tables. You are currently in the '${mode}' mode.`);
        }
    } else {
        log.debug("Database exists: "+dbName);
        client.connect(function (err) {
            checkClient.end();
            if(err){
                util.die(err);
            }
            log.debug("Postgres connected to "+dbName);
        });
    }
    });
});
module.exports = client;