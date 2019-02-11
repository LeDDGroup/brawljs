import { ServerMessages, ClientMessages } from "../core/messages";
import { GameBase, Player } from "../core/game-base";
import { WORLD_SIZE } from "../core/map";

export class Game extends GameBase {
  addPlayer(id: string, data: ClientMessages["newPlayer"]) {
    const player = new Player(id);
    player.position.assign(this.getRandomPlayerPosition());
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
  getState() {
    return { players: this.players, shots: this.shots };
  }
}
