import { useEffect, useState } from "react";

export default function PortfolioTerminal({ command, output, ariaLabel }) {
  const [typedCommand, setTypedCommand] = useState("");
  const [typedOutput, setTypedOutput] = useState("");

  useEffect(() => {
    setTypedCommand("");
    setTypedOutput("");

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTypedCommand(command);
      setTypedOutput(output);
      return undefined;
    }

    const timers = [];
    const type = (text, setter, delay, done) => {
      let index = 0;
      const tick = () => {
        setter(text.slice(0, index));
        index += 1;
        if (index <= text.length) timers.push(window.setTimeout(tick, delay));
        else done?.();
      };
      tick();
    };

    type(command, setTypedCommand, 72, () => {
      timers.push(window.setTimeout(() => type(output, setTypedOutput, 32), 260));
    });

    return () => timers.forEach(window.clearTimeout);
  }, [command, output]);

  return (
    <div className="terminal" aria-label={ariaLabel} data-reveal>
      <div className="terminal__bar">
        <span className="terminal__controls" aria-hidden="true"><i /><i /><i /></span>
        <span>terminal - reggie@barbacena</span>
      </div>
      <div className="terminal__body">
        <p>
          <span className="terminal__prompt">reggie@barbacena ~ $</span>{" "}
          <span data-terminal-command>{typedCommand}</span>
          <span className="terminal__cursor" aria-hidden="true" />
        </p>
        <p className="terminal__output" data-terminal-output>{typedOutput}</p>
      </div>
    </div>
  );
}
