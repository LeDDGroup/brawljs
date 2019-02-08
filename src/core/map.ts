import { Point, IPoint } from "./point";

export const BLOCK_EMPTY = 0;
export const BLOCK_FULL = 1;
export const BLOCK_PLAYER_SPAWN = 2;

export const PLAYER_SPAWN_POINTS: IPoint[] = [];

export const MAP = `
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
`
  .trim()
  .split("\n")
  .map((el, y) =>
    el
      .split("")
      .map((s, x) =>
        s === "0"
          ? BLOCK_EMPTY
          : s === "p"
          ? (PLAYER_SPAWN_POINTS.push({ y, x }), BLOCK_PLAYER_SPAWN)
          : BLOCK_FULL
      )
  );

export const WORLD_SIZE = new Point({
  x: MAP[0].length,
  y: MAP.length
});
