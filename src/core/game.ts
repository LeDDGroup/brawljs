import { Point, pointFromAngle } from "./point";
import { Circle, Rect } from "./shape";
import { GameMap, Block } from "./map";
import { Data } from "./types";

const PLAYER_SIZE = 0.3;
const DEAD_COOLDOWN = 180;
const DEGREE_RAD_REL = Math.PI / 180;
const COVER_COOLDOWN = 30;

export enum PlayerType {
  mele = "mele",
  sharpshooter = "sharpshooter"
}

const CHARACTER_DATA = {
  mele: {
    hp: 150,
    speed: 0.04,
    cooldown: 60,
    damage: 20,
    bulletSize: 0.05,
    bulletSpeed: 0.1,
    bulletTime: 15,
    attackRange: 40 * DEGREE_RAD_REL,
    bulletAmount: 8
  },
  sharpshooter: {
    hp: 100,
    speed: 0.03,
    cooldown: 60,
    damage: 50,
    bulletSize: 0.15,
    bulletSpeed: 0.1,
    bulletTime: 30
  }
};

export class Player extends Circle {
  id: string = "";
  score = 0;
  type: PlayerType = PlayerType.sharpshooter;
  life: number = 0;
  lastMessage = "";
  name: string = "";
  color: string = "";
  speed: Point = new Point();
  attack: boolean = false;
  attackDirection: Point = new Point();
  attackCooldown: number = 0;
  deadCooldown: number = 0;
  coverCooldown: number = 0;
  // helpers
  get base() {
    return CHARACTER_DATA[this.type];
  }
}

export class Bullet extends Circle {
  playerId: string;
  life = 0;
  position: Point = new Point();
  speed: Point = new Point();
  constructor(playerId: string) {
    super();
    this.playerId = playerId;
  }
}

export class Game {
  players = new Map<string, Player>();
  bullets: Bullet[] = [];
  constructor(public map: GameMap) {}
  getPlayer(id: string): Player {
    const player = this.players.get(id);
    if (player === undefined) {
      throw new Error("Player doesn't exist");
    }
    return player;
  }
  addPlayer(
    id: string,
    options: { type: PlayerType; color: string; name: string }
  ) {
    const player = new Player();
    player.id = id;
    player.type = options.type;
    player.color = options.color;
    player.name = options.name;
    player.radius = PLAYER_SIZE;
    this.players.set(id, player);
    this.resetPlayer(id);
  }
  addBullet(
    playerId: string,
    options: {
      time: number;
      size: number;
      speed: Data<Point>;
      position: Data<Point>;
    }
  ) {
    const bullet = new Bullet(playerId);
    bullet.position.assign(options.position);
    bullet.speed.assign(options.speed);
    bullet.radius = options.size;
    bullet.life = options.time;
    this.bullets.push(bullet);
  }
  setPlayer(
    id: string,
    options: {
      position: Data<Point>;
      life: number;
      score: number;
      deadCooldown: number;
      attackCooldown: number;
    }
  ) {
    const player = this.getPlayer(id);
    player.position.assign(options.position);
    player.life = options.life;
    player.score = options.score;
    player.deadCooldown = options.deadCooldown;
    player.attackCooldown = options.attackCooldown;
  }
  removePlayer(id: string) {
    this.players.delete(id);
  }
  resetPlayer(id: string) {
    const player = this.getPlayer(id);
    player.life = player.base.hp;
    player.position.assign(this.getRandomPlayerPosition());
  }
  update() {
    this.updatePlayers();
    this.updateBullets();
  }
  updatePlayers() {
    this.players.forEach(player => {
      if (player.attackCooldown > 0) {
        player.attackCooldown--;
      }
      if (player.deadCooldown > 0) {
        player.deadCooldown--;
      }
      if (player.coverCooldown > 0) {
        player.coverCooldown--;
      }
      if (player.life <= 0 && player.deadCooldown <= 0) {
        this.resetPlayer(player.id);
      }
      if (player.life > 0) {
        player.position.sum(
          this.getSpeedAfterCollision(
            player.toRect(),
            player.speed.top(player.base.speed)
          )
        );
        if (player.attack && player.attackCooldown <= 0) {
          player.coverCooldown = COVER_COOLDOWN;
          player.attackCooldown = player.base.cooldown;
          switch (player.type) {
            case PlayerType.sharpshooter:
              this.addBullet(player.id, {
                time: player.base.bulletTime,
                size: player.base.bulletSize,
                position: player.position,
                speed: player.attackDirection.top(player.base.bulletSpeed)
              });
              break;
            case PlayerType.mele:
              const angleDelta =
                CHARACTER_DATA[PlayerType.mele].attackRange /
                CHARACTER_DATA[PlayerType.mele].bulletAmount;
              for (
                let i = 0,
                  angle =
                    player.attackDirection.getAngle() -
                    CHARACTER_DATA[PlayerType.mele].attackRange / 2;
                i < CHARACTER_DATA[PlayerType.mele].bulletAmount;
                i++, angle += angleDelta
              ) {
                this.addBullet(player.id, {
                  time: player.base.bulletTime,
                  size: player.base.bulletSize,
                  position: player.position,
                  speed: pointFromAngle(angle, player.base.bulletSpeed)
                });
              }
              break;
            default:
              // TODO maybe shouldn't throw error for production
              throw new Error(`${player.type} player type not recognized`);
          }
        }
      }
    });
  }
  updateBullets() {
    for (let i = 0; i < this.bullets.length; i++) {
      const bullet = this.bullets[i];
      this.players.forEach(player => {
        if (
          player.life > 0 &&
          bullet.playerId !== player.id &&
          player.collides(bullet)
        ) {
          player.coverCooldown = COVER_COOLDOWN;
          player.life -= this.getPlayer(bullet.playerId).base.damage;
          bullet.life = 0;
          if (player.life <= 0) {
            player.deadCooldown = DEAD_COOLDOWN;
            this.players.get(bullet.playerId)!.score++;
          }
        }
      });
      const nextPosition = bullet.toRect();
      nextPosition.position.sum(bullet.speed);
      if (this.checkCollision(nextPosition)) bullet.life = 0;
      if (bullet.life > 0) {
        bullet.position.sum(bullet.speed);
        bullet.life--;
      }
      if (bullet.life <= 0) this.bullets.splice(i, 1);
    }
  }
  getSpeedAfterCollision(rect: Rect, speed: Point): Point {
    if (!this.checkCollision(rect.rectCopy().move(speed))) return speed;
    if (!this.checkCollision(rect.rectCopy().move(new Point({ y: speed.y }))))
      return new Point({ y: speed.y }).top(speed.getLength());
    if (!this.checkCollision(rect.rectCopy().move(new Point({ x: speed.x }))))
      return new Point({ x: speed.x }).top(speed.getLength());
    return new Point();
  }
  checkCollision(rect: Rect): boolean {
    const starty = Math.floor(rect.position.y);
    const endy = Math.ceil(rect.position.y + rect.size.y);
    const startx = Math.floor(rect.position.x);
    const endx = Math.ceil(rect.position.x + rect.size.x);
    for (let y = starty; y < endy; y++) {
      for (let x = startx; x < endx; x++) {
        if (this.map.terrain[y][x] === Block.Full) {
          return true;
        }
      }
    }
    return false;
  }
  getRandomPlayerPosition(): Point {
    return new Point(getRandom(this.map.playerPositions)).sum(0.5);
  }
}

function getRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * (arr.length - 1))];
}
