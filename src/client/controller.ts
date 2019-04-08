import { PlayerInput } from "./utils/player-input";
import { Game, PlayerType } from "../core/game";
import { Queue } from "./utils/queue";
import {
  MessageHandlerDispatcher,
  MessageDispatcher,
  ClientMessages,
  ServerMessages
} from "../core/messages";
import { GameMap, Block } from "../core/map";
import * as colorString from "color-string";

export const BLOCK_SIZE = 48;
const DISTANCE_TO_UNCOVER = 1.5;

export class Controller {
  game: Game;
  messages = new Queue<ClientMessages["update"]>();
  playerInput = new PlayerInput({
    keybindings: { left: "a", right: "d", up: "w", down: "s" },
    canvas: this.canvas
  });
  remainingTime: number = 0;
  interval: number = 0;
  public get player() {
    return this.game.getPlayer(this.id);
  }
  constructor(
    // TODO use option object instead
    public context: CanvasRenderingContext2D,
    public socket: ExtendedSocket,
    public info: { type: PlayerType; name: string; color: string },
    public canvas: HTMLCanvasElement,
    terrain: Block[][]
  ) {
    this.game = new Game(new GameMap(terrain));
  }
  async setup() {
    this.playerInput.setup();

    this.socket.on("sync", data => {
      this.onSync(data);
    });
  }
  onSync(data: ServerMessages["sync"]) {
    this.remainingTime = data.remainingTime;
    for (const id in this.game.players) {
      if (data.players[id] === undefined) {
        this.game.players.delete(id);
      }
    }
    for (const id in data.players) {
      const newData = data.players[id];
      if (!this.game.players.has(id)) {
        this.game.addPlayer(newData.id, {
          type: newData.type,
          color: newData.color,
          name: newData.name
        });
      }
      this.game.setPlayer(id, newData);
    }
    this.game.bullets = [];
    data.bullets.forEach(({ playerId, life, radius, speed, position }) =>
      this.game.addBullet(playerId, {
        time: life,
        size: radius,
        speed,
        position
      })
    );
    if (data.players[this.id]) {
      if (!this.messages.empty()) {
        const lastMessage = data.players[this.id].lastMessage;
        if (lastMessage !== "")
          while (
            !this.messages.empty() &&
            lastMessage >= this.messages.front.messageId
          ) {
            this.messages.drop();
          }
        this.messages.forEach(message => {
          this.player.speed.assign(message.speed);
          this.player.lastMessage = message.messageId;
          this.game.update();
          return true;
        });
      }
    }
    if (this.remainingTime <= 0) {
      this.stop();
      const gameResult: { id: string; name: string; score: number }[] = [];
      this.game.players.forEach(({ score, name }, id) =>
        gameResult.push({ id, name, score })
      );
      this.onEnd(gameResult);
    }
  }
  transformScale() {
    this.context.scale(
      this.canvas.width / this.canvas.clientWidth,
      this.canvas.height / this.canvas.clientHeight
    );
  }
  transformTranslate() {
    this.context.translate(
      this.canvas.clientWidth / 2 - this.player.position.x * BLOCK_SIZE,
      this.canvas.clientHeight / 2 - this.player.position.y * BLOCK_SIZE
    );
  }
  start() {
    // game
    this.socket.emit("newPlayer", {
      type: this.info.type,
      name: this.info.name,
      color: this.info.color
    });

    this.interval = window.setInterval(() => {
      this.update();
      this.draw();
    }, 1000 / 60);
  }
  stop() {
    window.clearInterval(this.interval);
  }
  update() {
    const baseUpdate: ClientMessages["update"] = {
      messageId: Date.now().toString(),
      speed: this.playerInput.moving(),
      attack: false,
      attackDirection: { x: 0, y: 0 }
    };

    const update = {
      ...baseUpdate,
      attack: this.playerInput.attacking,
      attackDirection: this.playerInput.pointing
    };
    this.socket.emit("update", update);
    this.messages.push(baseUpdate);
    this.player.lastMessage = update.messageId;
    this.player.speed.assign(update.speed);

    this.game.update();
    this.playerInput.resetInput();
  }
  draw() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.fillStyle = "#EDDBA1";
    this.transformScale();
    this.transformTranslate();
    this.context.fillRect(
      0,
      0,
      this.game.map.size.x * BLOCK_SIZE,
      this.game.map.size.y * BLOCK_SIZE
    );
    this.drawMap();
    this.drawPlayers();
    this.drawBullets();
    this.context.resetTransform();
    this.transformScale();
    this.drawRespawnCooldown();
    this.drawTimer();
    this.drawScore();
    this.context.resetTransform();
  }
  drawMap() {
    this.context.save();
    for (let y = 0; y < this.game.map.size.y; y++) {
      for (let x = 0; x < this.game.map.size.x; x++) {
        const block = this.game.map.terrain[y][x];
        if (block === Block.Full || block === Block.Cover) {
          this.context.fillStyle =
            block === Block.Full
              ? "#DAA44D"
              : this.player.position.distanceTo({ x: x + 0.5, y: y + 0.5 }) <
                DISTANCE_TO_UNCOVER
              ? applyAlpha("#E4DC4C", 0.5)
              : "#E4DC4C";
          this.context.fillRect(
            x * BLOCK_SIZE,
            y * BLOCK_SIZE,
            BLOCK_SIZE + 1,
            BLOCK_SIZE + 1
          );
        }
      }
    }
    this.context.restore();
  }
  drawPlayers() {
    this.context.save();
    this.game.players.forEach(player => {
      if (player.life <= 0) return;
      if (
        this.game.map.blockAt(player.position.copy().floor()) === Block.Cover &&
        player.coverCooldown === 0
      )
        if (
          player.id === this.id ||
          player.position.distanceTo(this.player.position) < DISTANCE_TO_UNCOVER
        )
          this.context.fillStyle = applyAlpha(player.color, 0.5);
        else return;
      else this.context.fillStyle = player.color;
      this.context.beginPath();
      this.context.arc(
        player.position.x * BLOCK_SIZE,
        player.position.y * BLOCK_SIZE,
        player.radius * BLOCK_SIZE,
        0,
        2 * Math.PI
      );
      this.context.closePath();
      this.context.fill();
      this.context.fillStyle = "red";
      this.context.textAlign = "center";
      this.context.textBaseline = "bottom";
      this.context.fillText(
        `${player.life.toString()} ${player.name}`,
        player.position.x * BLOCK_SIZE,
        (player.position.y - player.radius) * BLOCK_SIZE
      );
    });
    this.context.restore();
  }
  drawBullets() {
    for (const bullet of this.game.bullets) {
      this.context.save();
      this.context.fillStyle = "blue";
      this.context.beginPath();
      this.context.arc(
        bullet.position.x * BLOCK_SIZE,
        bullet.position.y * BLOCK_SIZE,
        bullet.radius * BLOCK_SIZE,
        0,
        2 * Math.PI
      );
      this.context.closePath();
      this.context.fill();
      this.context.restore();
    }
  }
  drawRespawnCooldown() {
    const playerCooldown = this.player.deadCooldown;
    if (playerCooldown > 0) {
      this.context.save();
      this.context.textAlign = "center";
      this.context.font = "2rem sans-serif";
      this.context.fillText(
        Math.ceil(playerCooldown / 60).toString(),
        this.canvas.width / 2,
        this.canvas.height / 2
      );
      this.context.restore();
    }
  }
  drawTimer() {
    this.context.save();
    this.context.textAlign = "left";
    this.context.fillStyle = "red";
    this.context.textBaseline = "top";
    this.context.font = "2rem sans-serif";
    this.context.fillText(Math.floor(this.remainingTime).toString(), 0, 0);
    this.context.restore();
  }
  drawScore() {
    this.context.save();
    this.context.textAlign = "right";
    this.context.fillStyle = "red";
    this.context.textBaseline = "top";
    this.context.font = "2rem sans-serif";
    this.context.fillText(
      Math.floor(this.player.score).toString(),
      this.canvas.clientWidth,
      0
    );
    this.context.restore();
  }
  get id() {
    return this.socket.id;
  }
  onEnd = (_results: { score: number; name: string; id: string }[]) => {};
}

interface ExtendedSocket extends SocketIOClient.Socket {
  on: MessageHandlerDispatcher<ServerMessages>;
  emit: MessageDispatcher<ClientMessages>;
}

function applyAlpha(color: string, alpha: number): string {
  const parsed = colorString.get(color);
  if (!parsed) {
    throw new Error("Color not defined or invalid");
  }
  const [r, g, b] = parsed.value;
  return colorString.to.rgb(r, g, b, alpha);
}
