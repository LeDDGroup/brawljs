import { IPoint } from "./point";

export interface IPlayer {
  lastMessage: string;
  name: string;
  color: string;
  position: IPoint;
  life: number;
}

export interface ClientMessages {
  newPlayer: { name: string; color: string };
  update: {
    messageId: string;
    speed: IPoint;
    shoot: boolean;
    shootDirection: IPoint;
  };
}

export interface IShot {
  position: IPoint;
  speed: IPoint;
  playerId: string,
}

export interface ServerMessages {
  sync: {
    players: Record<any, IPlayer>;
    shots: IShot[];
    size: IPoint;
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
