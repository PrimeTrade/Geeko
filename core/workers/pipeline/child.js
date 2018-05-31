let start = (mode, config)=>{
    let util = require('../../util');

    //correcting geeko env forcefully
    util.setGekkoEnv('child-process');

    //Correcting geeko config and mode
    util.setGekkoMode(mode);
    util.setConfig(config);

    let pipeline = require(dirs.core + 'pipeline');
    pipeline({
        config: config,
        mode: mode
    });
}

process.send('ready');

process.on('message',(m)=>{
    if(m.what === 'start')
        start(m.mode, m.config);

    if(m.what === 'exit')
        process.exit(0);
});

process.on('disconnect',()=>{
    console.log('disconnect');
    process.exit(-1);
})