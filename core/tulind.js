let semver = require("semver");
let lodash = require('lodash');

//catch the error while requiring the tulind module
try {
    let tulind = require("tulind");
} catch (e) {
    module.exports = null;
    return;
} 

let tulindError = 'Gekko was unable to configure Tulip Indicators';


let execute = function(callback, params) {
    let tulindCallback = function(err, result) {
        if (err) 
        	return callback(err);
        
        //if there is no error i.e err = false	
        let table = {}
        for (let i = 0; i < params.results.length; i++) {
        	//copy element to table array
            table[params.results[i]] = result[i];
        }
    
        callback(null, table);
    };
    return params.indicator.indicator(params.inputs, params.options, tulindCallback);
}


let verifyParams = (methodName, params) => {
    let requiredParams = methods[methodName].requires;
    
    lodash.each(requiredParams, paramName => {
        if(!lodash.has(params, paramName))
            throw tulindError + methodName + ' requires ' + paramName + '.';

        let val = params[paramName];

        if(!lodash.isNumber(val))
            throw tulindError + paramName + ' It should be a number';
    });
}