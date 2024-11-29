"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path_1 = require("path");
function toJSON(str) {
    try {
        return JSON.parse(str);
    }
    catch {
        return str;
    }
}
const dir = (0, path_1.resolve)(__dirname, '..');
const configFilepath = (0, path_1.resolve)(dir, 'config', 'config.json');
if (!(0, fs_1.existsSync)(configFilepath)) {
    if (!(0, fs_1.existsSync)((0, path_1.resolve)(dir, 'config'))) {
        (0, fs_1.mkdirSync)((0, path_1.resolve)(dir, 'config'));
    }
    (0, fs_1.writeFileSync)(configFilepath, JSON.stringify({
        autoOpen: true,
        disabled: false,
        lastMap: 'bigmap',
        maps: {},
        onlyOnce: false,
    }, null, 2));
}
else {
    const config = JSON.parse((0, fs_1.readFileSync)(configFilepath, 'utf8'));
    if (config.maps?.length === 0) {
        config.maps = {};
        (0, fs_1.writeFileSync)(configFilepath, JSON.stringify(config, null, 2));
    }
}
const logFilepath = (0, path_1.resolve)(dir, 'log.log');
let newFile = true;
function log(logger, url, info, output) {
    if (newFile) {
        (0, fs_1.writeFileSync)(logFilepath, '');
        newFile = false;
    }
    logger.info('info: ' + JSON.stringify(toJSON(info), null, 2));
    // logger.info('data: ' + JSON.stringify(toJSON(output), null, 2));
    let file = (0, fs_1.readFileSync)(logFilepath, 'utf8');
    file += '\n>>>>>> url: ' + url;
    file += '\ninfo: ' + JSON.stringify(toJSON(info), null, 2);
    // file += '\ndata: ' + JSON.stringify(toJSON(output), null, 2);
    (0, fs_1.writeFileSync)(logFilepath, file);
}
class EntryPointSelector {
    preSptLoad(container) {
        const logger = container.resolve('WinstonLogger');
        const databaseServer = container.resolve('DatabaseServer');
        const staticRouterModService = container.resolve('StaticRouterModService');
        const dynamicRouterModService = container.resolve('DynamicRouterModService');
        const locationController = container.resolve('LocationController');
        const inraidCallbacks = container.resolve('InraidCallbacks');
        const httpResponse = container.resolve('HttpResponseUtil');
        const setSpawnPointParams = {
            url: '/client/locations',
            action: (_url, _info, _sessionID, output) => {
                const locations = databaseServer.getTables().locations;
                const returnResult = {
                    locations: undefined,
                    paths: []
                };
                const spawnPointParams = {};
                const data = {};
                for (const name in locations) {
                    if (name === 'base') {
                        continue;
                    }
                    const map = locations[name].base;
                    spawnPointParams[map.Id] = map.SpawnPointParams.filter(x => x.Categories.includes('Player'));
                    map.Loot = [];
                    data[map._Id] = map;
                }
                (0, fs_1.writeFileSync)((0, path_1.resolve)(dir, 'data', 'spawnPointParams.json'), JSON.stringify(spawnPointParams, null, 2));
                returnResult.locations = data;
                returnResult.paths = locations.base.paths;
                return httpResponse.getBody(returnResult);
            }
        };
        const openEPSOnRaid = {
            url: '/singleplayer/settings/raid/menu',
            action: (_url, _info, _sessionID, output) => {
                this.timeout = setTimeout(() => {
                    console.log('Timeout');
                    (0, child_process_1.execFile)((0, path_1.resolve)(__dirname, '..', 'client', 'EntryPointSelector.exe'), {
                        cwd: (0, path_1.resolve)(__dirname, '..', 'client')
                    });
                }, 500);
                return inraidCallbacks.getRaidMenuSettings();
            }
        };
        const openEPSOnLocation = {
            url: '/eps/location',
            action: (_url, info, _sessionID, output) => {
                clearTimeout(this.timeout);
                const config = JSON.parse((0, fs_1.readFileSync)(configFilepath, 'utf8'));
                if (config.autoOpen) {
                    config.lastMap = info.locationId;
                    (0, fs_1.writeFileSync)(configFilepath, JSON.stringify(config, null, 2));
                    (0, child_process_1.execFile)((0, path_1.resolve)(__dirname, '..', 'client', 'EntryPointSelector.exe'), {
                        cwd: (0, path_1.resolve)(__dirname, '..', 'client')
                    });
                }
                return '';
            }
        };
        const main = {
            url: '/client/location/getLocalloot',
            action: (url, info, sessionID, output) => {
                log(logger, url, info, output);
                inraidCallbacks.registerPlayer(url, info, sessionID);
                const location = locationController.get(sessionID, info);
                try {
                    const config = JSON.parse((0, fs_1.readFileSync)(configFilepath, 'utf8'));
                    if (config.disabled)
                        throw new Error();
                    let locationId = info.locationId;
                    if (locationId === 'factory4_night')
                        locationId = 'factory4_day';
                    if (!config.maps[locationId]?.length)
                        throw new Error();
                    const SpawnPointParams = location.SpawnPointParams.filter(spp => {
                        return !spp.Categories.includes('Player') || config.maps[locationId].includes(spp.Id);
                    });
                    if (config.onlyOnce) {
                        config.maps[locationId] = [];
                        (0, fs_1.writeFileSync)(configFilepath, JSON.stringify(config, null, 2));
                    }
                    return httpResponse.getBody({
                        ...location,
                        SpawnPointParams,
                    });
                }
                catch (err) {
                    return httpResponse.getBody(location);
                }
            }
        };
        staticRouterModService.registerStaticRouter('StaticRoutePeekingAki', [
            // setSpawnPointParams,
            openEPSOnRaid,
            openEPSOnLocation,
        ], 'aki');
        dynamicRouterModService.registerDynamicRouter('DynamicRoutePeekingAki', [
            main,
        ], 'aki');
    }
}
module.exports = { mod: new EntryPointSelector() };
