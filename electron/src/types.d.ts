export declare type Position = { x: number, y: number };
export declare type Position3D = { x: number, y: number, z: number };
export declare type LocationId = 'bigmap' | 'factory4_day' | 'factory4_night' | 'interchange' | 'laboratory' | 'lighthouse' | 'rezervbase' | 'shoreline' | 'tarkovstreets' | 'woods';

interface Locations {
  [key: string]: PositionMap[];
}

export interface PositionMap {
  pixel: Position;
  locations: {
    id: string;
    position: Position3D;
  }[];
}

export interface Config {
  onlyOnce: boolean;
  disabled: boolean;
  autoOpen: boolean;
  lastMap: LocationId;
  maps: {
    [key in LocationId]: string[];
  };
}
