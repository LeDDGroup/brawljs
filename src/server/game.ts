import { ClientMessages } from "../core/messages";
import { GameBase, Player } from "../core/game-base";

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
  getMap() {
    return {
      terrain: this.map.terrain
    };
  }
  getState() {
    return { players: this.players, shots: this.shots };
  }
}
