export default function decorate(block) {
  block.classList.add('note-callout');
  const body = block.firstElementChild?.firstElementChild;
  if (body) {
    body.classList.add('note-body');
  }
}
