import io from "socket.io-client";
import { Controller } from "../controller";
import { removeChildren } from "./remove-children";
import { createElement } from "tsx-create-html-element";
import defer from "p-defer";

export async function play(info: { name: string; color: string }) {
  const container = document.getElementById("app");
  removeChildren(container);
  const canvasRef: JSX.Reference<"canvas"> = {};

  container.appendChild(<canvas ref={canvasRef} width={600} height={600} />);

  if (canvasRef.value === undefined) {
    throw new Error("Couldn't get canvas reference");
  }
  const context = canvasRef.value.getContext("2d");
  if (context === null) {
    throw new Error("Context is not supported");
  }

  const socket = io({ autoConnect: false });
  const onConnect = defer();
  socket.on("connect", onConnect.resolve);
  socket.connect();
  await onConnect.promise;
  const controller = new Controller(context, socket, info, canvasRef.value);
  controller.setup();
  controller.start();
}
