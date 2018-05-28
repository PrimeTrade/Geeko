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
  let plugins=[];
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
  
}