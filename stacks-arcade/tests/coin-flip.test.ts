
import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
const create = (wager: bigint, pick: bigint, sender = address1) =>
  simnet.callPublicFn("coin-flip", "create-game", [simnet.uint(wager), simnet.uint(pick)], sender);
const fund = (id: bigint, sender = address1) =>
  simnet.callPublicFn("coin-flip", "fund-game", [simnet.uint(id)], sender);

/*
  The test below is an example. To learn more, read the testing documentation here:
  https://docs.hiro.so/stacks/clarinet-js-sdk
*/

describe("coin-flip", () => {
  it("ensures simnet is well initialised", () => {
    expect(simnet.blockHeight).toBeDefined();
  });

  it("creates a game with valid wager and pick", () => {
    const { result } = create(1_000_000n, 0n);
    expect(result).toBeOk(simnet.uint(0n));
  });

  it("rejects wagers below minimum", () => {
    const { result } = create(999_999n, 1n);
    expect(result).toBeErr();
  });

  it("rejects wagers above maximum", () => {
    const { result } = create(100_000_001n, 0n);
    expect(result).toBeErr();
  });

  it("rejects invalid picks", () => {
    const { result } = create(1_000_000n, 2n);
    expect(result).toBeErr();
  });

  // it("shows an example", () => {
  //   const { result } = simnet.callReadOnlyFn("counter", "get-counter", [], address1);
  //   expect(result).toBeUint(0);
  // });
});
