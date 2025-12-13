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

(define-private (credit (player principal) (amount uint))
  (let ((current (default-to u0 (get amount (map-get? balances {player: player})))))
    (map-set balances {player: player} {amount: (+ current amount)})))

(define-private (draw-number)
  (mod (+ stacks-block-height stacks-block-time) (+ max-number u1)))

;; public functions
(define-public (play (wager uint) (guess uint))
  (let
    (
      (game-id (var-get next-game-id))
      (self (contract-principal))
      (at stacks-block-time)
    )
    (begin
      (asserts! (<= guess max-number) err-invalid-guess)
      (asserts! (>= wager min-bet) err-bet-low)
      (asserts! (<= wager max-bet) err-bet-high)
      (unwrap! (stx-transfer? wager tx-sender self) err-transfer)
      (let
        (
          (draw (draw-number))
          (winner (is-eq guess (draw-number)))
          (payout (if winner (* wager u2) u0))
        )
        (begin
          (map-set games {id: game-id}
            {
              id: game-id,
              player: tx-sender,
              wager: wager,
              guess: guess,
              draw: draw,
              winner: winner,
              at: at
            })
          (var-set next-game-id (+ game-id u1))
          (if winner (credit tx-sender (* wager u2)) true)
          (print {event: "play", id: game-id, player: tx-sender, guess: guess, draw: draw, winner: winner, payout: payout})
          (ok {draw: draw, winner: winner})))))))

(define-private (credit (player principal) (amount uint))
  (let ((current (default-to u0 (get amount (map-get? balances {player: player})))))
    (map-set balances {player: player} {amount: (+ current amount)})))

(define-private (draw-number)
  (mod (+ stacks-block-height stacks-block-time) (+ max-number u1)))

;; public functions
(define-public (play (guess uint) (wager uint))
  (let
    (
      (game-id (var-get next-game-id))
      (draw (draw-number))
      (self (contract-principal))
      (played-at stacks-block-time)
    )
    (begin
      (asserts! (<= guess max-number) err-invalid-guess)
      (asserts! (>= wager min-bet) err-bet-low)
      (asserts! (<= wager max-bet) err-bet-high)
      (unwrap! (stx-transfer? wager tx-sender self) err-transfer)
      (let
        (
          (winner (is-eq guess draw))
          (payout (if (is-eq guess draw) (* wager u2) u0))
        )
        (when (> payout u0)
          (credit tx-sender payout))
        (map-set games {id: game-id}
          {
            id: game-id,
            player: tx-sender,
            wager: wager,
            guess: guess,
            draw: draw,
            winner: winner,
            at: played-at
          })
        (var-set next-game-id (+ game-id u1))
        (print {event: "play", id: game-id, player: tx-sender, guess: guess, draw: draw, winner: winner, payout: payout})
        (ok {draw: draw, winner: winner})))))

(define-public (claim)
  (let ((amount (default-to u0 (get amount (map-get? balances {player: tx-sender})))))
    (asserts! (> amount u0) err-zero-claim)
    (let ((recipient tx-sender))
      (unwrap! (as-contract? ((with-stx amount)) (try! (stx-transfer? amount tx-sender recipient))) err-transfer)
      (map-set balances {player: tx-sender} {amount: u0})
      (print {event: "claim", player: recipient, amount: amount})
      (ok true))))

;; read-only functions
(define-read-only (get-next-game-id)
  (var-get next-game-id))

(define-read-only (get-game (game-id uint))
  (map-get? games {id: game-id}))

(define-read-only (get-balance (who principal))
  (default-to u0 (get amount (map-get? balances {player: who}))))

(define-read-only (get-version)
  contract-version)
