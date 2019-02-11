import { Player } from "./utils/player";
import { Game } from "./game";
import { Queue } from "./utils/queue";
import {
  MessageHandlerDispatcher,
  MessageDispatcher,
  ClientMessages,
  ServerMessages
} from "../core/messages";
import { MAP, BLOCK_FULL, WORLD_SIZE } from "../core/map";

export const BLOCK_SIZE = 48;

export class Controller {
  game = new Game();
  messages = new Queue<ClientMessages["update"]>();
  playerInput = new Player({
    keybindings: { left: "a", right: "d", up: "w", down: "s" },
    canvas: this.canvas
  });
  remainingTime: number = 0;
  public get player() {
    return this.game.players[this.id];
  }
  constructor(
    public context: CanvasRenderingContext2D,
    public socket: ExtendedSocket,
    public info: { name: string; color: string },
    public canvas: HTMLCanvasElement
  ) {}
  async setup() {
    this.playerInput.setup();

    this.socket.on("sync", data => {
      this.onSync(data);
    });
  }
  onSync(data: ServerMessages["sync"]) {
    this.remainingTime = data.remainingTime;
    this.game.sync(data);
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
          this.game.syncPlayer(this.id, message);
          this.game.update();
          return true;
        });
      }
    }
  }
  start() {
    // game
    this.socket.emit("newPlayer", {
      name: this.info.name,
      color: this.info.color
    });

    setInterval(() => {
      this.update();
      this.draw();
    }, 1000 / 60);
  }
  update() {
    const baseUpdate: ClientMessages["update"] = {
      messageId: Date.now().toString(),
      speed: this.playerInput.moving(),
      shoot: false,
      shootDirection: { x: 0, y: 0 }
    };

    const update = {
      ...baseUpdate,
      shoot: this.playerInput.shooting,
      shootDirection: this.playerInput.pointing
    };
    this.socket.emit("update", update);
    this.messages.push(baseUpdate);
    this.game.syncPlayer(this.id, baseUpdate);

    this.game.update();
    this.playerInput.resetInput();
  }
  draw() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.translate(
      -this.player.position.x * BLOCK_SIZE + this.canvas.width / 2,
      -this.player.position.y * BLOCK_SIZE + this.canvas.height / 2
    );
    this.drawMap();
    this.drawPlayers();
    this.drawShots();
    this.context.resetTransform();
    this.drawRespawnCooldown();
    this.drawTimer();
    this.drawScore();
  }
  drawMap() {
    this.context.save();
    for (let y = 0; y < WORLD_SIZE.y; y++) {
      for (let x = 0; x < WORLD_SIZE.x; x++) {
        if (MAP[y][x] === BLOCK_FULL)
          this.context.fillRect(
            x * BLOCK_SIZE,
            y * BLOCK_SIZE,
            BLOCK_SIZE + 1,
            BLOCK_SIZE + 1
          );
      }
    }
    this.context.restore();
  }
  drawPlayers() {
    for (const id in this.game.players) {
      const player = this.game.players[id];
      if (player.life <= 0) continue;
      this.context.save();
      this.context.fillStyle = player.color;
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
      this.context.fillText(
        `${player.life.toString()} ${player.name}`,
        player.position.x * BLOCK_SIZE,
        player.position.y * BLOCK_SIZE - 10
      );
      this.context.restore();
    }
  }
  drawShots() {
    for (const shot of this.game.shots) {
      this.context.save();
      this.context.fillStyle = "blue";
      this.context.beginPath();
      this.context.arc(
        shot.position.x * BLOCK_SIZE,
        shot.position.y * BLOCK_SIZE,
        shot.radius * BLOCK_SIZE,
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
    this.context.fillText(Math.floor(this.player.score).toString(), this.canvas.width, 0);
    this.context.restore();
  }
  get id() {
    return this.socket.id;
  }
}

interface ExtendedSocket extends SocketIOClient.Socket {
  on: MessageHandlerDispatcher<ServerMessages>;
  emit: MessageDispatcher<ClientMessages>;
}
