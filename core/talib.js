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
let execute = (callback, params)=> {
    let talibCallback = (err, result) => {
        if (err) return callback(err);
        callback(null, result.result);
    };

    //talib legacy callback
    let talibLegacyCallback = (result) => {
        let error = result.error;
        talibCallback.apply(this, [error, result]);
    };

    return talib.execute(params, talibGTEv103 ? talibCallback : talibLegacyCallback);
}
    //helper functions that make sure all required parameters for a specific talib indicator are present.
    let verifyParams= (methodName, params)=>{
        let requiredParams = methods[methodName].requires;

        _.each(requiredParams, paramName=>{
            if(!_.has(params,paramName))
                throw talibError + methodName + 'requires' + paramName + '.';

            let val = params[paramName];
            if(!_.isNumber(val))
                throw talibError + paramName + 'needs to a number';
        });
    };
    let methods = {};
methods.cdl2crows = {
    require: [],
    create: (params)=>{
        verifyParams('cdl2crows', params);
        return (data, callback)=> execute(callback,{
          name: "CDL2CROWS",
          startIdx: 0,
          endIdx: data.close.length-1,
          open: data.open,
          high: data.high,
          low: data.low,
          close: data.close
        });
    }
};
methods.cdl3blackcrows = {
    requires: [],
    create: (params) => {
        verifyParams('cdl3blackcrows', params);
        return (data, callback) => execute(callback, {
            name: "CDL3BLACKCROWS",
            startIdx: 0,
            endIdx: data.close.length - 1,
            open: data.open,
            high: data.high,
            low: data.low,
            close: data.close
        });
    }
};
methods.cdl3inside = {
    requires: [],
    create: (params) => {
        verifyParams('cdl3inside', params);
        return (data, callback) => execute(callback, {
            name: "CDL3INSIDE",
            startIdx: 0,
            endIdx: data.close.length - 1,
            open: data.open,
            high: data.high,
            low: data.low,
            close: data.close
        });
    }
};

