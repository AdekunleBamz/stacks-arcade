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

;; read only functions
;;

;; private functions
;;
