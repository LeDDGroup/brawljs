import { Point, IPoint } from "./point";
import { ClientMessages } from "./messages";
import { Circle } from "./shape";

const START_LIFE = 100;
const SHOOT_COOLDOWN = 60;
const SPEED = 1;
const SHOT_SIZE = 5;
const PLAYER_SIZE = 10;
const DEAD_COOLDOWN = 180;
const SHOT_DAMAGE = 50;

export class Player extends Circle {
  life: number = START_LIFE;
  lastMessage = "";
  name: string = "";
  color: string = "";
  speed: Point = new Point();
  shootCooldown: number = 0;
  deadCooldown: number = 0;
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
    if (this.deadCooldown > 0) {
      this.deadCooldown--;
    }
    if (this.life > 0) {
      this.position.sum(this.speed);
    }
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
      const player = this.players[id];
      player.update();
      if (player.life <= 0 && player.deadCooldown <= 0) {
        player.life = START_LIFE;
      }
    }
    for (let i = 0; i < this.shots.length; i++) {
      const shot = this.shots[i];
      for (const key in this.players) {
        const player = this.players[key];
        if (
          player.life > 0 &&
          shot.playerId !== player.id &&
          player.collides(shot)
        ) {
          player.life -= SHOT_DAMAGE;
          shot.life = 0;
          if (player.life <= 0) {
            player.deadCooldown = DEAD_COOLDOWN;
          }
        }
      }
      shot.update();
      if (shot.life <= 0) this.shots.splice(i, 1);
    }
  }
  syncPlayer(id: string, data: ClientMessages["update"]) {
    const player = this.players[id];
    player.lastMessage = data.messageId;
    if (player.life <= 0) return;
    player.sync(data);
    if (data.shoot && player.shootCooldown <= 0) {
      player.shootCooldown = SHOOT_COOLDOWN;
      const speed = new Point(data.shootDirection).top(3);
      this.shots.push(new Shot(player.position, speed, player.id));
    }
  }
}
