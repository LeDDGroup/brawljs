export interface IPoint {
  x: number;
  y: number;
}

export class Point implements IPoint {
  public x: number;
  public y: number;
  constructor(options: { x?: number; y?: number } = {}) {
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
  public sum(point: Partial<IPoint> | number): Point {
    if (typeof point === "number") {
      point = { x: point, y: point };
    }
    this.x += point.x || 0;
    this.y += point.y || 0;
    return this;
  }
  public subtract(point: Partial<IPoint> | number): Point {
    if (typeof point === "number") {
      point = { x: point, y: point };
    }
    this.x -= point.x || 0;
    this.y -= point.y || 0;
    return this;
  }
  public multiply(index: number): Point {
    this.x *= index;
    this.y *= index;
    return this;
  }
  public divide(index: number): Point {
    this.x /= index;
    this.y /= index;
    return this;
  }
  public inverse(): Point {
    this.multiply(-1);
    return this;
  }
  public assign(point: Partial<IPoint>): Point {
    this.x = point.x !== undefined ? point.x : this.x;
    this.y = point.y !== undefined ? point.y : this.y;
    return this;
  }
}
