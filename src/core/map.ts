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
      x: TERRAIN[0].length,
      y: TERRAIN.length
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

export const TERRAIN = getTerrainFromString(`
111111111111
1p00000000p1
101110011101
100000000001
100111111001
100010000001
100000010001
100111111001
100000000001
101110011101
1p00000000p1
111111111111
`);

function getTerrainFromString(map: string) {
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
