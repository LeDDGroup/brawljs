import { Point } from "../../core/point";

type Direction = "right" | "down" | "left" | "up";

export class PlayerInput {
  public keyboardStatus: { [id: string]: boolean } = {};
  public attacking = false;
  public keybindings: Record<Direction, string>;
  public canvas: HTMLCanvasElement;
  public pointing = new Point();
  constructor(options: {
    keybindings: Record<Direction, string>;
    canvas: HTMLCanvasElement;
  }) {
    this.keybindings = options.keybindings;
    this.canvas = options.canvas;
  }
  moving() {
    return new Point({
      x:
        bto1(this.keyboardStatus[this.keybindings.right]) -
        bto1(this.keyboardStatus[this.keybindings.left]),
      y:
        bto1(this.keyboardStatus[this.keybindings.down]) -
        bto1(this.keyboardStatus[this.keybindings.up])
    });
  }
  setup() {
    document.addEventListener("keydown", ev => {
      if (ev.key === " ") {
        ev.preventDefault();
      }
      this.keyboardStatus[ev.key] = true;
    });
    document.addEventListener("keyup", ev => {
      if (ev.key === " ") {
        ev.preventDefault();
      }
      this.keyboardStatus[ev.key] = false;
    });
    window.addEventListener("click", ev => {
      this.pointing
        .assign({
          x: ev.clientX,
          y: ev.clientY
        })
        .subtract({
          x: document.documentElement.clientWidth / 2,
          y: document.documentElement.clientHeight / 2
        });
      this.attacking = true;
    });
  }
  resetInput() {
    this.attacking = false;
  }
}

function bto1(b: boolean) {
  return b ? 1 : 0;
}
