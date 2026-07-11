const command = "whoami";
const response = "Software Engineer | Philanthropist | System Design & AI ";

function typeText(element, text, delay, done) {
  let index = 0;
  const tick = () => {
    element.textContent = text.slice(0, index);
    index += 1;
    if (index <= text.length) {
      window.setTimeout(tick, delay);
    } else if (done) {
      done();
    }
  };
  tick();
}

function initialiseTerminal() {
  const commandElement = document.querySelector("[data-terminal-command]");
  const outputElement = document.querySelector("[data-terminal-output]");
  if (!commandElement || !outputElement) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    commandElement.textContent = command;
    outputElement.textContent = response;
    return;
  }

  typeText(commandElement, command, 115, () => {
    window.setTimeout(() => typeText(outputElement, response, 38), 450);
  });
}

initialiseTerminal();
