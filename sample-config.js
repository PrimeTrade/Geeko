let config = {};
config.debug = true;
config.watch = {
    exchange: 'poloniex',
    currency: 'USDT',
    asset: 'BTC',
}

//Configuring trading advice
config.tradingAdvisor = {
    enabled: true,
    method: 'MACD',
    candleSize: 60,
    historySize: 10,
}

//Exponential moving average settings
config.DEMA = {
    //EMA weight
    weight: 21,
    thresholds: {
        down: -0.025,
        up: 0.025
    }
};

//MACD settings
config.MACD = {
    short: 10,
    long: 21,
    signal: 9,

    thresholds: {
        down: -0.025,
        up: 0.025,
        persistence: 1
    }
};

//PPO Settings
config.PPO = {
    //EMA weight
    short: 12,
    long: 26,
    signal: 9,
    thresholds: {
        down: -0.025,
        up: 0.025,
        persistence: 2
    }
};

config.varPPO = {
    momentum: 'TSI', // RSI, TSI or UO
    thresholds: {
        // new threshold is default threshold + PPOhist * PPOweight
        weightLow: 120,
        weightHigh: -120,
        // How many candle intervals should a trend persist
        // before we consider it real?
        persistence: 0
    }
};

// RSI settings:
config.RSI = {
    interval: 14,
    thresholds: {
        low: 30,
        high: 70,
        // How many candle intervals should a trend persist
        // before we consider it real?
        persistence: 1
    }
};

// TSI settings:
config.TSI = {
    short: 13,
    long: 25,
    thresholds: {
        low: -25,
        high: 25,
        // How many candle intervals should a trend persist
        // before we consider it real?
        persistence: 1
    }
};

// Ultimate Oscillator Settings
config.UO = {
    first: {weight: 4, period: 7},
    second: {weight: 2, period: 14},
    third: {weight: 1, period: 28},
    thresholds: {
        low: 30,
        high: 70,
        // How many candle intervals should a trend persist
        // before we consider it real?
        persistence: 1
    }
};

// CCI Settings
config.CCI = {
    constant: 0.015, // constant multiplier. 0.015 gets to around 70% fit
    history: 90, // history size, make same or smaller than history
    thresholds: {
        up: 100, // fixed values for overbuy upward trajectory
        down: -100, // fixed value for downward trajectory
        persistence: 0 // filter spikes by adding extra filters candles
    }
};

// StochRSI settings
config.StochRSI = {
    interval: 3,
    thresholds: {
        low: 20,
        high: 80,
        // How many candle intervals should a trend persist
        // before we consider it real?
        persistence: 3
    }
};


// custom settings:
config.custom = {
    my_custom_setting: 10,
}

config['talib-macd'] = {
    parameters: {
        optInFastPeriod: 10,
        optInSlowPeriod: 21,
        optInSignalPeriod: 9
    },
    thresholds: {
        down: -0.025,
        up: 0.025,
    }
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//                       CONFIGURING PLUGINS
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// do you want Gekko to simulate the profit of the strategy's own advice?
config.paperTrader = {
    enabled: true,
    // report the profit in the currency or the asset?
    reportInCurrency: true,
    // start balance, on what the current balance is compared with
    simulationBalance: {
        // these are in the unit types configured in the watcher.
        asset: 1,
        currency: 100,
    },
    // how much fee in % does each trade cost?
    feeMaker: 0.15,
    feeTaker: 0.25,
    feeUsing: 'maker',
    // how much slippage/spread should Gekko assume per trade?
    slippage: 0.05,
}

config.performanceAnalyzer = {
    enabled: true,
    riskFreeReturn: 5
}

// Want Gekko to perform real trades on buy or sell advice?
// Enabling this will activate trades for the market being
// watched by `config.watch`.
config.trader = {
    enabled: false,
    key: '',
    secret: '',
    username: '', // your username, only required for specific exchanges.
    passphrase: '', // GDAX, requires a passphrase.
    orderUpdateDelay: 1, // Number of minutes to adjust unfilled order prices
}

config.adviceLogger = {
    enabled: false,
    muteSoft: true // disable advice printout if it's soft
}

config.pushover = {
    enabled: false,
    sendPushoverOnStart: false,
    muteSoft: true, // disable advice printout if it's soft
    tag: '[GEKKO]',
    key: '',
    user: ''
}

// want Gekko to send a mail on buy or sell advice?
config.mailer = {
    enabled: false,       // Send Emails if true, false to turn off
    sendMailOnStart: true,    // Send 'Gekko starting' message if true, not if false

    email: '',    // Your Gmail address
    muteSoft: true, // disable advice printout if it's soft

    // You don't have to set your password here, if you leave it blank we will ask it
    // when Gekko's starts.


    password: '',       // Your Gmail Password - if not supplied Gekko will prompt on startup.

    tag: '[GEKKO] ',      // Prefix all email subject lines with this

    //       ADVANCED MAIL SETTINGS
    // you can leave those as is if you
    // just want to use Gmail

    server: 'smtp.gmail.com',   // The name of YOUR outbound (SMTP) mail server.
    smtpauth: true,     // Does SMTP server require authentication (true for Gmail)
    // The following 3 values default to the Email (above) if left blank
    user: '',
    from: '',
    to: '',
    ssl: true,
    port: '',
}

config.pushbullet = {
    // sends pushbullets if true
    enabled: false,
    // Send 'Gekko starting' message if true
    sendMessageOnStart: true,
    // disable advice printout if it's soft
    muteSoft: true,
    // your pushbullet API key
    key: 'xxx',
    // your email, change it unless you are Azor Ahai
    email: 'jon_snow@westeros.org',
    // will make Gekko messages start mit [GEKKO]
    tag: '[GEKKO]'
};

config.kodi = {

    host: 'http://ip-or-hostname:8080/jsonrpc',
    enabled: false,
    sendMessageOnStart: true,
}

config.ircbot = {
    enabled: false,
    emitUpdates: false,
    muteSoft: true,
    channel: '#your-channel',
    server: 'irc.freenode.net',
    botName: 'gekkobot'
}

config.telegrambot = {
    enabled: false,
    token: 'YOUR_TELEGRAM_BOT_TOKEN',
};

config.twitter = {
    // sends pushbullets if true
    enabled: false,
    // Send 'Gekko starting' message if true
    sendMessageOnStart: false,
    // disable advice printout if it's soft
    muteSoft: false,
    tag: '[GEKKO]',
    // twitter consumer key
    consumer_key: '',
    // twitter consumer secret
    consumer_secret: '',
    // twitter access token key
    access_token_key: '',
    // twitter access token secret
    access_token_secret: ''
};

config.xmppbot = {
    enabled: false,
    emitUpdates: false,
    client_id: 'jabber_id',
    client_pwd: 'jabber_pw',
    client_host: 'jabber_server',
    client_port: 5222,
    status_msg: 'I\'m online',
    receiver: 'jabber_id_for_updates'
}

config.campfire = {
    enabled: false,
    emitUpdates: false,
    nickname: 'Gordon',
    roomId: null,
    apiKey: '',
    account: ''
}

config.redisBeacon = {
    enabled: false,
    port: 6379, // redis default
    host: '127.0.0.1', // localhost
    // On default Gekko broadcasts
    // events in the channel with
    // the name of the event, set
    // an optional prefix to the
    // channel name.
    channelPrefix: '',
    broadcast: [
        'candle'
    ]
}

config.slack = {
    enabled: false,
    token: '',
    sendMessageOnStart: true,
    muteSoft: true,
    channel: '' // #tradebot
}

config.ifttt = {
    enabled: false,
    eventName: 'gekko',
    makerKey: '',
    muteSoft: true,
    sendMessageOnStart: true
}

config.candleWriter = {
    enabled: false
}

config.adviceWriter = {
    enabled: false,
    muteSoft: true,
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//                       CONFIGURING ADAPTER
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

config.adapter = 'sqlite';

config.sqlite = {
    path: 'plugins/sqlite',

    dataDirectory: 'history',
    version: 0.1,

    journalMode: require('./web/isWindows.js') ? 'DELETE' : 'WAL',

    dependencies: []
}

// Postgres adapter example config (please note: requires postgres >= 9.5):
config.postgresql = {
    path: 'plugins/postgresql',
    version: 0.1,
    connectionString: 'postgres://user:pass@localhost:5432', // if default port
    database: null, // if set, we'll put all tables into a single database.
    schema: 'public',
    dependencies: [{
        module: 'pg',
        version: '6.1.0'
    }]
}

// Mongodb adapter, requires mongodb >= 3.3 (no version earlier tested)
config.mongodb = {
    path: 'plugins/mongodb',
    version: 0.1,
    connectionString: 'mongodb://localhost/gekko', // connection to mongodb server
    dependencies: [{
        module: 'mongojs',
        version: '2.4.0'
    }]
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//                       CONFIGURING BACKTESTING
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


config.backtest = {
    daterange: 'scan',

    batchSize: 50
}





config.importer = {
    daterange: {
        // NOTE: these dates are in UTC
        from: "2017-11-01 00:00:00",
        to: "2017-11-20 00:00:00"
    }
}


config['I understand that Gekko only automates MY OWN trading strategies'] = false;

module.exports = config;



