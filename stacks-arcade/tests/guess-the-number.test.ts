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
