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


let methods = {};

methods.ad = {
    requires: [],
    create: (params) => {
        verifyParams('ad', params);

        return (data, callback) => execute(callback, {
            indicator: tulind.indicators.ad,
            inputs: [data.high, data.low, data.close, data.volume],
            options: [],
            results: ['result'],
        });
    }
}

methods.adosc = {
    requires: ['optInFastPeriod', 'optInSlowPeriod'],
    create: (params) => {
        verifyParams('adosc', params);

        return (data, callback) => execute(callback, {
            indicator: tulind.indicators.adosc,
            inputs: [data.high, data.low, data.close, data.volume],
            options: [params.optInFastPeriod, params.optInSlowPeriod],
            results: ['result'],
        });
    }
}

methods.adx = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('adx', params);

        return (data, callback) => execute(callback, {
            indicator: tulind.indicators.adx,
            inputs: [data.high, data.low, data.close],
            options: [params.optInTimePeriod],
            results: ['result'],
        });
    }
}

methods.adxr = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('adxr', params);

        return (data, callback) => execute(callback, {
            indicator: tulind.indicators.adxr,
            inputs: [data.high, data.low, data.close],
            options: [params.optInTimePeriod],
            results: ['result'],
        });
    }
}

methods.ao = {
    requires: [],
    create: (params) => {
        verifyParams('ao', params);

        return (data, callback) => execute(callback, {
            indicator: tulind.indicators.ao,
            inputs: [data.high, data.low],
            options: [],
            results: ['result'],
        });
    }
}

methods.apo ={
	requires: ['optInfastPeriod', 'optInSlowPeriod'],
	create: (params) => {
		verifyParams('apo' , params);
		
		return (data, callback) => execute(callback, {
			indicator: tulid.indicators.apo,
			inputs: [data.close],
			options: [params.optInfastPeriod , params.optInSlowPeriod],
			results:['result'],
		});
	}
}

methods.aroon ={
	requires: ['optInTimePeriod'],
	create: (params) =>{
		verifyParams('aroon', params);
		
		return (data,callback) => execute(callback, {
			indicator: tulid.indicator.aroon,
			input: [data.high, data.low],
			options: [params.optInTimePeriod],
			results: ['aroonDown','aroonwUp'],
		});
	}
}








