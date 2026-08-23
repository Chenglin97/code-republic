import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SimulationControls } from "./simulation-controls";

function render(props: Partial<React.ComponentProps<typeof SimulationControls>> = {}) {
  return renderToStaticMarkup(
    <SimulationControls
      onAdvance={() => undefined}
      {...props}
    />,
  );
}

describe("SimulationControls", () => {
  it("renders an enabled, explicitly labeled completion simulation", () => {
    const markup = render({ nextStep: "Accept the independent contract evidence." });

    expect(markup).toContain('role="group"');
    expect(markup).toContain('aria-label="Simulation controls"');
    expect(markup).toContain('aria-label="Simulate completion"');
    expect(markup).toContain("Accept the independent contract evidence.");
    expect(markup).not.toContain("disabled");
    expect(markup).not.toContain("Reset completion status for simulation");
  });

  it("shows the optional homepage reset action with exact simulation copy", () => {
    const markup = render({ onReset: () => undefined });

    expect(markup).toContain('aria-label="Reset completion status for simulation"');
    expect(markup).toContain("Reset completion status for simulation");
    expect(markup).toContain("Return this World to the initial simulation state.");
  });

  it("disables both actions while a simulation request is in flight", () => {
    const markup = render({ onReset: () => undefined, busy: "advance" });

    expect(markup).toContain('aria-busy="true"');
    expect(markup).toContain("Simulating completion…");
    expect(markup.match(/disabled/g)).toHaveLength(2);
  });

  it("marks completion as terminal while leaving reset available", () => {
    const markup = render({ onReset: () => undefined, complete: true });

    expect(markup).toContain('aria-label="Simulation complete"');
    expect(markup).toContain("All scripted completion steps are applied.");
    expect(markup.match(/disabled/g)).toHaveLength(1);
  });

  it("exposes compact mode without hiding the concrete action label", () => {
    const markup = render({ compact: true });

    expect(markup).toContain('data-compact="true"');
    expect(markup).toContain("Simulate completion");
    expect(markup).not.toContain("Apply the next scripted completion step.");
  });
});
