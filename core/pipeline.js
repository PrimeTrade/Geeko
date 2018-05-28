/*

  A pipeline implements a full Gekko Flow based on a config and 
  a mode. The mode is an abstraction that tells Gekko what market
  to load (realtime, backtesting or importing) while making sure
  all enabled plugins are actually supported by that market.
*/

let uitl = require('/.util');
let _ = require('lodash');
let dirs=util.dirs();
let async = require('async');
let pipeline=(set)=>{
  let spies=set.spies || [];
  let mode=set.mode;
  let config=set.config;
  let plugins=[];//for all plugins
  let emitters={};//for emitted plugins
  let candleConsumers=[];
  let pluginParameters=require(dirs.gekko + 'plugins');
  let pluginHelper=require(dirs.core + 'pluginUtil');
  let loadPlugins=(next)=>{
    async.mapSeries(pluginParameters,pluginHelper.load,function(error,plug){
      if(error)
        return util.die(error,true);
      plugins=_.compact(plug);
      next();

    });
  };
  let referenceEmitters=(next)=>{
    _.each(plugins,(plugin)=>{
      if(plugin.meta,emits)
        emitters[plugin.meta.slug]=plugin;
    });
    next();
  }
  let subscribePlugins=(next)=>{
    let subscriptions=require(dirs.geeko+'subscriptions');
    let pluginSubscriptions=_.filter(subscriptions,(sub)=>{
      return sub.emitter!=='market';
    });
    plugins=plugins.concat(spies);//adding possible spies
    _.each(plugins,(plugin)=>{    //
      _.each(pluginSubscriptions,(sub)=>{
        if(_.has(plugin,sub.handler)){
          if(!emitters[sub.emitter]){      //if plugin wants to listen to something disabled
            return log.warn([plugin.meta.name,'wanted to listen to the',sub.emitter+',','however the',sub.emitter,'is disabled.'].join(' '));
          }
          emitters[sub.emitter].on(sub.event,plugin[sub.handler])
        }

      });
    });
    let marketSubscrtpitons=_.filter(subscriptions,{emitter:'market'});
    _.each(plugins,(plugin)=>{
      _.each(marketSubscrtpitons,(sub)=>{
        if(sub.event!=='candle')
          return;
        if(_.has(plugin,sub.handler))
          candleConsumers.push(plugin);
      });
    });
    next();
  }
  let prepareMarket=(next)=>{
    if(mode==='backtest' && config.backtest.daterange==='scan')
      require(dirs.core+'prepareDateRange')(next);
    else
      next();
  }
  log.info('Setting up Gekko in',mode,'mode');
  log.info('');
  async.series(
      loadPlugins,referenceEmitters,subscribePlugins,prepareMarket
  )

}