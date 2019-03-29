import io from "socket.io-client";
import { Controller } from "../controller";
import { createElement } from "tsx-create-html-element";
import defer from "p-defer";
import { ServerMessages } from "../../core/messages";
import { Point } from "../../core/point";
import { render } from "./render";
import { PlayerType } from "../../core/game";

export const CANVAS_SIZE = new Point({
  x: 640,
  y: 480
});

export async function play(info: {
  name: string;
  type: PlayerType;
  color: string;
  gameId: string;
}) {
  const container = document.getElementById("app");
  const canvas: HTMLCanvasElement = <canvas /> as HTMLCanvasElement;

  render(container, canvas);

  const context = canvas.getContext("2d");
  if (context === null) {
    throw new Error("Context is not supported");
  }

  const socket = io(info.gameId, { autoConnect: false });
  const onConnect = defer();
  const onMap = defer<ServerMessages["map"]>();
  socket.on("connect", onConnect.resolve);
  socket.connect();
  socket.on("map", onMap.resolve);
  await onConnect.promise;
  const id = socket.id;
  const { terrain } = await onMap.promise;
  canvas.width = CANVAS_SIZE.x;
  canvas.height = CANVAS_SIZE.y;
  const onEnd = defer<any>(); // TODO don't use any
  const controller = new Controller(context, socket, info, canvas, terrain);
  controller.setup();
  controller.start();
  controller.onEnd = onEnd.resolve;
  const results = await onEnd.promise;
  const onNext = defer();
  render(
    container,
    <MatchResults results={results} playerId={id} onNext={onNext.resolve} />
  );
  await onNext.promise;
}

function MatchResults(props: {
  playerId: string;
  results: { score: number; name: string; id: string }[];
  onNext: () => void;
}) {
  return (
    <div className="container">
      <ul>
        {props.results.map(({ score, id, name }) => (
          <li>
            {id === props.playerId ? (
              <b>
                {score} - {name}
              </b>
            ) : (
              `${score} - ${name}`
            )}
          </li>
        ))}
      </ul>
      <button onclick={props.onNext}>Continue</button>
    </div>
  );
}
