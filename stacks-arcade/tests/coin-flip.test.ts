
import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
const create = (wager: bigint, pick: bigint, sender = address1) =>
  simnet.callPublicFn("coin-flip", "create-game", [simnet.uint(wager), simnet.uint(pick)], sender);
const fund = (id: bigint, sender = address1) =>
  simnet.callPublicFn("coin-flip", "fund-game", [simnet.uint(id)], sender);
const getGame = (id: bigint) =>
  simnet.callReadOnlyFn("coin-flip", "get-game", [simnet.uint(id)], address1);
const flip = (id: bigint, sender = address1) =>
  simnet.callPublicFn("coin-flip", "flip", [simnet.uint(id)], sender);
const nextFlipParity = () => (BigInt(simnet.blockHeight) + 1n) % 2n;
const getBalance = (who = address1) =>
  simnet.callReadOnlyFn("coin-flip", "get-balance", [simnet.principal(who)], who);
const claim = (sender = address1) => simnet.callPublicFn("coin-flip", "claim", [], sender);

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

  it("funds a created game", () => {
    const { result: createResult } = create(1_000_000n, 0n);
    expect(createResult).toBeOk(simnet.uint(0n));
    const { result: fundResult } = fund(0n);
    expect(fundResult).toBeOk();
    const funded = simnet.callReadOnlyFn("coin-flip", "is-funded", [simnet.uint(0)], address1);
    expect(funded.result).toBeBool(true);
  });

  it("blocks funding from non-player", () => {
    create(1_000_000n, 0n);
    const { result } = fund(0n, address2);
    expect(result).toBeErr();
  });

  it("does not allow double funding", () => {
    create(1_000_000n, 0n);
    expect(fund(0n).result).toBeOk();
    expect(fund(0n).result).toBeErr();
  });

  it("cancels before funding", () => {
    create(1_000_000n, 0n);
    const { result } = simnet.callPublicFn("coin-flip", "cancel-game", [simnet.uint(0)], address1);
    expect(result).toBeOk();
    const { result: postFund } = fund(0n);
    expect(postFund).toBeErr();
  });

  it("blocks cancel from non-player", () => {
    create(1_000_000n, 0n);
    const { result } = simnet.callPublicFn("coin-flip", "cancel-game", [simnet.uint(0)], address2);
    expect(result).toBeErr();
  });

  it("cannot cancel after funding", () => {
    create(1_000_000n, 0n);
    fund(0n);
    const { result } = simnet.callPublicFn("coin-flip", "cancel-game", [simnet.uint(0)], address1);
    expect(result).toBeErr();
  });

  it("cannot flip before funding", () => {
    create(1_000_000n, 0n);
    const { result } = flip(0n);
    expect(result).toBeErr();
  });

  it("prevents non-player flip", () => {
    create(1_000_000n, 0n);
    fund(0n);
    const { result } = flip(0n, address2);
    expect(result).toBeErr();
  });

  it("credits balance when guess wins", () => {
    const startHeight = BigInt(simnet.blockHeight);
    const winningPick = (startHeight + 3n) % 2n;
    create(1_000_000n, winningPick);
    fund(0n);
    const { result } = flip(0n);
    expect(result).toBeOk();
    const balance = getBalance();
    expect(balance.result).toBeUint(2_000_000n);
  });

  it("does not credit balance when guess loses", () => {
    const startHeight = BigInt(simnet.blockHeight);
    const winningPick = (startHeight + 3n) % 2n;
    const losingPick = (winningPick + 1n) % 2n;
    create(1_000_000n, losingPick);
    fund(0n);
    const { result } = flip(0n);
    expect(result).toBeOk();
    const balance = getBalance();
    expect(balance.result).toBeUint(0n);
  });

  it("cannot flip twice", () => {
    const startHeight = BigInt(simnet.blockHeight);
    const winningPick = (startHeight + 3n) % 2n;
    create(1_000_000n, winningPick);
    fund(0n);
    expect(flip(0n).result).toBeOk();
    expect(flip(0n).result).toBeErr();
  });

  // it("shows an example", () => {
  //   const { result } = simnet.callReadOnlyFn("counter", "get-counter", [], address1);
  //   expect(result).toBeUint(0);
  // });
});
