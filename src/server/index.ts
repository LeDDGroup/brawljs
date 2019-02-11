import Koa = require("koa");
import koaStatic = require("koa-static");
import { resolve } from "path";
import { createServer, Server as HttpServer } from "http";
import IO, { Server as SocketServer } from "socket.io";
import { Controller } from "./controller";
import bodyParser from "koa-bodyparser";
import route from "koa-route";
import { Block, Map, getTerrainFromString } from "../core/map";

class Server {
  app: Koa;
  server: HttpServer;
  io: SocketServer;
  gameCounter = 0;
  games: Record<string, { controller: Controller; name: string }>;
  constructor(public port: string) {
    this.app = new Koa();
    this.server = createServer(this.app.callback());
    this.io = IO(this.server);
    this.games = {};
  }
  createGame(name: string, terrain: Block[][]) {
    const controller = new Controller(
      this.io.of((++this.gameCounter).toString()),
      new Map(terrain)
    );
    this.games[controller.id] = { controller, name };
    controller.onEnd = () => {
      controller.stop();
      controller.disconnect();
      delete this.games[controller.id];
    };
    controller.setup();
    controller.start();
    return controller.id;
  }
  removeGame(id: string) {
    // TODO should check if game exists
    this.games[id].controller.stop();
  }
  async setup() {
    if (process.env.NODE_ENV === "development") {
      this.app.use(await createWebpackMiddleware());
    } else {
      this.app.use(koaStatic(resolve(__dirname, "../client")));
    }
    this.app.use(bodyParser());
    this.app.use(
      route.get("/games", ctx => {
        ctx.body = Object.keys(this.games).map(id => ({
          id,
          name: this.games[id].name,
          players: this.games[id].controller.playerCount
        }));
      })
    );
    this.app.use(
      route.post("/games", ctx => {
        const { name, terrain } = ctx.request.body;
        const newGameId = this.createGame(name, getTerrainFromString(terrain));
        ctx.body = { id: newGameId };
      })
    );
  }
  async start() {
    return new Promise((s, _) => {
      this.server.listen(this.port, () => {
        s();
      });
    });
  }
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
      logLevel: "error",
      publicPath: "/"
    },
    config: webpackConfig
  });
}
