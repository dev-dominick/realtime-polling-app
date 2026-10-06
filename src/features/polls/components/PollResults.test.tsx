// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PollResults } from "./PollResults";

describe("PollResults", () => {
  it("renders options and 0-vote totals before any votes", () => {
    render(
      <PollResults
        options={[
          { id: "opt-1", label: "Option A", position: 0, votes: 0, percentage: 0 },
          { id: "opt-2", label: "Option B", position: 1, votes: 0, percentage: 0 },
        ]}
        totalVotes={0}
        liveStatus="refreshing"
      />,
    );

    expect(screen.getByText("Option A")).toBeInTheDocument();
    expect(screen.getByText("Option B")).toBeInTheDocument();
    expect(screen.getByText(/0 total votes/i)).toBeInTheDocument();
    expect(screen.getByText("Refreshing results")).toBeInTheDocument();
  });

  it("shows connected and paused status messages", () => {
    const { rerender } = render(
      <PollResults
        options={[{ id: "opt-1", label: "Option A", position: 0, votes: 3, percentage: 100 }]}
        totalVotes={3}
        liveStatus="connected"
        lastUpdatedAt={Date.now()}
      />,
    );

    expect(screen.getByText("Live results connected")).toBeInTheDocument();

    rerender(
      <PollResults
        options={[{ id: "opt-1", label: "Option A", position: 0, votes: 3, percentage: 100 }]}
        totalVotes={3}
        liveStatus="paused"
      />,
    );

    expect(screen.getByText("Live updates paused")).toBeInTheDocument();
  });
});
