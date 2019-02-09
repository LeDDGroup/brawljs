import { createElement } from "tsx-create-html-element";
import { removeChildren } from "./remove-children";
import defer from "p-defer";

const MAX_COLOR = 255 * 255 * 255;

export async function login(): Promise<{ name: string; color: string }> {
  const container = document.getElementById("app");
  removeChildren(container);
  const onClick = defer();
  const nameRef: JSX.Reference<"input"> = {};
  const colorRef: JSX.Reference<"input"> = {};
  const randomColor = Math.floor(MAX_COLOR * Math.random()).toString(16);
  const randomName = "newbie";
  container.appendChild(
    <div className="container">
      <form>
        <input
          id="color-picker"
          ref={colorRef}
          type="color"
          value={`#${randomColor}`}
        />
        <input
          id="name-picker"
          ref={nameRef}
          type="text"
          placeholder={randomName}
        />
      </form>
      <div>
        <button onclick={onClick.resolve}>Go</button>
      </div>
    </div>
  );
  await onClick.promise;
  if (!(nameRef.value && colorRef.value)) {
    removeChildren(container);
    throw new Error("Couldn't get refernece of inputs");
  }
  const name = nameRef.value.value || randomName;
  const color = colorRef.value.value;
  removeChildren(container);
  return { name, color };
}
