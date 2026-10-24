// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { AccuracyChart } from "@/components/dashboard/accuracy-chart";
import type { ChartRow } from "@/lib/chart-rows";

const WIDTH = 600;
const HEIGHT = 288;

// Trois parties du même import : même date, précisions différentes
function row(accuracy: number, shotsHit: number): ChartRow {
  return {
    date: "2026-10-24T10:00:00.000Z",
    accuracyA: accuracy,
    accuracyB: null,
    a: { accuracy, shotsHit, totalShots: 100, sessions: 1, weapons: ["R-99"] },
    b: null,
    mouse: null,
  };
}

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Element.prototype.getBoundingClientRect = () =>
    ({ x: 0, y: 0, left: 0, top: 0, right: WIDTH, bottom: HEIGHT, width: WIDTH, height: HEIGHT, toJSON() {} }) as DOMRect;
});

afterEach(cleanup);

describe("AccuracyChart : parties partageant la même date", () => {
  it("affiche l'infobulle de chaque partie au survol, pas seulement de la première", async () => {
    const rows = [row(30, 30), row(50, 50), row(70, 70)];
    const { container } = render(
      <AccuracyChart
        granularity="session"
        rows={rows}
        compare={false}
        markers={[]}
        labels={{ a: "R-99", b: null }}
      />,
    );
    const wrapper = container.querySelector(".recharts-wrapper");
    expect(wrapper).not.toBeNull();

    // Survol près du bord droit : doit tomber sur la dernière partie (70 %), pas sur la première (30 %)
    fireEvent.mouseEnter(wrapper as Element, { clientX: WIDTH - 20, clientY: 100 });
    fireEvent.mouseMove(wrapper as Element, { clientX: WIDTH - 20, clientY: 100 });
    await waitFor(() => expect(screen.getByText("70.00 %")).toBeTruthy());
    expect(screen.queryByText("30.00 %")).toBeNull();
  });
});
