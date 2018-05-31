let util = require('../../util');
let dirs = util.dirs();
let ipc = require('relieve').IPCEE(process);

ipc.on('start', config=>{
    //correct geeko env forcefully
    util.setGekkoEnv('child-process');

    //force disable debug
    config.debug = false;

    //persist config
    util.setConfig(config);

    let scan = require(dirs.tools + 'dateRangeScanner');
    scan(
        (error, ranges, reader)=>{
            reader.close();
            ipc.send('ranges', ranges);
            process.exit(0);
        }
    );
});