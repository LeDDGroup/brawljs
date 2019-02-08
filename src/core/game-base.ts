import { Point, IPoint } from "./point";
import { ClientMessages } from "./messages";
import { Circle, Rect } from "./shape";
import { WORLD_SIZE, BLOCK_FULL, MAP } from "./map";

const START_LIFE = 100;
const SHOOT_COOLDOWN = 60;
const PLAYER_SPEED = 0.03;
const PLAYER_SIZE = 0.3;
const SHOT_SIZE = 0.15;
const SHOT_SPEED = 0.1;
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
    this.speed.assign(status.speed).top(PLAYER_SPEED);
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
  size = new Point(WORLD_SIZE.copy());
  update() {
    this.updatePlayers();
    this.updateShots();
  }
  updatePlayers() {
    for (const id in this.players) {
      const player = this.players[id];
      if (player.shootCooldown > 0) {
        player.shootCooldown--;
      }
      if (player.deadCooldown > 0) {
        player.deadCooldown--;
      }
      if (player.life <= 0 && player.deadCooldown <= 0) {
        player.life = START_LIFE;
      }
      if (player.life > 0) {
        player.position.sum(
          this.getSpeedAfterCollision(player.toRect(), player.speed)
        );
      }
    }
  }
  updateShots() {
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
      const nextPosition = shot.toRect();
      nextPosition.position.sum(shot.speed);
      if (this.checkCollision(nextPosition)) shot.life = 0;
      if (shot.life) shot.update();
      if (shot.life <= 0) this.shots.splice(i, 1);
    }
  }
  getSpeedAfterCollision(rect: Rect, speed: Point): IPoint {
    if (!this.checkCollision(rect.rectCopy().move(speed))) return speed;
    if (!this.checkCollision(rect.rectCopy().move(new Point({ y: speed.y }))))
      return new Point({ y: speed.y }).top(speed.getLength());
    if (!this.checkCollision(rect.rectCopy().move(new Point({ x: speed.x }))))
      return new Point({ x: speed.x }).top(speed.getLength());
    return { x: 0, y: 0 };
  }
  checkCollision(rect: Rect): boolean {
    const starty = Math.floor(rect.position.y);
    const endy = Math.ceil(rect.position.y + rect.size.y);
    const startx = Math.floor(rect.position.x);
    const endx = Math.ceil(rect.position.x + rect.size.x);
    for (let y = starty; y < endy; y++) {
      for (let x = startx; x < endx; x++) {
        if (MAP[y][x] === BLOCK_FULL) {
          return true;
        }
      }
    }
    return false;
  }
  syncPlayer(id: string, data: ClientMessages["update"]) {
    const player = this.players[id];
    player.lastMessage = data.messageId;
    if (player.life <= 0) return;
    player.sync(data);
    if (data.shoot && player.shootCooldown <= 0) {
      player.shootCooldown = SHOOT_COOLDOWN;
      const speed = new Point(data.shootDirection).top(SHOT_SPEED);
      this.shots.push(new Shot(player.position, speed, player.id));
    }
  }
}
