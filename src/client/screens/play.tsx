import io from "socket.io-client";
import { Controller } from "../controller";
import { createElement } from "tsx-create-html-element";
import defer from "p-defer";
import { ServerMessages } from "../../core/messages";
import { Point } from "../../core/point";
import { render } from "./render";

export const CANVAS_SIZE = new Point({
  x: 640,
  y: 480
});

export async function play(info: { name: string; color: string }) {
  const container = document.getElementById("app");
  const canvasRef: JSX.Reference<"canvas"> = {};

  render(container, <canvas ref={canvasRef} />);

  if (canvasRef.value === undefined) {
    throw new Error("Couldn't get canvas reference");
  }
  const context = canvasRef.value.getContext("2d");
  if (context === null) {
    throw new Error("Context is not supported");
  }

  const socket = io({ autoConnect: false });
  const onConnect = defer();
  const onMap = defer<ServerMessages["map"]>();
  socket.on("connect", onConnect.resolve);
  socket.connect();
  socket.on("map", onMap.resolve);
  await onConnect.promise;
  canvasRef.value.width = CANVAS_SIZE.x;
  canvasRef.value.height = CANVAS_SIZE.y;
  const controller = new Controller(context, socket, info, canvasRef.value);
  controller.setup();
  controller.start();
}
