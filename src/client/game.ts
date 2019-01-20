import { GameBase, Player } from "../core/game-base";
import { ServerMessages } from "../core/messages";

export class Game extends GameBase {
  sync(data: ServerMessages["sync"]) {
    for (const id in data.players) {
      const newData = data.players[id];
      if (!this.players[id]) {
        const player = new Player(id);
        this.players[id] = player;
      }
      this.players[id].position.assign(newData.position);
      // this.players[id].speed.assign(data.players[id].speed);
    }
  }
}
