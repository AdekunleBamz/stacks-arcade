;; Higher / Lower mini-game (stub)
;; Players start a game with an upper bound, then guess the hidden number.
;; TODO: add better randomness, scoring, and multi-player safety rules.

(define-constant ERR_GAME_NOT_STARTED u100)
(define-constant ERR_ALREADY_ACTIVE u101)
(define-constant ERR_OUT_OF_RANGE u102)

(define-data-var secret uint u0)
(define-data-var upper-bound uint u10)
(define-data-var game-active bool false)

(define-read-only (get-state)
  {
    active: (var-get game-active),
    upper-bound: (var-get upper-bound)
  })

(define-public (start-game (upper uint))
  (begin
    (if (var-get game-active)
        (err ERR_ALREADY_ACTIVE)
        (let (
              (safe-upper (if (> upper u1) upper u10))
              (seed (mod block-height safe-upper))
             )
          (var-set upper-bound safe-upper)
          (var-set secret seed)
          (var-set game-active true)
          (ok true)))))

(define-public (guess (value uint))
  (let (
        (active (var-get game-active))
        (max (var-get upper-bound))
        (target (var-get secret))
       )
    (if (not active)
        (err ERR_GAME_NOT_STARTED)
        (if (> value max)
            (err ERR_OUT_OF_RANGE)
            (if (= value target)
                (begin
                  (var-set game-active false)
                  (ok "win"))
                (if (< value target)
                    (ok "higher")
                    (ok "lower")))))))
