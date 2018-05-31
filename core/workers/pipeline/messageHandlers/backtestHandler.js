module.exports =done=>{
    let trades =[];
    let roundtrips = [];
    let candles = [];
    let report = false;
    // listen to all messages and internally queue all candles and trades

    return{
        message: msg=>{

            if(msg.type === 'candle')
                candles.push(message.candle);
            else if(msg.type === 'trade')
                trades.push(message.trade);
            else if(msg.type === 'roundtrip')
                roundtrips.push(message.roundtrip);
            else if(msg.type === 'report')
                report = msg.report;
            else if(msg.log)
                console.log(msg.log);
        },
        exit: status => {
            if(status !== 0)
                done('child process has died');
            else
                done(null, {
                    trades: trades, candles: candles, report: report, roundtrips: roundtrips
                });
        }
    }
}