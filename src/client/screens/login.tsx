import { createElement } from "tsx-create-html-element";
import defer from "p-defer";
import { render } from "./render";

const MAX_COLOR = 255 * 255 * 255;

const TERRAIN = `
111111111111
1p00000000p1
101110011101
100000000001
100111111001
100010000001
100000010001
100111111001
100000000001
101110011101
1p00000000p1
111111111111
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
  const gameList = <ul /> as HTMLUListElement;
  render(
    container,
    <div className="container">
      <form>
        {colorInput}
        {nameInput}
      </form>
      <button onclick={createGame}>Create Game</button>
      {gameList}
    </div>
  );
  await refreshGames();
  const gameId = await onConnect.promise;
  const name = nameInput.value || randomName;
  const color = colorInput.value;
  return { name, color, gameId };
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
        <li>
          {name}, {players} player(s)
          <button onclick={() => onConnect.resolve(id)}>Connect</button>
        </li>
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
