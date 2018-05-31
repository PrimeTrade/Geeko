let fork = require('child_process').fork;

module.exports = (mode, config, callback)=> {
    let debug = typeof v8debug === 'object';
    if (debug)
        process.execArgv = [];
    let child = fork(__dirname + '/child');
// How we should handle client messages depends
// on the mode of the Pipeline that is being ran.

    let handle = require('./messageHandlers/' + mode + 'Handler')(callback);

    let message = {
        what: 'start', mode: mode, config: config
    };

    child.on('message', (m) => {
        if (m === 'ready')
            return child.send(message);

        if (m === 'done')
            return child.send({what: 'exit'});

        handle.message(m);
    });

    child.on('exit', handle.exit);
    return child;
}


