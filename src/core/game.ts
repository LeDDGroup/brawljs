import { Point } from "./point";
import { Circle, Rect } from "./shape";
import { GameMap, Block } from "./map";
import { Data } from "./types";

const START_LIFE = 100;
const SHOOT_COOLDOWN = 60;
const PLAYER_SPEED = 0.03;
const PLAYER_SIZE = 0.3;
const SHOT_SIZE = 0.15;
const SHOT_SPEED = 0.1;
const DEAD_COOLDOWN = 180;
const SHOT_DAMAGE = 50;

export class Player extends Circle {
  id: string = "";
  score = 0;
  life: number = 0;
  lastMessage = "";
  name: string = "";
  color: string = "";
  speed: Point = new Point();
  shoot: boolean = false;
  shootDirection: Point = new Point();
  shootCooldown: number = 0;
  deadCooldown: number = 0;
}

export class Shot extends Circle {
  playerId: string;
  life = 30;
  position: Point;
  speed: Point;
  constructor(position: Point, speed: Point, playerId: string) {
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

export class Game {
  players = new Map<string, Player>();
  shots: Shot[] = [];
  constructor(public map: GameMap) {}
  getPlayer(id: string): Player {
    const player = this.players.get(id);
    if (player === undefined) {
      throw new Error("Player doesn't exist");
    }
    return player;
  }
  addPlayer(id: string, options: { color: string; name: string }) {
    const player = new Player();
    player.id = id;
    player.life = START_LIFE;
    player.color = options.color;
    player.name = options.name;
    player.radius = PLAYER_SIZE;
    this.players.set(id, player);
    this.resetPlayerPosition(id);
  }
  addShot(player: Player) {
    const speed = new Point(player.shootDirection).top(SHOT_SPEED);
    this.shots.push(new Shot(player.position, speed, player.id));
  }
  setPlayer(
    id: string,
    options: {
      position: Data<Point>;
      life: number;
      score: number;
      deadCooldown: number;
    }
  ) {
    const player = this.getPlayer(id);
    player.position.assign(options.position);
    player.life = options.life;
    player.score = options.score;
    player.deadCooldown = options.deadCooldown;
  }
  removePlayer(id: string) {
    this.players.delete(id);
  }
  resetPlayerPosition(id: string) {
    this.players.get(id)!.position.assign(this.getRandomPlayerPosition());
  }
  update() {
    this.updatePlayers();
    this.updateShots();
  }
  updatePlayers() {
    this.players.forEach(player => {
      if (player.shootCooldown > 0) {
        player.shootCooldown--;
      }
      if (player.deadCooldown > 0) {
        player.deadCooldown--;
      }
      if (player.life <= 0 && player.deadCooldown <= 0) {
        player.life = START_LIFE;
        player.position.assign(this.getRandomPlayerPosition());
      }
      if (player.life > 0) {
        player.position.sum(
          this.getSpeedAfterCollision(
            player.toRect(),
            player.speed.top(PLAYER_SPEED)
          )
        );
        if (player.shoot && player.shootCooldown <= 0) {
          player.shootCooldown = SHOOT_COOLDOWN;
          this.addShot(player);
        }
      }
    });
  }
  updateShots() {
    for (let i = 0; i < this.shots.length; i++) {
      const shot = this.shots[i];
      this.players.forEach(player => {
        if (
          player.life > 0 &&
          shot.playerId !== player.id &&
          player.collides(shot)
        ) {
          player.life -= SHOT_DAMAGE;
          shot.life = 0;
          if (player.life <= 0) {
            player.deadCooldown = DEAD_COOLDOWN;
            this.players.get(shot.playerId)!.score++;
          }
        }
      });
      const nextPosition = shot.toRect();
      nextPosition.position.sum(shot.speed);
      if (this.checkCollision(nextPosition)) shot.life = 0;
      if (shot.life) shot.update();
      if (shot.life <= 0) this.shots.splice(i, 1);
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
