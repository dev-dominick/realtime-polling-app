// @vitest-environment jsdom

import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePollResults } from "./index";

class MockEventSource {
  static instances: MockEventSource[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  closed = false;

  constructor(public readonly url: string) {
    MockEventSource.instances.push(this);
  }

  close() {
    this.closed = true;
  }
}

function Harness(props: {
  pollId: string | null;
  enabled: boolean;
  onDataUpdate?: (data: {
    totalVotes: number;
    options: Array<{ id: string; votes: number }>;
  }) => void;
  onState?: (state: {
    error: string | null;
    liveStatus: "connected" | "refreshing" | "paused";
    lastUpdatedAt: number | null;
  }) => void;
}) {
  const state = usePollResults(props.pollId, props.enabled, props.onDataUpdate as never);

  if (props.onState) {
    props.onState(state);
  }

  return null;
}

describe("usePollResults", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    MockEventSource.instances = [];
    vi.stubGlobal("EventSource", MockEventSource as unknown as typeof EventSource);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("subscribes to SSE and forwards parsed updates", async () => {
    const onDataUpdate = vi.fn();

    render(<Harness pollId="poll-123" enabled={true} onDataUpdate={onDataUpdate} />);

    expect(MockEventSource.instances).toHaveLength(1);
    expect(MockEventSource.instances[0]?.url).toBe("/api/projects/polls/poll-123/stream");

    MockEventSource.instances[0]?.onmessage?.({
      data: JSON.stringify({ totalVotes: 2, options: [{ id: "opt-1", votes: 2 }] }),
    });

    expect(onDataUpdate).toHaveBeenCalledWith({
      totalVotes: 2,
      options: [{ id: "opt-1", votes: 2 }],
    });
  });

  it("returns paused status when stream is disabled", async () => {
    const onState = vi.fn();

    render(<Harness pollId="poll-321" enabled={false} onState={onState} />);
    expect(MockEventSource.instances).toHaveLength(0);

    const pausedCall = onState.mock.calls
      .map((call) => call[0])
      .find((state) => state.liveStatus === "paused");

    expect(pausedCall).toBeTruthy();
  });

  it("reconnects after stream errors", async () => {
    render(<Harness pollId="poll-456" enabled={true} />);
    expect(MockEventSource.instances).toHaveLength(1);

    MockEventSource.instances[0]?.onerror?.();
    expect(MockEventSource.instances[0]?.closed).toBe(true);

    await vi.advanceTimersByTimeAsync(2000);
    expect(MockEventSource.instances).toHaveLength(2);
    expect(MockEventSource.instances[1]?.url).toBe("/api/projects/polls/poll-456/stream");
  });

  it("cleans up active stream and reconnect timer on unmount", async () => {
    const view = render(<Harness pollId="poll-789" enabled={true} />);
    expect(MockEventSource.instances).toHaveLength(1);

    MockEventSource.instances[0]?.onerror?.();
    view.unmount();

    expect(MockEventSource.instances[0]?.closed).toBe(true);
    await vi.advanceTimersByTimeAsync(4000);
    expect(MockEventSource.instances).toHaveLength(1);
  });
});
