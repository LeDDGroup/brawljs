import { Game } from "../core/game";
import { Namespace, Socket } from "socket.io";
import {
  MessageHandlerDispatcher,
  ClientMessages,
  MessageDispatcher,
  ServerMessages
} from "../core/messages";
import { GameMap } from "../core/map";

function mapToRecord<K extends keyof any, V>(map: Map<K, V>) {
  const result: Record<K, V> = {} as any;
  map.forEach((v, k) => (result[k] = v));
  return result;
}

export class Controller {
  game: Game;
  updateInterval: NodeJS.Timeout | null = null;
  endgameTimeout: NodeJS.Timeout | null = null;
  time: number = 0;
  constructor(public io: Namespace, map: GameMap) {
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
    socket.emit("map", { terrain: this.game.map.terrain });
    socket.on("disconnect", () => {
      this.game.removePlayer(socket.id);
    });
    socket.on("newPlayer", data => {
      this.game.addPlayer(socket.id, data);
    });
    socket.on("update", async data => {
      // TODO validate data
      const player = this.game.players.get(socket.id);
      if (player) {
        player.lastMessage = data.messageId;
        player.speed.assign(data.speed);
        player.attack = data.attack;
        player.attackDirection.assign(data.attackDirection);
      }
    });
  };
  start() {
    const timeToEnd = 2 * 60 * 1000; // 2 minutes TODO remove constant from here
    this.time = Date.now() + timeToEnd;
    this.endgameTimeout = setTimeout(() => {
      this.onEnd();
    }, timeToEnd + 100); // HACK + 100 delay to send timeToEnd = 0 status allowing clients to finish
    this.updateInterval = setInterval(() => {
      this.game.update();
      this.io.emit("sync", {
        remainingTime: this.getRemainingTime(),
        players: mapToRecord(this.game.players),
        bullets: this.game.bullets
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
