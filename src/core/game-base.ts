import { Point, IPoint } from "./point";
import { ClientMessages, IPlayer } from "./messages";
import { Circle } from "./shape";

const SHOOT_COOLDOWN = 60;
const SPEED = 1;
const SHOT_SIZE = 5;
const PLAYER_SIZE = 10;

export class Player extends Circle implements IPlayer {
  life: number = 100;
  lastMessage = "";
  name: string = "";
  color: string = "";
  speed: Point = new Point();
  shootCooldown: number = 0;
  constructor(public id: string) {
    super(PLAYER_SIZE);
  }
  sync(status: { speed: IPoint }) {
    this.speed.assign(status.speed).top(SPEED);
  }
  update() {
    if (this.shootCooldown > 0) {
      this.shootCooldown--;
    }
    this.position.sum(this.speed);
  }
}

export class Shot extends Circle {
  playerId: Player["id"];
  life = 30;
  position: Point;
  speed: Point;
  constructor(position: IPoint, speed: IPoint, playerId: Player["id"]) {
    super(SHOT_SIZE);
    this.playerId = playerId;
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
      const damage = 50;
      for (const key in this.players) {
        const player = this.players[key];
        if (
          player.life > 0 &&
          shot.playerId !== player.id &&
          player.collides(shot)
        ) {
          player.life -= damage;
          shot.life = 0;
        }
      }
      shot.update();
      if (shot.life <= 0) this.shots.splice(i, 1);
    }
  }
  syncPlayer(id: string, data: ClientMessages["update"]) {
    const player = this.players[id];
    if (player.life <= 0) return;
    player.lastMessage = data.messageId;
    player.sync(data);
    if (data.shoot && player.shootCooldown <= 0) {
      player.shootCooldown = SHOOT_COOLDOWN;
      const speed = new Point(data.shootDirection).top(3);
      this.shots.push(new Shot(player.position, speed, player.id));
    }
  }
}
