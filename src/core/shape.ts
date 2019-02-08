import { Point } from "./point";

export class Circle {
  position: Point = new Point();
  radius: number;
  constructor(radius = 0) {
    this.radius = radius;
  }
  collides(other: Circle): boolean {
    return (
      other.radius + this.radius >
      this.position
        .copy()
        .subtract(other.position)
        .abs()
        .getLength()
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
  collides(other: Rect): boolean {
    return (
      segmentCollides(
        this.position.x,
        this.position.x + this.size.x - 1,
        other.position.x,
        other.position.x + other.size.x - 1
      ) &&
      segmentCollides(
        this.position.y,
        this.position.y + this.size.y - 1,
        other.position.y,
        other.position.y + other.size.y - 1
      )
    );
  }
}

function segmentCollides(
  x1: number,
  x2: number,
  y1: number,
  y2: number
): boolean {
  return (x1 >= y1 && x1 <= y2) || (x2 >= y1 && x2 <= y2);
}
