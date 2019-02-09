import { Game } from "./game";
import { Namespace, Socket } from "socket.io";
import {
  MessageHandlerDispatcher,
  ClientMessages,
  MessageDispatcher,
  ServerMessages
} from "../core/messages";

export class Controller {
  game: Game = new Game();
  interval: NodeJS.Timeout | null = null;
  constructor(public io: Namespace) {}
  setup() {
    this.io.on("connection", this.onConnection.bind(this));
  }
  private onConnection = (socket: Socket) => {
    // TODO validate input
    socket.emit("map", this.game.getMap());
    socket.on("disconnect", () => {
      this.game.removePlayer(socket.id);
    });
    socket.on("newPlayer", data => {
      this.game.addPlayer(socket.id, data);
    });
    socket.on("update", async data => {
      if (this.game.players[socket.id]) {
        this.game.syncPlayer(socket.id, data);
      }
    });
  };
  start() {
    this.interval = setInterval(() => {
      this.game.update();
      this.io.emit("sync", this.game.getState());
    }, 1000 / 60);
  }
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }
}

declare global {
  namespace SocketIO {
    interface Socket {
      on: MessageHandlerDispatcher<ClientMessages & { disconnect: {} }>;
      emit: MessageDispatcher<ServerMessages>;
    }
    interface Namespace {
      emit: MessageDispatcher<ServerMessages>;
    }
  }
}
