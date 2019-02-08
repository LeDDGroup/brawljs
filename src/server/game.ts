import { ServerMessages, ClientMessages } from "../core/messages";
import { GameBase, Player } from "../core/game-base";
import { WORLD_SIZE, PLAYER_SPAWN_POINTS } from "../core/map";
import { Point } from "../core/point";

export class Game extends GameBase {
  addPlayer(id: string, data: ClientMessages["newPlayer"]) {
    const player = new Player(id);
    player.position = new Point(getRandom(PLAYER_SPAWN_POINTS)).sum(0.5);
    player.color = data.color;
    player.name = data.name;
    this.players[id] = player;
  }
  removePlayer(id: string) {
    delete this.players[id];
  }
  getMap(): ServerMessages["map"] {
    return {
      size: WORLD_SIZE
    };
  }
  getState(): ServerMessages["sync"] {
    return { players: this.players, shots: this.shots };
  }
}

function getRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * (arr.length - 1))];
}
