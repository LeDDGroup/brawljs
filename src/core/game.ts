import { Point } from "./point";
import { Circle, Rect } from "./shape";
import { GameMap, Block } from "./map";
import { Data } from "./types";

const PLAYER_SIZE = 0.3;
const SHOT_SIZE = 0.15;
const SHOT_SPEED = 0.1;
const DEAD_COOLDOWN = 180;

export enum PlayerType {
  sharpshooter = "sharpshooter"
}

interface Character {
  hp: number;
  speed: number;
  cooldown: number;
  damage: number;
}

const CharacterData: Record<PlayerType, Character> = {
  sharpshooter: {
    hp: 100,
    speed: 0.03,
    cooldown: 180,
    damage: 50
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
  shoot: boolean = false;
  shootDirection: Point = new Point();
  shootCooldown: number = 0;
  deadCooldown: number = 0;
  // helpers
  get maxHp() {
    return CharacterData[this.type].hp;
  }
  get maxSpeed() {
    return CharacterData[this.type].speed;
  }
  get damage() {
    return CharacterData[this.type].damage;
  }
  get attackCooldown() {
    return CharacterData[this.type].cooldown;
  }
}

export class Shot extends Circle {
  playerId: string;
  life = 30;
  position: Point;
  speed: Point;
  constructor(position: Data<Point>, speed: Data<Point>, playerId: string) {
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
  addShot(
    playerId: string,
    options: { direction: Data<Point>; position: Data<Point> }
  ) {
    const speed = new Point(options.direction).top(SHOT_SPEED);
    this.shots.push(new Shot(options.position, speed, playerId));
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
  resetPlayer(id: string) {
    const player = this.getPlayer(id);
    player.life = player.maxHp;
    player.position.assign(this.getRandomPlayerPosition());
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
        this.resetPlayer(player.id);
      }
      if (player.life > 0) {
        player.position.sum(
          this.getSpeedAfterCollision(
            player.toRect(),
            player.speed.top(player.maxSpeed)
          )
        );
        if (player.shoot && player.shootCooldown <= 0) {
          player.shootCooldown = player.attackCooldown;
          switch (player.type) {
            case PlayerType.sharpshooter:
              this.addShot(player.id, {
                position: player.position,
                direction: player.shootDirection
              });
              break;
            default:
              // TODO maybe shouldn't throw error for production
              throw new Error(`${player.type} player type not recognized`);
          }
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
          player.life -= this.getPlayer(shot.playerId).damage;
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
