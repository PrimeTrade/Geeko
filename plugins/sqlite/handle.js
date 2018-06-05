let _ = require('lodash');
let fs = require('fs');

let util = require('../../core/util.js');
let config = util.getConfig();
let dirs = util.dirs();

let adapter = config.sqlite;

let pluginHelper = require(dirs.core + 'pluginUtil');
let pluginMock = {
    slug: 'sqlite adapter',
    dependencies: adapter.dependencies,
};
let cannotLoad = pluginHelper.cannotLoad(pluginMock);
if(cannotLoad)
    util.die(cannotLoad);
if(config.debug)
    let sqlite3 = require('sqlite3').verbose();
else
    let sqlite3 = require('sqlite3');
let plugins = require(util.dirs().gekko +'plugins');
let version = adapter.version;

let dbName = config.watch.exchange.toLowerCase() + '_' +version+ '.db';
let dir = dirs.gekko + adapter.dataDirectory;
let fullPath = [dir,dbName].join('/');
let mode = util.gekkoMode();
if(mode === 'realtime' || mode === 'importer'){
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
} else if (mode === 'backtest') {
    if (!fs.existsSync(dir)) util.die('History directory does not exist.');

    if (!fs.existsSync(fullPath))
        util.die(
            `History database does not exist for exchange ${
                config.watch.exchange
                } at version ${version}.`
        );
}

module.exports = {
    initDB: () => {
        let journalMode = config.sqlite.journalMode || 'PERSIST';
        let syncMode = journalMode === 'WAL' ? 'NORMAL' : 'FULL';

        let db = new sqlite3.Database(fullPath);
        db.run('PRAGMA synchronous = ' + syncMode);
        db.run('PRAGMA journal_mode = ' + journalMode);
        db.configure('busyTimeout', 1500);
        return db;
    }
};

}