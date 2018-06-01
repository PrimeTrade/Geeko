let sem = require('semver');
let _ = require('lodash');
//Validate that the talib is installed
try{
    var talib = require('talib');
} catch(e){
    module.exports = null;
    return;
}

let talibError = 'Geeko was unable to configure talib indicator:\n\t';
let talibGTEv103 = sem.gte(talib.version, '1.0.3');

//Wrapper that execute a talib indicator
let execute = (callback, params)=>{
    let talibCallback = (err, result)=>{
        if(err) return callback(err);
        callback(null, result.result);
    };

    //talib legacy callback
    let talibLegacyCallback = (result)=>{
        let error = result.error;
        talibCallback.apply(this, [error, result]);
    };

    return talib.execute(params, talibGTEv103 ? talibCallback : talibLegacyCallback);

}
