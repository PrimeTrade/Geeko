const fs = require('fs');
const _ = require('lodash');
const toml = require('toml');

const util = require('../util');
const dirs = util.dirs();

const getTOML = function (fileName) {
    let raw = fs.readFileSync(fileName);
    return toml.parse(raw);
}

module.exports = function () {
    const configDir = util.dirs().config;

    let _config = getTOML(configDir + 'general.toml');
    fs.readdirSync(configDir + 'plugins').forEach(function (pluginFile) {
        let pluginName = _.first(pluginFile.split('.'));
        _config[pluginName] = getTOML(configDir + 'plugins/' +pluginFile);


    });

}