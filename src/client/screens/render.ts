export function render(root: HTMLElement, element: Node) {
  removeChildren(root);
  root.appendChild(element);
}

export function removeChildren(element: HTMLElement) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}
