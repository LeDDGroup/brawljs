import "./index.css";
import { login } from "./screens/login";
import { play } from "./screens/play";

(async () => {
  while (true) {
    const info = await login();
    await play(info);
  }
})().catch(console.error);

declare global {
  interface Document {
    getElementById(selector: "app"): HTMLDivElement;
  }
}
