import { Point, IPoint } from "./point";
import { ClientMessages } from "./messages";

export class Player {
  lastMessage = "";
  name: string = "";
  color: string = "";
  position: Point = new Point();
  speed: Point = new Point();
  constructor(public id: string) {}
  sync(status: { speed: IPoint }) {
    this.speed.assign(status.speed);
  }
  update() {
    this.position.sum(this.speed);
  }
}

export class Shot {
  life = 30;
  position: Point;
  speed: Point;
  constructor(position: IPoint, speed: IPoint) {
    this.position = new Point(position);
    this.speed = new Point(speed);
  }
  update() {
    if (this.life > 0) {
      this.position.sum(this.speed);
      this.life--;
    }
  }
}

export class GameBase {
  players: Record<keyof any, Player> = {};
  shots: Shot[] = [];
  size = new Point({ x: 600, y: 600 });
  update() {
    for (const id in this.players) {
      this.players[id].update();
    }
    for (let i = 0; i < this.shots.length; i++) {
      const shot = this.shots[i];
      shot.update();
      if (shot.life <= 0) this.shots.splice(i, 1);
    }
  }
  syncPlayer(id: string, data: ClientMessages["update"]) {
    const player = this.players[id];
    player.lastMessage = data.messageId;
    player.sync(data);
    if (data.shoot) {
      const speed = new Point(data.shootDirection).top(3);
      this.shots.push(new Shot(player.position, speed));
    }
  }
}
