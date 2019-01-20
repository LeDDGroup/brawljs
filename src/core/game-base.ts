import { Point, IPoint } from "./point";
import { ClientMessages } from "./messages";

export class Player {
  lastMessage = "";
  position: Point = new Point();
  speed: Point = new Point();
  constructor(public id: string) {}
  update(status: { speed: IPoint }) {
    this.speed.assign(status.speed);
  }
}

export class GameBase {
  players: Record<keyof any, Player> = {};
  size = new Point({ x: 600, y: 600 });
  update() {
    for (const id in this.players) {
      const player = this.players[id];
      player.position.sum(player.speed);
    }
  }
  updatePlayer(id: string, data: ClientMessages["update"]) {
    const player = this.players[id];
    player.lastMessage = data.messageId;
    player.update(data);
  }
}
