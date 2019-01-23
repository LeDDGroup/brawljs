export function removeChildren(element: HTMLElement) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}
