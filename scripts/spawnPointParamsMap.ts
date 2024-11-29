/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-var-requires */
import type { Position3D, PositionMap } from 'electron/src/types';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

interface Locations {
  bigmap: SpawnPointParam[];
  develop: SpawnPointParam[];
  factory4_day: SpawnPointParam[];
  factory4_night: SpawnPointParam[];
  hideout: SpawnPointParam[];
  interchange: SpawnPointParam[];
  laboratory: SpawnPointParam[];
  lighthouse: SpawnPointParam[];
  privatearea: SpawnPointParam[];
  rezervbase: SpawnPointParam[];
  shoreline: SpawnPointParam[];
  suburbs: SpawnPointParam[];
  tarkovstreets: SpawnPointParam[];
  terminal: SpawnPointParam[];
  town: SpawnPointParam[];
  woods: SpawnPointParam[];
}

interface SpawnPointParam {
  Id: string;
  Position: Position3D;
}

function distance3D(a: Position3D, b: Position3D) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
}

function main() {
  const locations: Locations = require(resolve('data', 'spawnPointParams.json'));
  const positionMaps: {
    bigmap?: PositionMap[];
    develop?: PositionMap[];
    factory4_day?: PositionMap[];
    factory4_night?: PositionMap[];
    hideout?: PositionMap[];
    interchange?: PositionMap[];
    laboratory?: PositionMap[];
    lighthouse?: PositionMap[];
    privatearea?: PositionMap[];
    rezervbase?: PositionMap[];
    shoreline?: PositionMap[];
    suburbs?: PositionMap[];
    tarkovstreets?: PositionMap[];
    terminal?: PositionMap[];
    town?: PositionMap[];
    woods?: PositionMap[];
  } = {};
  for (const location in locations) {
    if (['Town', 'Terminal', 'Suburbs', 'Private Area', 'hideout', 'develop', 'factory4_night'].includes(location)) continue;
    const spawns = locations[location as keyof Locations]
      .sort((a, b) => {
        if (a.Position.x > b.Position.x) return -1;
        if (a.Position.x < b.Position.x) return 1;
        if (a.Position.z > b.Position.z) return -1;
        if (a.Position.z < b.Position.z) return 1;
        return 0;
      }).map((spawn) => ({
        Id: spawn.Id,
        Position: spawn.Position,
      }));

    if (positionMaps[location as keyof Locations] === undefined) {
      positionMaps[location as keyof Locations] = [];
    }
    const positionMap = positionMaps[location as keyof Locations]!;

    let x = 100;
    let y = 100;
    for (const spawn of spawns) {
      let closeI = -1;
      outer: for (let i = 0; i < positionMap.length; i++) {
        for (const { id } of positionMap[i].locations) {
          const item = spawns.find((s) => s.Id === id)!;
          if (distance3D(spawn.Position, item.Position) < 10) {
            closeI = i;
            break outer;
          }
        }
      }
      if (closeI === -1) {
        positionMap.push({
          pixel: { x, y },
          locations: [{ id: spawn.Id, position: spawn.Position }],
        });
        x += 110;
        if (x > 1000) {
          x = 100;
          y += 110;
        }
      } else {
        positionMap[closeI].locations.push({ id: spawn.Id, position: spawn.Position });
      }
    }
  }
  writeFileSync(
    resolve('data', `positionMaps_${new Date().toISOString().replace(/:/g, '-')}.json`),
    JSON.stringify(positionMaps, null, 2),
    'utf8',
  );
}

main();
