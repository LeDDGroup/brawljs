import { createElement } from "tsx-create-html-element";
import defer from "p-defer";
import { render } from "./render";
import { PlayerType } from "../../core/game";

const MAX_COLOR = 255 * 255 * 255;

const TERRAIN = `
111111111111111111
1p              p1
1   1# #### #1   1
1   11 1111 11   1
1                1
1  ####1  1####  1
1  ####1  1####  1
1  11111  11111  1
1                1
1                1
1  11111  11111  1
1  ####1  1####  1
1  ####1  1####  1
1                1
1   11 1111 11   1
1   1# #### #1   1
1p              p1
111111111111111111
`;

export async function login() {
  const container = document.getElementById("app");
  const onConnect = defer<string>(); // choice === 0 create game
  const randomColor = Math.floor(MAX_COLOR * Math.random()).toString(16);
  const randomName = "newbie";
  const colorInput = (
    <input id="color-picker" type="color" value={`#${randomColor}`} />
  ) as HTMLInputElement;
  const nameInput = (
    <input id="name-picker" type="text" placeholder={randomName} />
  ) as HTMLInputElement;
  const typeInput = (
    <select>
      <option>mele</option>
      <option>sharpshooter</option>
    </select>
  ) as HTMLSelectElement;
  const gameList = <table /> as HTMLTableElement;
  render(
    container,
    <div className="container">
      <div className="top">
        <div className="input-form">
          {colorInput}
          {nameInput}
          {typeInput}
        </div>
        <div>
          <button onclick={createGame}>Create Game</button>
        </div>
      </div>
      {gameList}
    </div>
  );
  await refreshGames();
  const gameId = await onConnect.promise;
  const name = nameInput.value || randomName;
  const type = typeInput.value as PlayerType;
  const color = colorInput.value;
  return { type, name, color, gameId };
  // TODO handle errors
  // TODO refactor, put in interface as done with sockets
  async function refreshGames() {
    const result = await fetch("/games");
    const games = (await result.json()) as {
      name: string;
      id: string;
      players: number;
    }[];
    render(
      gameList,
      ...games.map(({ id, name, players }) => (
        <tr>
          <td>
            <span>{name}</span>
          </td>
          <td>
            <span>{players} player(s)</span>
          </td>
          <td>
            <button onclick={() => onConnect.resolve(id)}>Connect</button>
          </td>
        </tr>
      ))
    );
  }
  async function createGame() {
    const result = await fetchPost("/games", {
      name: `${nameInput.value || randomName}'s Game`,
      terrain: TERRAIN
    });
    const { id } = await result.json();
    onConnect.resolve(id);
  }
}

function fetchPost(url: string, data: object) {
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    },
    body: JSON.stringify(data)
  });
}
