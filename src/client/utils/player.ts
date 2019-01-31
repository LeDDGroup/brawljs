import { IPoint } from "../../core/point";

type Direction = "right" | "down" | "left" | "up";

export class Player {
  public keyboardStatus: { [id: string]: boolean } = {};
  public shooting = false;
  public keybindings: Record<Direction, string>;
  constructor(options: { keybindings: Record<Direction, string> }) {
    this.keybindings = options.keybindings;
  }
  moving(): IPoint {
    return {
      x:
        bto1(this.keyboardStatus[this.keybindings.right]) -
        bto1(this.keyboardStatus[this.keybindings.left]),
      y:
        bto1(this.keyboardStatus[this.keybindings.down]) -
        bto1(this.keyboardStatus[this.keybindings.up])
    };
  }
  pointing(): IPoint {
    // TODO use canvas and player position
    return this.moving();
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
    document.addEventListener("click", () => {
      this.shooting = true;
    });
  }
  resetInput() {
    this.shooting = false;
  }
}

function bto1(b: boolean) {
  return b ? 1 : 0;
}
