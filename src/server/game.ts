import { ServerMessages } from "../core/messages";
import { GameBase, Player } from "../core/game-base";

export class Game extends GameBase {
  addPlayer(id: string) {
    const player = new Player(id);
    player.position = this.size.copy().divide(2);
    this.players[id] = player;
  }
  removePlayer(id: string) {
    delete this.players[id];
  }
  getState(): ServerMessages["sync"] {
    return { players: this.players, size: this.size };
  }
}
