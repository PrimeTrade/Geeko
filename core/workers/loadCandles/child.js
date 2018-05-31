let start = (config, candleSize, daterange)=>{
    let util = require('../../util');

    //force correct geeko env
    util.setGekkoEnv('child-process');

    //force disable debug
    util.debug = false;
    util.setConfig(config);

    let dirs = util.dirs();
    let load = require(dirs.tools + 'candleLoader');
    load(config.candleSize, candles=>{
        process.send(candles);
    })
}
process.send('ready');

process.on('message', (m)=>{
    if(m.what === 'start')
        start(m.config, m.candleSize, m.daterange);
});