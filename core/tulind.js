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
			indicator: tulind.indicators.apo,
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
			indicator: tulind.indicator.aroon,
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
			indicator: tulind.indicator.aroonosc,
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
			indicators: tulind.indicator.atr,
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
			indicator: tulind.indicator.avgprice,
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
			indicator: tulind.indicator.bbands,
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
		
			indicator: tulind.indicator.bop,
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
			results: ['result'],
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
			results: ['result'],
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
			results: ['result'],
		});
	}
}

methods.dema ={
	requires: ['optInTimePeriod'],
	create: (param) => {
		verifyParam('dema',params);
		return (data,callback) => execute(callback,{
			indicator: tulind.indicator.dema,
			input: [data.close],
			options: [param.optInTimePeriod],
			results: ['result'],
		});
	}
}

methods.di={
	requires: ['optInTimePeriod'],
	create: (param)=> {
	
		verifyParam('di',param);
		return(data,callback) => execute(callback,{
			indicator: tulind.indicator.di,
			input: [data.high,data.low,data.close],
			options: [param.optInTimePeriod],
			results: ['diPlus','diMinus'],
		});
	}
}

methods.dm = {
	requires: ['optInTimePeriod'],
	create: (param)=> {
		verifyParam('dm',param);
		return (data, callback) => execute(callback,{
		
			indicator: tulind.indicator.dm,
			input: [data.high,data.low],
			options: [param.optInTimePeriod],
			results: ['dmPlus','dmLow'],
		});
	}

}


methods.dpo = {
	requires: ['optInTimePeriod'],
	create: (param)=> {
		verifyParam('dpo',param);
		return(data,callback) => execute(callback,{
			indicator:tulind.indicator.dm,
			input: [data.close],
			options: [param.optInTimePeriod],
			results: ['result'],
		});
	}
}

methods.dx = {
	requires: ['optInTimePeriod'],
	create:(param) => {
		verifyParam('dx',param);
		return(data,callback) => execute(callback,{
			indicator: tulind.indicator.dx,
			input: [data.high, data.close, data.low],
			options: [param.optInTimePeriod],
			results: ['result'],
		});
	}
}

methods.ema ={

	requires: ['optInTimePeriod'],
	create:(param) => {
		verifyParam('ema',param);
		return (data,callback)=> execute(callback,{
			
			indicator: tulind.indicator.ema,
			input : [data.close],
			options : [param.optInTimePeriod],
			results: ['result'],
		});
	}
}

methods.emv ={
	
	requires:[],
	create:(param) => {
		verifyParam('emv',param);
		return (data,callback)=> execute(callback,{
			indicator: tulind.indicator.emv,
			input: [data.high, data.low, data.volume],
			options :[],
			reults: [],
		
		});
	}
}


methods.fisher = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('fisher', params);

        return (data, callback) => execute(callback, {
            indicator: tulind.indicators.fisher,
            inputs: [data.high, data.low],
            options: [params.optInTimePeriod],
            results: ['fisher', 'fisherPeriod'],
        });
    }
}

methods.fosc = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('fosc', params);

        return (data, callback) => execute(callback, {
            indicator: tulind.indicators.fosc,
            inputs: [data.close],
            options: [params.optInTimePeriod],
            results: ['result'],
        });
    }
}

methods.hma ={

	requires: ['optInTimePeriod'],
	create: (param) => {
		
		verifyParams('hma',params);
		return (data, callback) => execute(callback, {
			indicator: tulind.indicators.hma,
            inputs: [data.close],
            options: [params.optInTimePeriod],
            results: ['result'],
        });
	}
}

methods.kama = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('kama', params);

        return (data, callback) => execute(callback, {
            indicator: tulind.indicators.kama,
            inputs: [data.close],
            options: [params.optInTimePeriod],
            results: ['result'],
        });
    }
}

methods.kvo = {
    requires: ['optInFastPeriod', 'optInSlowPeriod'],
    create: (params) => {
        verifyParams('kvo', params);

        return (data, callback) => execute(callback, {
            indicator: tulind.indicators.kvo,
            inputs: [data.high, data.low, data.close, data.volume],
            options: [params.optInFastPeriod, params.optInSlowPeriod],
            results: ['result'],
        });
    }
}

methods.linreg = {

    requires: ['optInTimePeriod'],
    create: (params) => {
    
        verifyParams('linreg', params);

        return (data, callback) => execute(callback, {
            indicator: tulind.indicators.linreg,
            inputs: [data.close],
            options: [params.optInTimePeriod],
            results: ['result'],
        });
    }
    
}

methods.linregintercept = {
    requires: ['optInTimePeriod'],
    create: (params) => {
    
        verifyParams('linregintercept', params);

        return (data, callback) => execute(callback, {
        
            indicator: tulind.indicators.linregintercept,
            inputs: [data.close],
            options: [params.optInTimePeriod],
            results: ['result'],
            
        });
    }
}

methods.linregslope = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('linregslope', params);

        return (data, callback) => execute(callback, {
            indicator: tulind.indicators.linregslope,
            inputs: [data.close],
            options: [params.optInTimePeriod],
            results: ['result'],
        });
    }
}

methods.macd = {
    requires: ['optInFastPeriod', 'optInSlowPeriod', 'optInSignalPeriod'],
    create: (params) => {
    
        verifyParams('macd', params);

        return (data, callback) => execute(callback, {
        
            indicator: tulind.indicators.macd,
            inputs: [data.close],
            options: [params.optInFastPeriod, params.optInSlowPeriod, params.optInSignalPeriod],
            results: ['macd', 'macdSignal', 'macdHistogram'],
            
        });
    }
}

methods.marketfi = {
    requires: [],
    create: (params) => {
        verifyParams('marketfi', params);

        return (data, callback) => execute(callback, {
        
            indicator: tulind.indicators.marketfi,
            inputs: [data.high, data.low, data.volume],
            options: [],
            results: ['result'],
        });
    }
}

methods.mass = {
    requires: ['optInTimePeriod'],
    create: (params) => {
    
        verifyParams('mass', params);

        return (data, callback) => execute(callback, {
        
            indicator: tulind.indicators.mass,
            inputs: [data.high, data.low],
            options: [params.optInTimePeriod],
            results: ['result'],
            
        });
    }
}

methods.medprice = {

    requires: [],
    create: (params) => {
        verifyParams('medprice', params);

        return (data, callback) => execute(callback, {
            indicator: tulind.indicators.medprice,
            inputs: [data.high, data.low],
            options: [],
            results: ['result'],
        });
    }
}

methods.mfi = {
    requires: ['optInTimePeriod'],
    create: (params) => {
    
        verifyParams('mfi', params);

        return (data, callback) => execute(callback, {
            indicator: tulind.indicators.mfi,
            inputs: [data.high, data.low, data.close, data.volume],
            options: [params.optInTimePeriod],
            results: ['result'],
        });
    }
}

methods.msw = {

    requires: ['optInTimePeriod'],
    
    create: (params) => {
    
        verifyParams('msw', params);

        return (data, callback) => execute(callback, {
            indicator: tulind.indicators.msw,
            inputs: [data.close],
            options: [params.optInTimePeriod],
            results: ['mswSine', 'mswLead'],
        });
    }
    
}

methods.natr = {

    requires: ['optInTimePeriod'],
    create: (params) => {
    
        verifyParams('natr', params);

        return (data, callback) => execute(callback, {
        
            indicator: tulind.indicators.natr,
            inputs: [data.high, data.low, data.close],
            options: [params.optInTimePeriod],
            results: ['result'],
            
        });
    }
}

methods.nvi = {
    requires: [],
    create: (params) => {
        verifyParams('nvi', params);

        return (data, callback) => execute(callback, {
            indicator: tulind.indicators.nvi,
            inputs: [data.close, data.volume],
            options: [],
            results: ['result'],
        });
    }
}


methods.obv ={
	requires: [],
	create: (param) =>{
	
		verifyParam('obv',params);
		return (data,callback)=> execute(callback,{
			
			indicator: tulind.indicator.obv,
			input: [data.close,data.volume],
			options: [],
			results: ['results'],
		});
	}
}

methods.ppo = {
    requires: ['optInFastPeriod', 'optInSlowPeriod'],
    create: (params) => {
        verifyParams('ppo', params);

        return (data, callback) => execute(callback, {
            indicator: tulind.indicators.ppo,
            inputs: [data.close],
            options: [params.optInFastPeriod, params.optInSlowPeriod],
            results: ['result'],
        });
    }
}

methods.psar = {
    requires: ['optInAcceleration', 'optInMaximum'],
    create: (params) => {
        verifyParams('psar', params);

        return (data, callback) => execute(callback, {
            indicator: tulind.indicators.psar,
            inputs: [data.high, data.low],
            options: [params.optInAcceleration, params.optInMaximum],
            results: ['result'],
        });
    }
}

methods.pvi = {
    requires: [],
    create: (params) => {
        verifyParams('pvi', params);

        return (data, callback) => execute(callback, {
            indicator: tulind.indicators.pvi,
            inputs: [data.close, data.volume],
            options: [],
            results: ['result'],
        });
    }
}

methods.qstick= {
	requires: ['optInTimePeriod'],
	create: (params) => {
		verifyParam('qstick',params);
		
		return (data,callback) => execute(callback,{
		
			indicator: tulind.indictors.qstick,
			inputs: [data.open, data.close],
			options: [param.optInTimePeriod],
			results: ['result'],
		});
	}
}

methods.roc= {
	requires: ['optInTimePeriod'],
	create: (params) => {
	
		verifyParam('roc',params);
		
		return (data,callback) => execute(callback,{
			indicator: tulind.indicators.roc,
			input: [data.close],
			options: [param.optInTimePeriod],
			results: ['result'],
		});
	}
}

methods.rocr = {
	requires: ['optInTimePeriod'],
	create: (params) => {
		verifyParam('rocr',params);
		return (data,callback)=> execute(callback,{
			indicator: tulind.indicator.rocr,
			input: [data.close],
			operations: [param.optInTimePeriod],
			results: ['result'],
		});
	
	}
}

methods.rsi ={

	requires: ['optInTimePeriod'],
	create:(parms)=> {
		verifyParam('rsi',params);
		return (data,callback)=> execute(callback,{
			indicator: tulind.indicator.rsi,
			input: [data.close],
			options: [param.optInTimePeriod],
			results: ['results'],
		});
	}
}

methods.sma = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('sma', params);

        return (data, callback) => execute(callback, {
            indicator: tulind.indicators.sma,
            inputs: [data.close],
            options: [params.optInTimePeriod],
            results: ['result'],
        });
    }
}

methods.stoch = {
    requires: ['optInFastKPeriod', 'optInSlowKPeriod', 'optInSlowDPeriod'],
    create: (params) => {
        verifyParams('stoch', params);

        return (data, callback) => execute(callback, {
            indicator: tulind.indicators.stoch,
            inputs: [data.high, data.low, data.close],
            options: [params.optInFastKPeriod, params.optInSlowKPeriod, params.optInSlowDPeriod],
            results: ['stochK', 'stochD'],
        });
    }
}

methods.sum = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('sum', params);

        return (data, callback) => execute(callback, {
            indicator: tulind.indicators.sum,
            inputs: [data.close],
            options: [params.optInTimePeriod],
            results: ['result'],
        });
    }
}

methods.tema = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('tema', params);

        return (data, callback) => execute(callback, {
            indicator: tulind.indicators.tema,
            inputs: [data.close],
            options: [params.optInTimePeriod],
            results: ['result'],
        });
    }
}

methods.tr = {
    requires: [],
    create: (params) => {
        verifyParams('tr', params);

        return (data, callback) => execute(callback, {
            indicator: tulind.indicators.tr,
            inputs: [data.high, data.low, data.close],
            options: [],
            results: ['result'],
        });
    }
}

methods.trima = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('trima', params);

        return (data, callback) => execute(callback, {
            indicator: tulind.indicators.trima,
            inputs: [data.close],
            options: [params.optInTimePeriod],
            results: ['result'],
        });
    }
}

methods.trix = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('trix', params);

        return (data, callback) => execute(callback, {
            indicator: tulind.indicators.trix,
            inputs: [data.close],
            options: [params.optInTimePeriod],
            results: ['result'],
        });
    }
}

methods.tsf = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('tsf', params);

        return (data, callback) => execute(callback, {
            indicator: tulind.indicators.tsf,
            inputs: [data.close],
            options: [params.optInTimePeriod],
            results: ['result'],
        });
    }
}

methods.typprice = {
    requires: [],
    create: (params) => {
        verifyParams('typprice', params);

        return (data, callback) => execute(callback, {
            indicator: tulind.indicators.typprice,
            inputs: [data.high, data.low, data.close],
            options: [],
            results: ['result'],
        });
    }
}

methods.ultosc = {
    requires: ['optInTimePeriod1', 'optInTimePeriod2', 'optInTimePeriod3'],
    create: (params) => {
        verifyParams('ultosc', params);

        return (data, callback) => execute(callback, {
            indicator: tulind.indicators.ultosc,
            inputs: [data.high, data.low, data.close],
            options: [params.optInTimePeriod1, params.optInTimePeriod2, params.optInTimePeriod3],
            results: ['result'],
        });
    }
}

methods.vhf = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('vhf', params);

        return (data, callback) => execute(callback, {
            indicator: tulind.indicators.vhf,
            inputs: [data.close],
            options: [params.optInTimePeriod],
            results: ['result'],
        });
    }
}

methods.vidya = {
    requires: ['optInFastPeriod', 'optInSlowPeriod', 'optInAlpha'],
    create: (params) => {
        verifyParams('vidya', params);

        return (data, callback) => execute(callback, {
            indicator: tulind.indicators.vidya,
            inputs: [data.close],
            options: [params.optInFastPeriod, params.optInSlowPeriod, params.optInAlpha],
            results: ['result'],
        });
    }
}

methods.volatility = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('volatility', params);

        return (data, callback) => execute(callback, {
            indicator: tulind.indicators.volatility,
            inputs: [data.close],
            options: [params.optInTimePeriod],
            results: ['result'],
        });
    }
}

methods.vosc = {
    requires: ['optInFastPeriod', 'optInSlowPeriod'],
    create: (params) => {
        verifyParams('vosc', params);

        return (data, callback) => execute(callback, {
            indicator: tulind.indicators.vosc,
            inputs: [data.volume],
            options: [params.optInFastPeriod, params.optInSlowPeriod],
            results: ['result'],
        });
    }
}

methods.vwma = {
    requires: ['optInTimePeriod'],
    create: (params) => {
        verifyParams('vwma', params);

        return (data, callback) => execute(callback, {
            indicator: tulind.indicators.vwma,
            inputs: [data.close, data.volume],
            options: [params.optInTimePeriod],
            results: ['result'],
        });
    }
}

methods.wad = {
    requires: [],
    create: (params) => {
        verifyParams('wad', params);

        return (data, callback) => execute(callback, {
            indicator: tulind.indicators.wad,
            inputs: [data.high, data.low, data.close],
            options: [],
            results: ['result'],
        });
    }
}

methods.wcprice = {
    requires: [],
    create: (params) => {
        verifyParams('wcprice', params);

        return (data, callback) => execute(callback, {
            indicator: tulind.indicators.wcprice,
            inputs: [data.high, data.low, data.close],
            options: [],
            results: ['result'],
        });
    }
}







