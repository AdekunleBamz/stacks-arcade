
import { Cl, ClarityType, SomeCV, TupleCV, UIntCV } from "@stacks/transactions";
import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

const contractName = "emoji-battle";
const stake = 1_000_000n;

const extractGameId = (response: { value: UIntCV }) => Number(response.value.value);

const getGameTuple = (gameId: number) => {
  const entry = simnet.getMapEntry(contractName, "games", Cl.tuple({ id: Cl.uint(gameId) }));
  expect(entry).toHaveClarityType(ClarityType.OptionalSome);
  return (entry as SomeCV<TupleCV>).value;
};

const createGame = (creator: string, emoji: string, wager: bigint = stake) => {
  const create = simnet.callPublicFn(
    contractName,
    "create-game",
    [Cl.uint(wager), Cl.stringAscii(emoji)],
    creator,
  );
  expect(create.result).toHaveClarityType(ClarityType.ResponseOk);
  return extractGameId(create.result as any);
};

describe("emoji-battle", () => {
  it("rejects invalid emoji on create", () => {
    const res = simnet.callPublicFn(
      contractName,
      "create-game",
      [Cl.uint(stake), Cl.stringAscii("invalid")],
      wallet1,
    );
    expect(res.result).toBeErr(Cl.uint(400));
  });

  it("settles a battle with a clear winner", () => {
    // fire beats leaf
    const gameId = createGame(wallet1, "fire");
    const join = simnet.callPublicFn(
      contractName,
      "join-game",
      [Cl.uint(gameId), Cl.stringAscii("leaf")],
      wallet2,
    );
    expect(join.result).toHaveClarityType(ClarityType.ResponseOk);

    const game = getGameTuple(gameId);
    expect(game.value.creator).toEqual(Cl.standardPrincipal(wallet1));
    expect(game.value.challenger).toEqual(Cl.some(Cl.standardPrincipal(wallet2)));
    expect(game.value.stake).toEqual(Cl.uint(stake));
    expect(game.value.emoji1).toEqual(Cl.stringAscii("fire"));
    expect(game.value.emoji2).toEqual(Cl.some(Cl.stringAscii("leaf")));
    expect(game.value.status).toEqual(Cl.uint(1));
    expect(game.value.winner).toEqual(Cl.some(Cl.standardPrincipal(wallet1)));
    expect(game.value.result).toEqual(Cl.stringAscii("creator"));

    const creatorBalance = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.standardPrincipal(wallet1)],
      wallet1,
    );
    expect(creatorBalance.result).toBeUint(stake * 2n);
    const challengerBalance = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.standardPrincipal(wallet2)],
      wallet2,
    );
    expect(challengerBalance.result).toBeUint(0);
  });

  it("refunds both players on a tie", () => {
    const gameId = createGame(wallet1, "water");
    const join = simnet.callPublicFn(
      contractName,
      "join-game",
      [Cl.uint(gameId), Cl.stringAscii("water")],
      wallet2,
    );
    expect(join.result).toHaveClarityType(ClarityType.ResponseOk);

    const game = getGameTuple(gameId);
    expect(game.value.winner).toBeNone();
    expect(game.value.result).toEqual(Cl.stringAscii("tie"));

    const creatorBalance = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.standardPrincipal(wallet1)],
      wallet1,
    );
    expect(creatorBalance.result).toBeUint(stake);
    const challengerBalance = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.standardPrincipal(wallet2)],
      wallet2,
    );
    expect(challengerBalance.result).toBeUint(stake);
  });

  it("allows creator to cancel before a challenger joins and claim refund", () => {
    const gameId = createGame(wallet1, "leaf");
    const cancel = simnet.callPublicFn(
      contractName,
      "cancel-game",
      [Cl.uint(gameId)],
      wallet1,
    );
    expect(cancel.result).toBeOk(Cl.bool(true));

    const game = getGameTuple(gameId);
    expect(game.value.status).toEqual(Cl.uint(2));
    expect(game.value.result).toEqual(Cl.stringAscii("canceled"));

    const balance = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.standardPrincipal(wallet1)],
      wallet1,
    );
    expect(balance.result).toBeUint(stake);
  });

  it("lets the winner claim their payout and zeroes owed balance", () => {
    const gameId = createGame(wallet1, "fire");
    simnet.callPublicFn(contractName, "join-game", [Cl.uint(gameId), Cl.stringAscii("leaf")], wallet2);

    const owed = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.standardPrincipal(wallet1)],
      wallet1,
    );
    expect(owed.result).toBeUint(stake * 2n);

    const claim = simnet.callPublicFn(contractName, "claim", [], wallet1);
    expect(claim.result).toBeOk(Cl.bool(true));

    const cleared = simnet.callReadOnlyFn(
      contractName,
      "get-balance",
      [Cl.standardPrincipal(wallet1)],
      wallet1,
    );
    expect(cleared.result).toBeUint(0);
  });
});
