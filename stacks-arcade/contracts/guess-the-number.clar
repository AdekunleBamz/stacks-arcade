;; title: guess-the-number
;; version: 0.0.1
;; summary: Single-player number guessing game with staked bets.
;; description: Player stakes STX, guesses a number, and wins 2x if they match the on-chain draw.

;; constants
(define-constant contract-version "0.0.1")
(define-constant min-bet u1000000) ;; 0.01 STX
(define-constant max-bet u100000000) ;; 1 STX
(define-constant max-number u9) ;; guesses between 0-9
(define-constant err-invalid-guess (err u400))
(define-constant err-bet-low (err u401))
(define-constant err-bet-high (err u402))
(define-constant err-transfer (err u403))
(define-constant err-zero-claim (err u404))

;; data vars
(define-data-var next-game-id uint u0)

;; data maps
;; game tuple: {id, player, wager, guess, draw, winner, at}
(define-map games
  {id: uint}
  {
    id: uint,
    player: principal,
    wager: uint,
    guess: uint,
    draw: uint,
    winner: bool,
    at: uint
  }
)

;; pending balances for withdrawals
(define-map balances {player: principal} {amount: uint})

;; private helpers
(define-private (contract-principal)
  (unwrap-panic (as-contract? () tx-sender)))
