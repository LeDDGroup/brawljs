import { createElement } from "tsx-create-html-element";
import { removeChildren } from "./remove-children";
import defer from "p-defer";

export async function login(): Promise<{ name: string; color: string }> {
  const container = document.getElementById("app");
  removeChildren(container);
  const onClick = defer();
  const nameRef: JSX.Reference<"input"> = {};
  const colorRef: JSX.Reference<"input"> = {};
  container.appendChild(
    <div>
      <input ref={nameRef} type="text" placeholder="name" value="newbie" />
      <input ref={colorRef} type="color" placeholder="color" />
      <button onclick={onClick.resolve}>Go</button>
    </div>
  );
  await onClick.promise;
  if (!(nameRef.value && colorRef.value)) {
    removeChildren(container);
    throw new Error("Couldn't get refernece of inputs");
  }
  const name = nameRef.value.value;
  const color = colorRef.value.value;
  removeChildren(container);
  return { name, color };
}
