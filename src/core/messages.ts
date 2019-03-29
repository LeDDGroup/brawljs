import { Data } from "./types";
import { Point } from "./point";
import { Player, Bullet, PlayerType } from "./game";
import { Block } from "./map";

type IPoint = Data<Point>;

export interface ClientMessages {
  newPlayer: { type: PlayerType; name: string; color: string };
  update: {
    messageId: string;
    speed: IPoint;
    attack: boolean;
    attackDirection: IPoint;
  };
}

export interface ServerMessages {
  map: {
    terrain: Block[][];
  };
  sync: {
    remainingTime: number;
    players: Record<any, Player>;
    bullets: Bullet[];
  };
}

export type MessageHandlerMap<T> = { [id in keyof T]: (data: T[id]) => void };

export type MessageHandlerDispatcher<T> = <K extends keyof T>(
  message: K,
  value: MessageHandler<T[K]>
) => any;

export type MessageDispatcher<T> = <K extends keyof T>(
  message: K,
  value: T[K],
  ...rest: any[]
) => any;

export type MessageHandler<V> = (value: V) => void;
