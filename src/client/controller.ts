import { Player } from "./utils/player";
import { Game } from "./game";
import { Queue } from "./utils/queue";
import {
  MessageHandlerDispatcher,
  MessageDispatcher,
  ClientMessages,
  ServerMessages
} from "../core/messages";

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
    for (const id in this.game.players) {
      const player = this.game.players[id];
      this.context.save();
      this.context.fillStyle = player.color;
      this.context.beginPath();
      this.context.arc(
        player.position.x,
        player.position.y,
        10,
        0,
        2 * Math.PI
      );
      this.context.closePath();
      this.context.fill();
      this.context.fillStyle = "red";
      this.context.textAlign = "center";
      this.context.fillText(
        player.name,
        player.position.x,
        player.position.y - 10
      );
      this.context.restore();
    }
    for (const shot of this.game.shots) {
      this.context.save();
      this.context.fillStyle = "blue";
      this.context.beginPath();
      this.context.arc(shot.position.x, shot.position.y, 5, 0, 2 * Math.PI);
      this.context.closePath();
      this.context.fill();
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
