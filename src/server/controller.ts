import { Game } from "./game";
import { Namespace, Socket } from "socket.io";
import {
  MessageHandlerDispatcher,
  ClientMessages,
  MessageDispatcher,
  ServerMessages
} from "../core/messages";
import { Map } from "../core/map";

export class Controller {
  game: Game;
  updateInterval: NodeJS.Timeout | null = null;
  endgameTimeout: NodeJS.Timeout | null = null;
  time: number = 0;
  constructor(public io: Namespace, map: Map) {
    this.game = new Game(map);
  }
  get id() {
    return this.io.name;
  }
  get playerCount() {
    return Object.keys(this.io.sockets).length;
  }
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
    const timeToEnd = 2 * 60 * 1000; // 2 minutes TODO remove constant from here
    this.time = Date.now() + timeToEnd;
    this.endgameTimeout = setTimeout(() => {
      this.onEnd();
    }, timeToEnd);
    this.updateInterval = setInterval(() => {
      this.game.update();
      this.io.emit("sync", {
        remainingTime: this.getRemainingTime(),
        ...this.game.getState()
      });
    }, 1000 / 60);
  }
  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    if (this.endgameTimeout) {
      clearTimeout(this.endgameTimeout);
    }
  }
  getRemainingTime() {
    return (this.time - Date.now()) / 1000;
  }
  disconnect() {
    this.io.removeAllListeners();
  }
  onEnd = () => {};
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
