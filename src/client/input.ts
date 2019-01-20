export class Input {
  public keyboardStatus: { [id: string]: boolean } = {};
  public setupKeyboardEvents() {
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
  }
}
