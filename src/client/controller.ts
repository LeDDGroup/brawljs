import { Input } from "./input";
import { Game } from "./game";
import { Queue } from "./queue";
import {
  MessageHandlerDispatcher,
  MessageDispatcher,
  ClientMessages,
  ServerMessages
} from "../core/messages";

export class Controller {
  game = new Game();
  messages = new Queue<ClientMessages["update"]>();
  constructor(
    public context: CanvasRenderingContext2D,
    public socket: ExtendedSocket,
    public info: { name: string; color: string },
    public input: Input = new Input()
  ) {}
  async setup() {
    this.input.setupKeyboardEvents();

    // drawing
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
            this.game.updatePlayer(this.id, message);
            this.game.update();
            return true;
          });
        }
      }
    });
  }
  start() {
    // game
    this.socket.emit("newPlayer", {});

    setInterval(() => {
      this.update();
      this.draw();
    }, 1000 / 60);
  }
  update() {
    const update = {
      messageId: Date.now().toString(),
      speed: {
        x: fixedSpeed(
          this.input.keyboardStatus["a"],
          this.input.keyboardStatus["d"]
        ),
        y: fixedSpeed(
          this.input.keyboardStatus["w"],
          this.input.keyboardStatus["s"]
        )
      }
    };
    this.socket.emit("update", update);
    this.messages.push(update);
    this.game.updatePlayer(this.id, update);

    this.game.update();
  }
  draw() {
    this.context.clearRect(0, 0, 800, 600);
    for (const id in this.game.players) {
      const player = this.game.players[id];
      if (id === this.id) {
        this.context.fillStyle = this.info.color;
      } else {
        this.context.fillStyle = "red";
      }
      this.context.beginPath();
      this.context.arc(
        player.position.x,
        player.position.y,
        10,
        0,
        2 * Math.PI
      );
      this.context.fill();
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

function fixedSpeed(left: boolean, right: boolean) {
  return (right ? 1 : 0) - (left ? 1 : 0);
}