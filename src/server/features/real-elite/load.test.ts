import http from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "vitest";
import { loadRealEliteSnapshot } from "./load";

const TOKEN = "test-paperclip-read-token";

type SeenRequest = { method: string | undefined; authorization: string | undefined };

function listen(
  handler: (req: http.IncomingMessage, res: http.ServerResponse) => void,
): Promise<{ url: string; seen: SeenRequest[]; close: () => Promise<void> }> {
  const seen: SeenRequest[] = [];
  const server = http.createServer((req, res) => {
    seen.push({
      method: req.method,
      authorization: req.headers.authorization,
    });
    handler(req, res);
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address() as AddressInfo;
      resolve({
        url: `http://127.0.0.1:${address.port}`,
        seen,
        close: () =>
          new Promise((done, reject) => {
            server.close((error) => (error ? reject(error) : done()));
          }),
      });
    });
  });
}

const closers: Array<() => Promise<void>> = [];

afterEach(async () => {
  await Promise.all(closers.splice(0).map((close) => close()));
});

function env(api: string, extra: Record<string, string> = {}) {
  return {
    REAL_ELITE_COMMAND_API: api,
    REAL_ELITE_BASELINE_DIR: "/nonexistent-real-elite-baseline",
    GOOGLE_CLIENT_ID: "configured-client",
    GOOGLE_CLIENT_SECRET: "configured-secret",
    BETTER_AUTH_SECRET: "configured-auth-secret-32-characters",
    ...extra,
  };
}

describe("Paperclip read-only loader", () => {
  it("does not call Paperclip when the server token is missing", async () => {
    const server = await listen((_req, res) => {
      res.writeHead(200);
      res.end("[]");
    });
    closers.push(server.close);

    const snapshot = await loadRealEliteSnapshot(env(server.url));
    expect(snapshot.actions.state).toBe("unavailable");
    expect(snapshot.actions.items).toEqual([]);
    expect(snapshot.actions.openCount).toBe(0);
    expect(server.seen).toEqual([]);
    expect(JSON.stringify(snapshot)).not.toContain(TOKEN);
  });

  it("sends a GET bearer token and excludes terminal issues from the open count", async () => {
    const server = await listen((req, res) => {
      const path = req.url ?? "";
      if (path.includes("/agents")) {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify([{ id: "agent-1", name: "Cursor" }]));
        return;
      }
      res.writeHead(200, { "content-type": "application/json" });
      res.end(
        JSON.stringify([
          {
            identifier: "REA-1",
            title: "Still open",
            status: "todo",
            assigneeAgentId: "agent-1",
            description: "Verify: open count is one",
          },
          {
            identifier: "REA-2",
            title: "Finished",
            status: "done",
            assigneeAgentId: "agent-1",
            description: "Verify: this one is terminal",
          },
        ]),
      );
    });
    closers.push(server.close);

    const snapshot = await loadRealEliteSnapshot(
      env(server.url, { REAL_ELITE_COMMAND_TOKEN: TOKEN }),
    );
    expect(snapshot.actions.state).toBe("ok");
    expect(snapshot.actions.items).toHaveLength(2);
    expect(snapshot.actions.openCount).toBe(1);
    expect(server.seen).toHaveLength(2);
    expect(server.seen.every((request) => request.method === "GET")).toBe(true);
    expect(
      server.seen.every((request) => request.authorization === `Bearer ${TOKEN}`),
    ).toBe(true);
    expect(JSON.stringify(snapshot)).not.toContain(TOKEN);
    expect(snapshot.google.searchConsole.state).toBe("disconnected");
    expect(snapshot.google.searchConsole.detail).toMatch(/does not start a sign-in/);
    expect(snapshot.google.oauth).toBe("configured");
  });

  it("returns an error state on HTTP 401 without a mutation", async () => {
    const server = await listen((_req, res) => {
      res.writeHead(401);
      res.end("unauthorized");
    });
    closers.push(server.close);

    const snapshot = await loadRealEliteSnapshot(
      env(server.url, { REAL_ELITE_COMMAND_TOKEN: TOKEN }),
    );
    expect(snapshot.actions.state).toBe("error");
    expect(snapshot.actions.detail).toBe("HTTP 401");
    expect(snapshot.actions.items).toEqual([]);
    expect(server.seen.every((request) => request.method === "GET")).toBe(true);
    expect(JSON.stringify(snapshot)).not.toContain(TOKEN);
    expect(JSON.stringify(snapshot)).not.toContain("unauthorized");
  });
});
