import Koa = require("koa");
import koaStatic = require("koa-static");
import { resolve } from "path";
import { createServer, Server as HttpServer } from "http";
import IO, { Server as SocketServer } from "socket.io";
import { Controller } from "./controller";

class Server {
  app: Koa;
  server: HttpServer;
  io: SocketServer;
  controller: Controller;
  constructor(public port: string) {
    this.app = new Koa();
    this.server = createServer(this.app.callback());
    this.io = IO(this.server);
    this.controller = new Controller(this.io.sockets);
  }
  async setup() {
    this.controller.setup();
    if (process.env.NODE_ENV === "development") {
      this.app.use(await createWebpackMiddleware());
    } else {
      this.app.use(koaStatic(resolve(__dirname, "../client")));
    }
  }
  async start() {
    this.controller.start();
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
