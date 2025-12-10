
import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;

/*
  The test below is an example. To learn more, read the testing documentation here:
  https://docs.hiro.so/stacks/clarinet-js-sdk
*/

describe("coin-flip", () => {
  it("ensures simnet is well initialised", () => {
    expect(simnet.blockHeight).toBeDefined();
  });

  it("creates a game with valid wager and pick", () => {
    const { result } = simnet.callPublicFn(
      "coin-flip",
      "create-game",
      [simnet.uint(1_000_000n), simnet.uint(0)],
      address1
    );
    expect(result).toBeOk(simnet.uint(0n));
  });

  it("rejects wagers below minimum", () => {
    const { result } = simnet.callPublicFn(
      "coin-flip",
      "create-game",
      [simnet.uint(999_999n), simnet.uint(1)],
      address1
    );
    expect(result).toBeErr();
  });

  // it("shows an example", () => {
  //   const { result } = simnet.callReadOnlyFn("counter", "get-counter", [], address1);
  //   expect(result).toBeUint(0);
  // });
});
