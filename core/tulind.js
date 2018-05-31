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

methods.aroonosc ={
	requires: ['optInTimePeriod'],
	create: (params) => {
		verifyParams('aroonosc',params);
		
		return (data,callback) => execute(callback, {
			indicator: tulid.indicator.aroonosc,
			input: [data.high, data.low],
			options: [params.optInTimePeriod],
			results: ['result'],
		});
	}
}

methods.atr ={
	requires: ['optInTimePeriod'],
	create: (params)  =>{
		verifyParams('atr',params);
		
		return (data,callback) => execute(callback, {
			indicators: tulid.indicator.atr,
			input: [data.high, data.low, data.close],
			options: [params.optInPeriod],
			results: ['result'],
		});
	}

}

methods.avgprice ={
	requires: [],
	create: (params) =>{
		verifyParams('avgprice',params);
		
		return(data,callback) => execute(callback,{
			indicator: tulid.indicator.avgprice,
			input: [data.open, data.high, data.close, data.low],
			options: [],
			results: ['result'],
		});
	}	
}

methods.bbands ={
	requires: ['optInTimePeriod', 'optInNbStdDevs'],
	create: (params) =>{
		verifyParams('bbands',params);
		
		return (data,callback) => execute(callback,{
			indicator: tulid.indicator.bbands,
			input: [data.close],
			options: [params.optInTimePeriod, params.optInNbStdDevs],
			results: ['bbandsLower', 'bbandsMiddle', 'bbandsUpper'],
		});
	}
}

methods.bop ={
	requires: [],
	create: (param) => {
		verifyParams('bob',params);
		
		return (data,callback) => execute(callback,{
		
			indicator: tulid.indicator.bop,
			input: [data.open, data.high, data.low, data.close],
			options: [],
			results: ['results'],
		});
	}
}

methods.cci ={
	requires: ['optInTimePeriod'],
	create: (param) => {
		verifyParams('cci',params);
		return(data,callback)=>execute(callback,{
			indicator: tulind.indicator.cci,
			input: [data.high, data.low, data.close],
			options: [params.optInTimePeriod],
			result: ['result'],
		});
	}
}

methods.cvi ={
	requires: ['optInTimePeriod'],
	create: (param) =>{
		verifyParams('cvi',params);
		
		return(data,callback)=> execute(callback,{
			indicator: tulind.indicator.cvi,
			input: [data.high, data.low],
			options: [params.optInTimePeriod],
			result: ['result'],
		});
	}
}


methods.cmo ={
	requires: ['optInTimePeriod'],
	create: (param) =>{
		verifyParam('cmo',params);
		
		return(data,callback) => execute(callback,{
			indicator: tulind.indicator.cmo,
			input: [data.close],
			options: [params.optInTimePeriod],
			result: ['result'],
		});
	}
}




