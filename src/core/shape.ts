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
}
