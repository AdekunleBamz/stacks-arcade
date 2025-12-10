;; title: coin-flip
;; version: 0.0.1
;; summary: Single-player coin flip game with escrowed wager.
;; description: Player picks heads/tails, funds wager, flips on-chain, and claims payout if they win.

;; traits
;;

;; token definitions
;;

;; constants
;;
(define-constant contract-version "0.0.1")
(define-constant contract-admin none) ;; reserved for future controls
(define-constant min-bet u1000000) ;; 0.01 STX assuming microstacks
(define-constant max-bet u100000000) ;; 1 STX cap
(define-constant fee-bps u0) ;; no fee yet
(define-constant err-not-open (err u100))
(define-constant err-insufficient-bet (err u101))
(define-constant err-too-high-bet (err u102))
(define-constant err-invalid-pick (err u103))
(define-constant err-not-player (err u104))
(define-constant err-already-funded (err u105))
(define-constant err-not-funded (err u106))
(define-constant err-already-settled (err u107))
(define-constant err-transfer-failed (err u108))
(define-constant err-zero-claim (err u109))
(define-constant err-not-found (err u110))
(define-constant status-open u0)
(define-constant status-settled u1)
(define-constant status-canceled u2)

;; data vars
;;
(define-data-var next-game-id uint u0)

;; data maps
;;
;; game tuple shape: {player: principal, wager: uint, pick: uint, funded: bool, status: uint, result: (optional uint), winner: bool}
(define-map games
  ((id uint))
  (
    (player principal)
    (wager uint)
    (pick uint)
    (funded bool)
    (status uint)
    (result (optional uint))
    (winner bool)
  )
)
(define-map balances
  ((player principal))
  ((amount uint))
)

;; public functions
;;
(define-public (create-game (wager uint) (pick uint))
  (let
    (
      (game-id (var-get next-game-id))
    )
    (begin
      (asserts! (>= wager min-bet) err-insufficient-bet)
      (asserts! (<= wager max-bet) err-too-high-bet)
      (asserts! (or (is-eq pick u0) (is-eq pick u1)) err-invalid-pick)
      (let
        (
          (game {
            player: tx-sender,
            wager: wager,
            pick: pick,
            funded: false,
            status: status-open,
            result: none,
            winner: false
          })
        )
        (begin
          (map-set games {id: game-id} game)
          (var-set next-game-id (+ game-id u1))
          (ok game-id))))))
(define-public (fund-game (game-id uint))
  (match (map-get? games {id: game-id})
    game
    (begin
      (asserts! (is-open? (get status game)) err-not-open)
      (asserts! (is-eq tx-sender (get player game)) err-not-player)
      (asserts! (not (get funded game)) err-already-funded)
      (let
        (
          (contract-principal (as-contract tx-sender))
          (wager (get wager game))
        )
        (begin
          (unwrap! (stx-transfer? wager tx-sender contract-principal) err-transfer-failed)
          (map-set games {id: game-id} (merge game {funded: true}))
          (ok true))))
    err-not-found))

;; read only functions
;;
(define-read-only (get-next-game-id)
  (var-get next-game-id))
(define-read-only (get-game (game-id uint))
  (map-get? games {id: game-id}))
(define-read-only (get-balance (who principal))
  (default-to u0 (get amount (map-get? balances {player: who}))))
(define-read-only (is-funded (game-id uint))
  (match (map-get? games {id: game-id})
    game (get funded game)
    false))

;; private functions
;;
(define-private (is-open? (status uint))
  (is-eq status status-open))
(define-private (is-settled? (status uint))
  (is-eq status status-settled))
