import { Match } from "ts-types-utils";

type Data_<T> = Match<T, Function, false>;
export type Data<T> = {
  [id in keyof Data_<T>]: Data_<T>[id] extends object
    ? Data<Data_<T>[id]>
    : T[id]
};
