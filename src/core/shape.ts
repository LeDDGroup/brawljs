import { Point } from "./point";

export class Circle {
  position: Point = new Point();
  radius: number;
  constructor(radius = 0) {
    this.radius = radius;
  }
  collides(other: Circle): boolean {
    return (
      other.radius + this.radius > this.position.distanceTo(other.position)
    );
  }
  toRect(): Rect {
    const size = this.radius * 2;
    const rect = new Rect();
    rect.position.assign(this.position.copy().subtract(this.radius));
    rect.size.assign({ x: size, y: size });
    return rect;
  }
}

export class Rect {
  position: Point = new Point();
  size: Point = new Point();
  move = (...args: Parameters<Point["sum"]>) => (
    this.position.sum(...args), this
  );
  rectCopy(): Rect {
    const newRect = new Rect();
    newRect.position.assign(this.position);
    newRect.size.assign(this.size);
    return newRect;
  }
}
