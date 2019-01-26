import { ServerMessages, ClientMessages } from "../core/messages";
import { GameBase, Player } from "../core/game-base";

export class Game extends GameBase {
  addPlayer(id: string, data: ClientMessages["newPlayer"]) {
    const player = new Player(id);
    player.position = this.size.copy().divide(2);
    player.color = data.color;
    player.name = data.name;
    this.players[id] = player;
  }
  removePlayer(id: string) {
    delete this.players[id];
  }
  getState(): ServerMessages["sync"] {
    return { players: this.players, size: this.size };
  }
}
