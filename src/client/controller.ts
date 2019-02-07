import { Player } from "./utils/player";
import { Game } from "./game";
import { Queue } from "./utils/queue";
import {
  MessageHandlerDispatcher,
  MessageDispatcher,
  ClientMessages,
  ServerMessages
} from "../core/messages";
import { MAP, BLOCK_SIZE, WORLD_SIZE_BLOCKS, BLOCK_FULL } from "../core/map";

export class Controller {
  game = new Game();
  messages = new Queue<ClientMessages["update"]>();
  playerInput = new Player({
    keybindings: { left: "a", right: "d", up: "w", down: "s" },
    canvas: this.canvas
  });
  constructor(
    public context: CanvasRenderingContext2D,
    public socket: ExtendedSocket,
    public info: { name: string; color: string },
    public canvas: HTMLCanvasElement
  ) {}
  async setup() {
    this.playerInput.setup();

    this.socket.on("sync", data => {
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
    });
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
    const player = this.game.players[this.id];
    const baseUpdate: ClientMessages["update"] = {
      messageId: Date.now().toString(),
      speed: this.playerInput.moving(),
      shoot: false,
      shootDirection: { x: 0, y: 0 }
    };
    const update = {
      ...baseUpdate,
      shoot: this.playerInput.shooting,
      shootDirection: this.playerInput.pointing.copy().subtract(player.position)
    };
    this.socket.emit("update", update);
    this.messages.push(baseUpdate);
    this.game.syncPlayer(this.id, baseUpdate);

    this.game.update();
    this.playerInput.resetInput();
  }
  draw() {
    this.context.clearRect(0, 0, 800, 600);
    this.drawMap();
    this.drawPlayers();
    this.drawShots();
    this.drawRespawnCooldown();
  }
  drawMap() {
    this.context.save();
    for (let y = 0; y < WORLD_SIZE_BLOCKS.y; y++) {
      for (let x = 0; x < WORLD_SIZE_BLOCKS.x; x++) {
        if (MAP[y][x] === BLOCK_FULL)
          this.context.fillRect(
            x * BLOCK_SIZE,
            y * BLOCK_SIZE,
            BLOCK_SIZE,
            BLOCK_SIZE
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
        player.position.x,
        player.position.y,
        player.radius,
        0,
        2 * Math.PI
      );
      this.context.closePath();
      this.context.fill();
      this.context.fillStyle = "red";
      this.context.textAlign = "center";
      this.context.fillText(
        `${player.life.toString()} ${player.name}`,
        player.position.x,
        player.position.y - 10
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
        shot.position.x,
        shot.position.y,
        shot.radius,
        0,
        2 * Math.PI
      );
      this.context.closePath();
      this.context.fill();
      this.context.restore();
    }
  }
  drawRespawnCooldown() {
    const playerCooldown = this.game.players[this.id].deadCooldown;
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
  get id() {
    return this.socket.id;
  }
}

interface ExtendedSocket extends SocketIOClient.Socket {
  on: MessageHandlerDispatcher<ServerMessages>;
  emit: MessageDispatcher<ClientMessages>;
}
