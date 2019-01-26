import { GameBase, Player, Shot } from "../core/game-base";
import { ServerMessages } from "../core/messages";

export class Game extends GameBase {
  sync(data: ServerMessages["sync"]) {
    for (const id in data.players) {
      const newData = data.players[id];
      if (!this.players[id]) {
        this.players[id] = new Player(id);
      }
      const player = this.players[id];
      player.position.assign(newData.position);
      player.color = newData.color;
      player.name = newData.name;
    }
    this.shots = data.shots.map(shot => new Shot(shot.position, shot.speed));
  }
}
