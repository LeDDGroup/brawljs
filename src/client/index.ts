import "./index.css";
import io from "socket.io-client";
import {
  MessageHandlerDispatcher,
  MessageDispatcher,
  ClientMessages,
  ServerMessages
} from "../core/messages";
import { Input } from "./input";
import { Game } from "./game";
import { Queue } from "./queue";

class Controller {
  input = new Input();
  game = new Game();
  messages = new Queue<ClientMessages["update"]>();
  constructor(
    public context: CanvasRenderingContext2D,
    public socket: ExtendedSocket
  ) {}
  setup() {
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
    document.getElementById("messages").innerText = `Non-acknowledged input: ${
      this.messages.length
    }`;
    this.context.clearRect(0, 0, 800, 600);
    this.context.fillStyle = "green";
    for (const id in this.game.players) {
      var player = this.game.players[id];
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

function run() {
  const canvas = document.getElementById("game");
  const context = canvas.getContext("2d");
  if (context === null) {
    throw new Error("Context is not supported");
  }

  const socket = io({ autoConnect: false });
  socket.connect();
  socket.on("connect", () => {
    const controller = new Controller(context, socket);
    controller.setup();
    controller.start();
  });
}

run();

declare global {
  interface Document {
    getElementById(selector: "game"): HTMLCanvasElement;
    getElementById(selector: "messages"): HTMLParagraphElement;
  }
}

interface ExtendedSocket extends SocketIOClient.Socket {
  on: MessageHandlerDispatcher<ServerMessages>;
  emit: MessageDispatcher<ClientMessages>;
}

function fixedSpeed(left: boolean, right: boolean) {
  return (right ? 1 : 0) - (left ? 1 : 0);
}
