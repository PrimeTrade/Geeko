const fork = require('child_process').fork;
const _ = require('lodash');

module.exports = (config, callback)=> {
    let debug = typeof v8debug === 'object';
    if (debug)
        process.execArgv = [];


    const child = fork(__dirname + '/child');

    const msg = {
        what: 'start', config
    }

    const done = _.once(callback);

    child.on('message', (m) => {
        if (m === 'ready')
            return child.send(msg);
        //else we have candles and are done
        done(null, m);
        child.kill('SIGINT');
    });

    child.on('exit', code => {
        if (code !== 0)
            done('Error: unable to load candles, please check the console.');
    });
}
