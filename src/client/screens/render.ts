export function render(root: HTMLElement, ...elements: Node[]) {
  removeChildren(root);
  root.append(...elements);
}

export function removeChildren(element: HTMLElement) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}
