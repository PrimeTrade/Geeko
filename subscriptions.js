//Subscriptions glue plugin to events

let subscriptions = [
    {
        emitter: 'market',
        event: 'candle',
        handler: 'processCandle'
    },
    {
        emitter: 'market',
        event: 'history',
        handler: 'processHistory'
    },
    {
        emitter: 'tradingAdvisor',
        event: 'advice',
        handler: 'processAdvice'
    },
    {
        emitter: ['trader', 'paperTrader'],
        event: 'trade',
        handler: 'processTrade'
    },
    {
        emitter: ['trader', 'paperTrader'],
        event: 'portfolioUpdate',
        handler: 'processPortfolioUpdate'
    },
];

module.exports = subscriptions;