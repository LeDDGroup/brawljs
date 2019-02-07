import io from "socket.io-client";
import { Controller } from "../controller";
import { removeChildren } from "./remove-children";
import { createElement } from "tsx-create-html-element";
import defer from "p-defer";
import { ServerMessages } from "../../core/messages";

export async function play(info: { name: string; color: string }) {
  const container = document.getElementById("app");
  removeChildren(container);
  const canvasRef: JSX.Reference<"canvas"> = {};

  container.appendChild(<canvas ref={canvasRef} />);

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
  const { size } = await onMap.promise;
  canvasRef.value.width = size.x;
  canvasRef.value.height = size.y;
  const controller = new Controller(context, socket, info, canvasRef.value);
  controller.setup();
  controller.start();
}
