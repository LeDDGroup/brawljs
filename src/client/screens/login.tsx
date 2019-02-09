import { createElement } from "tsx-create-html-element";
import defer from "p-defer";
import { render } from "./render";

const MAX_COLOR = 255 * 255 * 255;

export async function login(): Promise<{ name: string; color: string }> {
  const container = document.getElementById("app");
  const onClick = defer();
  const randomColor = Math.floor(MAX_COLOR * Math.random()).toString(16);
  const randomName = "newbie";
  const colorInput = (
    <input id="color-picker" type="color" value={`#${randomColor}`} />
  ) as HTMLInputElement;
  const nameInput = (
    <input id="name-picker" type="text" placeholder={randomName} />
  ) as HTMLInputElement;
  render(
    container,
    <div className="container">
      <form>
        {colorInput}
        {nameInput}
      </form>
      <div>
        <button onclick={onClick.resolve}>Go</button>
      </div>
    </div>
  );
  await onClick.promise;
  const name = nameInput.value || randomName;
  const color = colorInput.value;
  return { name, color };
}
