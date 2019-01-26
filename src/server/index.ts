import Koa = require("koa");
import koaStatic = require("koa-static");
import { resolve } from "path";
import { createServer, Server as HttpServer } from "http";
import IO, { Socket, Server as SocketServer } from "socket.io";
import { Game } from "./game";
import {
  MessageHandlerDispatcher,
  MessageDispatcher,
  ServerMessages,
  ClientMessages
} from "../core/messages";

class Server {
  app: Koa;
  server: HttpServer;
  io: SocketServer;
  game: Game = new Game();
  constructor(public port: string) {
    this.app = new Koa();
    this.server = createServer(this.app.callback());
    this.io = IO(this.server);
  }
  async setup() {
    this.io.sockets.on("connection", this.onConnection.bind(this));
    if (process.env.NODE_ENV === "development") {
      this.app.use(await createWebpackMiddleware());
    } else {
      this.app.use(koaStatic(resolve(__dirname, "../client")));
    }
  }
  async start() {
    setInterval(() => {
      this.game.update();
      this.io.sockets.emit("sync", this.game.getState());
    }, 1000 / 60);
    return new Promise((s, _) => {
      this.server.listen(this.port, () => {
        s();
      });
    });
  }
  private onConnection = (socket: Socket) => {
    // TODO validate input
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
}

(async () => {
  const port = process.env.PORT || "3000";
  const server = new Server(port);
  await server.setup();
  await server.start();
  console.log(`Server listening at http://localhost:${port}`);
})().catch(err => {
  console.error(err);
  process.exit(1);
});

export async function createWebpackMiddleware() {
  const koaWebpack = require("koa-webpack");
  const webpackConfig = require("../client/webpack.config");

  return await koaWebpack({
    devMiddleware: {
      clientLogLevel: "none",
      publicPath: "/"
    },
    config: webpackConfig
  });
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
