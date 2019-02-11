import { IPoint } from "./point";

export enum Block {
  Empty,
  Full,
  Player
}

export class Map {
  terrain: Block[][];
  size: IPoint;
  playerPositions: IPoint[];
  constructor(terrain: Block[][]) {
    this.terrain = terrain;
    this.size = {
      x: terrain[0].length,
      y: terrain.length
    };
    this.playerPositions = [];
    this.terrain.forEach((row, y) =>
      row.forEach((block, x) => {
        if (block === Block.Player) {
          this.playerPositions.push({ x, y });
        }
      })
    );
  }
}

export function getTerrainFromString(map: string) {
  return map
    .trim()
    .split("\n")
    .map(row =>
      row
        .split("")
        .map(block =>
          block === "0"
            ? Block.Empty
            : block === "p"
            ? Block.Player
            : Block.Full
        )
    );
}
