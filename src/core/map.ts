import { Point } from "./point";
import { Data } from "./types";

export enum Block {
  Empty,
  Full,
  Player,
  Cover
}

export class GameMap {
  terrain: Block[][];
  size: Point;
  playerPositions: Point[];
  constructor(terrain: Block[][]) {
    this.terrain = terrain;
    this.size = new Point({
      x: terrain[0].length,
      y: terrain.length
    });
    this.playerPositions = [];
    this.terrain.forEach((row, y) =>
      row.forEach((block, x) => {
        if (block === Block.Player) {
          this.playerPositions.push(new Point({ x, y }));
        }
      })
    );
  }
  blockAt(point: Data<Point>) {
    return this.terrain[point.y][point.x];
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
            : block === "#"
            ? Block.Cover
            : Block.Full
        )
    );
}
