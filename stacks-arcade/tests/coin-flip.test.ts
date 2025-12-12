tests/coin-flip.test.ts
// Import Clarity types and utilities for contract interactions
import { Cl, ClarityType, SomeCV, TupleCV, UIntCV } from
"@stacks/transactions";
// Import vitest testing utilities
import { describe, expect, it } from "vitest";

// Get test accounts from simnet (simulated network)
const accounts = simnet.getAccounts();
const wallet1 = accounts.get("wallet_1")!; // Primary test wallet
const wallet2 = accounts.get("wallet_2")!; // Secondary test wallet for validation tests

// Contract address and name for function calls
const contractPrincipal = `${simnet.deployer}.coin-flip`;
const contractName = "coin-flip";

// Constants matching the contract configuration
const minBet = 1_000_000n; // Minimum bet amount (1 STX in microstacks)
const settledStatus = 1n; // Game status value for settled games
// Helper function to extract game ID from contract response
const extractGameId = (response: { value: UIntCV }) =>
Number(response.value.value);

// Helper function to fund the contract with STX for testing payouts
const fundContract = (amount: bigint) => {
simnet.mintSTX(simnet.deployer, amount);
simnet.transferSTX(amount, contractPrincipal, simnet.deployer);
};

// Helper function to create a game and fund it in one step
// Returns the game ID for use in subsequent operations
const createAndFundGame = (pick: number, wager: bigint, player: string) =>
{
// Create the game with specified pick (0 = heads, 1 = tails) and wager
const create = simnet.callPublicFn(
contractName,
"create-game",
[Cl.uint(wager), Cl.uint(pick)],
player,
);
expect(create.result).toHaveClarityType(ClarityType.ResponseOk);const gameId = extractGameId(create.result as any);

// Fund the created game by transferring the wager to the contract
const fund = simnet.callPublicFn(contractName, "fund-game",
[Cl.uint(gameId)], player);
expect(fund.result).toBeOk(Cl.bool(true));
return gameId;
};

// Helper function to retrieve a game tuple from the contract's games map
// Throws an error if the game doesn't exist
const getGameTuple = (gameId: number) => {
const entry = simnet.getMapEntry(contractName, "games", Cl.tuple({ id:
Cl.uint(gameId) }));
if (entry.type !== ClarityType.OptionalSome) {
throw new Error(`Game ${gameId} not found`);
}
return (entry as SomeCV<TupleCV>).value;
};
// Helper function to play games until a win is achieved
// Alternates between heads (0) and tails (1) to ensure a win eventually
// Mines empty blocks between attempts to change block-height/time for randomness
const playUntilWin = (wager: bigint) => {
let attempt = 0;
while (attempt < 6) {
// Alternate pick between 0 and 1 each attempt
const pick = attempt % 2;
// Create and fund a new game
const gameId = createAndFundGame(pick, wager, wallet1);
// Execute the flip
const flip = simnet.callPublicFn(contractName, "flip", [Cl.uint(gameId)],wallet1);
expect(flip.result).toHaveClarityType(ClarityType.ResponseOk);
// Check if this flip resulted in a win
const gameEntry = getGameTuple(gameId);
const winner = (gameEntry.value.winner as any).type ===
ClarityType.BoolTrue;
if (winner) {
// Return the winning game details
return { gameId, gameEntry, pick };
}
// Mine a block to change block-height/time for next attempt's randomness
simnet.mineEmptyStacksBlock();
attempt += 1;
}
throw new Error("Could not produce a winning flip within 6 attempts");
};
describe("coin-flip", () => {
it("rejects invalid pick values", () => {
const res = simnet.callPublicFn(
contractName,
"create-game",
[Cl.uint(minBet), Cl.uint(2)],
wallet1,
);
expect(res.result).toBeErr(Cl.uint(103));});
it("requires the player to fund their own game", () => {
const create = simnet.callPublicFn(
contractName,
"create-game",
[Cl.uint(minBet), Cl.uint(0)],
wallet1,
);
expect(create.result).toBeOk(Cl.uint(0));
const gameId = extractGameId(create.result as any);
const fund = simnet.callPublicFn(
contractName,
"fund-game",
[Cl.uint(gameId)],
wallet2,
);
expect(fund.result).toBeErr(Cl.uint(104));
const gameEntry = getGameTuple(gameId);expect(gameEntry).toEqual(
Cl.tuple({
id: Cl.uint(gameId),
player: Cl.standardPrincipal(wallet1),
wager: Cl.uint(minBet),
pick: Cl.uint(0),
funded: Cl.bool(false),
status: Cl.uint(0),
result: Cl.none(),
winner: Cl.bool(false),
}),
);
});
it("settles a flip and records payout based on winner", () => {
fundContract(10_000_000n);
const wager = 2_000_000n;
const gameId = createAndFundGame(0, wager, wallet1);
const flip = simnet.callPublicFn(contractName, "flip", [Cl.uint(gameId)],
wallet1);
expect(flip.result).toHaveClarityType(ClarityType.ResponseOk);const gameEntry = getGameTuple(gameId);
const storedResult = (gameEntry.value.result as
SomeCV<UIntCV>).value.value;
const winner = (gameEntry.value.winner as any).type ===
ClarityType.BoolTrue;
expect(gameEntry).toEqual(
Cl.tuple({
id: Cl.uint(gameId),
player: Cl.standardPrincipal(wallet1),
wager: Cl.uint(wager),
pick: Cl.uint((gameEntry.value.pick as UIntCV).value),
funded: Cl.bool(true),
status: Cl.uint(settledStatus),
result: Cl.some(Cl.uint(storedResult)),
winner: Cl.bool(winner),
}),
);
const owed = simnet.callReadOnlyFn(
contractName,
"get-balance",
[Cl.standardPrincipal(wallet1)],
wallet1,);
const expectedPayout = winner ? wager * 2n : 0n;
expect(owed.result).toBeUint(expectedPayout);
});
it("claims a winning payout and clears owed balance", () => {
fundContract(10_000_000n);
const wager = minBet;
const { gameId, gameEntry, pick } = playUntilWin(wager);
const resultValue = (gameEntry.value.result as
SomeCV<UIntCV>).value.value;
expect((gameEntry.value.winner as any).type).toBe(ClarityType.BoolTrue);
expect(gameEntry).toEqual(
Cl.tuple({
id: Cl.uint(gameId),
player: Cl.standardPrincipal(wallet1),
wager: Cl.uint(wager),
pick: Cl.uint(pick),
funded: Cl.bool(true),
status: Cl.uint(settledStatus),
result: Cl.some(Cl.uint(resultValue)),
winner: Cl.bool(true),
}),);
const owed = simnet.callReadOnlyFn(
contractName,
"get-balance",
[Cl.standardPrincipal(wallet1)],
wallet1,
);
expect(owed.result).toBeUint(wager * 2n);
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