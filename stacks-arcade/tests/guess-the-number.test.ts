import { Cl, ClarityType, SomeCV, TupleCV, UIntCV } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
const contractName = "guess-the-number";
const accounts = simnet.getAccounts();
const player = accounts.get("wallet_1")!;
const minBet = 1_000_000n;
const maxBet = 100_000_000n;
const maxNumber = 9;

const nextGameId = () => {
  const res = simnet.callReadOnlyFn(
    contractName,
    "get-next-game-id",
    [],
    player
  );
  expect(res.result.type).toBe(ClarityType.UInt);
  return Number((res.result as UIntCV).value);
};

const getGame = (id: number) => {
  const entry = simnet.getMapEntry(
    contractName,
    "games",
    Cl.tuple({ id: Cl.uint(id) })
  );
  expect(entry).toHaveClarityType(ClarityType.OptionalSome);
  return (entry as SomeCV<TupleCV>).value;
};

const getBalance = (addr: string) => {
  const res = simnet.callReadOnlyFn(
    contractName,
    "get-balance",
    [Cl.principal(addr)],
    addr
  );
  expect(res.result.type).toBe(ClarityType.UInt);
  return (res.result as UIntCV).value;
};

const playOnce = (wager: bigint, guess: number) => {
  const beforeId = nextGameId();
  const res = simnet.callPublicFn(
    contractName,
    "play",
    [Cl.uint(wager), Cl.uint(guess)],
    player
  );
  expect(res.result).toHaveClarityType(ClarityType.ResponseOk);
  const game = getGame(beforeId);
  expect(game.value.id).toStrictEqual(Cl.uint(beforeId));
  expect(game.value.player).toStrictEqual(Cl.standardPrincipal(player));
  expect((game.value.guess as UIntCV).value).toStrictEqual(
    Cl.uint(guess).value
  );
  expect((game.value.draw as UIntCV).value).toBeLessThanOrEqual(
    BigInt(maxNumber)
  );
  return {
    gameId: beforeId,
    draw: Number((game.value.draw as UIntCV).value),
    winner: game.value.winner.type === ClarityType.BoolTrue,
  };
};
const playUntilWin = (wager: bigint, maxAttempts = 20) => {
  let attempt = 0;
  while (attempt < maxAttempts) {
    const guess = attempt % (maxNumber + 1);
    const play = playOnce(wager, guess);
    if (play.winner) return play;
    simnet.mineEmptyStacksBlock();
    attempt += 1;
  }
  throw new Error("Could not find a winning draw within attempts");
};

describe("guess-the-number", () => {
  it("rejects out-of-range guesses", () => {
    const res = simnet.callPublicFn(
      contractName,
      "play",
      [Cl.uint(minBet), Cl.uint(maxNumber + 1)],
      player
    );
    expect(res.result).toBeErr(Cl.uint(400));
  });

  it("rejects bets below and above limits", () => {
    const low = simnet.callPublicFn(
      contractName,
      "play",
      [Cl.uint(minBet - 1n), Cl.uint(0)],
      player
    );
    expect(low.result).toBeErr(Cl.uint(401));
    const high = simnet.callPublicFn(
      contractName,
      "play",
      [Cl.uint(maxBet + 1n), Cl.uint(0)],
      player
    );
    expect(high.result).toBeErr(Cl.uint(402));
  });

  it("records games and increments ids", () => {
    const startId = nextGameId();
    const { gameId } = playOnce(minBet, 0);
    expect(gameId).toBe(startId);
    const nextId = nextGameId();
    expect(nextId).toBe(startId + 1);
  });
  
});
