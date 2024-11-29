import dotenv from 'dotenv';
import { BrowserWindow, app, ipcMain, screen } from 'electron';
import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { Config, LocationId, Locations, Position } from './types';

dotenv.config();

const logFile = createWriteStream(resolve('..', 'log.log'));
const configDir = resolve('..', 'config');
const configPath = resolve(configDir, 'config.json');
if (!existsSync(configDir)) {
  mkdirSync(configDir);
}

function log(...xs: any[]) {
  for (let i = 0; i < xs.length; i++) {
    const x = xs[i];
    console.log(x);
    logFile.write(typeof x !== 'object' ? String(x) : JSON.stringify(x, null, 2));
    if (i < xs.length - 1) logFile.write(' ');
  }
  logFile.write('\n');
}

function getConfig(): Config {
  try {
    return JSON.parse(readFileSync(configPath, 'utf8'));
  } catch (error) {
    log(error);
    return {
      onlyOnce: false,
      disabled: false,
      autoOpen: true,
      maps: {} as any,
      lastMap: 'bigmap',
    };
  }
}

function createWindow() {
  const displays = screen.getAllDisplays();
  const primaryDisplay = screen.getPrimaryDisplay();
  const secondaryDisplay = displays.find((display) => display.id !== primaryDisplay.id);

  const win = new BrowserWindow({
    width: 800,
    height: 600,
    x: secondaryDisplay?.workArea.x || primaryDisplay.workArea.x,
    y: secondaryDisplay?.workArea.y || primaryDisplay.workArea.y,
    webPreferences: {
      preload: resolve(__dirname, 'client', 'public', 'preload.js'),
    },
    show: false,
    autoHideMenuBar: true,
  });
  if (process.env.MODE === 'dev')
    win.webContents.openDevTools();

  let positionMaps: Locations = {};
  ipcMain.handle('getPositionMaps', () => {
    try {
      positionMaps = JSON.parse(readFileSync(resolve('..', 'data', 'positionMaps.json'), 'utf8'));
      return positionMaps;
    } catch (error) {
      log(error);
      return [];
    }
  });
  ipcMain.handle('getConfig', () => getConfig());
  ipcMain.handle('changeAutoOpen', (event, checked: boolean) => {
    try {
      const config = getConfig();
      config.autoOpen = checked;
      writeFileSync(configPath, JSON.stringify(config, null, 2));
      return config;
    } catch (error) {
      log(error);
      return getConfig();
    }
  });
  ipcMain.handle('changeOnlyOnce', (event, checked: boolean) => {
    try {
      const config = getConfig();
      config.onlyOnce = checked;
      writeFileSync(configPath, JSON.stringify(config, null, 2));
      return config;
    } catch (error) {
      log(error);
      return getConfig();
    }
  });
  ipcMain.handle('changeDisabled', (event, checked: boolean) => {
    try {
      const config = getConfig();
      config.disabled = checked;
      writeFileSync(configPath, JSON.stringify(config, null, 2));
      return config;
    } catch (error) {
      log(error);
      return getConfig();
    }
  });
  ipcMain.handle('changeMap', (event, map: LocationId) => {
    try {
      const config = getConfig();
      config.lastMap = map;
      writeFileSync(configPath, JSON.stringify(config, null, 2));
      return config;
    } catch (error) {
      log(error);
      return getConfig();
    }
  });
  ipcMain.handle('addEntryPoint', (event, map: LocationId, position: Position) => {
    const positionMapped = positionMaps[map].find(p => p.pixel.x === position.x && p.pixel.y === position.y);
    try {
      const config = getConfig();
      if (positionMapped) {
        if (!config.maps[map]) config.maps[map] = [];
        config.maps[map].push(...positionMapped.locations.map(x => x.id));
      }
      writeFileSync(configPath, JSON.stringify(config, null, 2));
      return config;
    } catch (error) {
      log(error);
      return getConfig();
    }
  });
  ipcMain.handle('removeEntryPoint', (event, map: LocationId, position: Position) => {
    const positionMapped = positionMaps[map].find(p => p.pixel.x === position.x && p.pixel.y === position.y);
    try {
      const config = getConfig();
      if (positionMapped) config.maps[map] = config.maps[map].filter(l =>
        !positionMapped.locations.find(ll => l === ll.id)
      );
      writeFileSync(configPath, JSON.stringify(config, null, 2));
      return config;
    } catch (error) {
      log(error);
      return getConfig();
    }
  });

  win.loadFile(resolve(__dirname, 'client', 'index.html'));
  win.maximize();
  win.show();
  return win;
}

let myWindow: BrowserWindow | undefined;
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, _commandLine, _workingDirectory) => {
    const config = getConfig();
    if (myWindow && config.autoOpen) {
      if (myWindow.isMinimized()) myWindow.restore();
      myWindow.show();
      myWindow.webContents.send('map', config.lastMap);
    }
  });

  app.whenReady().then(() => {
    myWindow = createWindow();
  });

  app.on('window-all-closed', () => {
    logFile.close();
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}
