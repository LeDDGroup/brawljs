import { Data } from "./types";

export class Point {
  public x: number;
  public y: number;
  constructor(options: Partial<Data<Point>> = {}) {
    const { x = 0, y = 0 } = options;
    this.x = x;
    this.y = y;
  }
  public copy(): Point {
    return new Point(this);
  }
  public round(): Point {
    this.x = Math.round(this.x);
    this.y = Math.round(this.y);
    return this;
  }
  public floor(): Point {
    this.x = Math.floor(this.x);
    this.y = Math.floor(this.y);
    return this;
  }
  public ceil(): Point {
    this.x = Math.ceil(this.x);
    this.y = Math.ceil(this.y);
    return this;
  }
  public sum(point: Partial<Data<Point>> | number): Point {
    if (typeof point === "number") {
      point = { x: point, y: point };
    }
    this.x += point.x || 0;
    this.y += point.y || 0;
    return this;
  }
  public subtract(point: Partial<Data<Point>> | number): Point {
    if (typeof point === "number") {
      point = { x: point, y: point };
    }
    this.x -= point.x || 0;
    this.y -= point.y || 0;
    return this;
  }
  public multiply(point: Partial<Data<Point>> | number): Point {
    if (typeof point === "number") {
      point = { x: point, y: point };
    }
    this.x *= point.x !== undefined ? point.x : 1;
    this.y *= point.y !== undefined ? point.y : 1;
    return this;
  }
  public divide(point: Partial<Data<Point>> | number): Point {
    if (typeof point === "number") {
      point = { x: point, y: point };
    }
    this.x /= point.x !== undefined ? point.x : 1;
    this.y /= point.y !== undefined ? point.y : 1;
    return this;
  }
  public inverse(): Point {
    this.multiply(-1);
    return this;
  }
  public assign(point: Partial<Data<Point>>): Point {
    this.x = point.x !== undefined ? point.x : this.x;
    this.y = point.y !== undefined ? point.y : this.y;
    return this;
  }
  public top(length: number): Point {
    if (this.x !== 0 || this.y !== 0) {
      const angle = this.getAngle();
      this.x = roundToCero(Math.cos(angle) * length);
      this.y = roundToCero(Math.sin(angle) * length);
    }
    return this;
  }
  public getLength(): number {
    return this.y / Math.sin(this.getAngle());
  }
  public getAngle(): number {
    return Math.atan2(this.y, this.x);
  }
  public abs(): Point {
    this.x = Math.abs(this.x);
    this.y = Math.abs(this.y);
    return this;
  }
}

export function pointFromAngle(angle: number, length: number = 1) {
  return new Point({
    x: roundToCero(Math.cos(angle) * length),
    y: roundToCero(Math.sin(angle) * length)
  });
}

function roundToCero(x: number) {
  // small number
  if (Math.abs(x) < 0.000015) return 0;
  return x;
}
