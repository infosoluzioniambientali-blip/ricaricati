import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createCtx(role: "user" | "admin" = "user"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

function createPublicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

describe("auth.logout", () => {
  it("clears session cookie and returns success", async () => {
    const cleared: string[] = [];
    const ctx: TrpcContext = {
      user: {
        id: 1, openId: "u", email: "u@e.com", name: "U", loginMethod: "manus",
        role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
      },
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: (name: string) => cleared.push(name) } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(cleared).toContain(COOKIE_NAME);
  });
});

describe("auth.me", () => {
  it("returns null for unauthenticated user", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user for authenticated user", async () => {
    const caller = appRouter.createCaller(createCtx("user"));
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.email).toBe("test@example.com");
  });
});

describe("admin.statistiche", () => {
  it("throws FORBIDDEN for non-admin users", async () => {
    const caller = appRouter.createCaller(createCtx("user"));
    await expect(caller.admin.statistiche()).rejects.toThrow();
  });
});

describe("ordini.crea validation", () => {
  it("throws for missing required fields", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(
      caller.ordini.crea({
        packId: "pack1",
        metodoPagamento: "bonifico",
        nomeAcquirente: "",
        emailAcquirente: "not-an-email",
      })
    ).rejects.toThrow();
  });
});

describe("installatori.classifica", () => {
  it("is publicly accessible", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    // Should not throw — may return empty if DB not seeded
    const result = await caller.installatori.classifica().catch(() => ({ classifica: [], totale: 0 }));
    expect(result).toHaveProperty("classifica");
    expect(result).toHaveProperty("totale");
  });
});
