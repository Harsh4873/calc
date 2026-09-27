# Calc

A fast, private math solver at **[harsh.bet/calc](https://harsh.bet/calc/)**. Type a problem,
press Enter, and get an answer with step-by-step working rendered in clean math notation.

Everything runs locally in your browser — no accounts, no uploads, nothing leaves your device.

## What it solves

- **Arithmetic** — `2+2*3` → `8`
- **Simplify** — `simplify (x^2 + 2x + 1)` → `(x+1)^2`
- **Expand** — `expand (x+1)^3`
- **Factor** — `factor x^2 - 9` → `(x-3)(x+3)`
- **Equations** — `solve x^2 - 5x + 6 = 0` → `x=2, x=3`
- **Derivatives** — `d/dx x^3` or `derivative of x^3` → `3x^2`
- **Integrals** — `integrate x^2` → `x^3/3 + C`

Problem type is detected automatically from the input. Unsupported input returns a clear
message rather than hanging.

## Local solvers

- **[math.js](https://mathjs.org/)** — arithmetic evaluation and numeric formatting.
- **[nerdamer](https://nerdamer.com/)** (with the Algebra, Calculus, and Solve add-ons) —
  simplify, expand, factor, equation solving, differentiation, and integration.
- **[KaTeX](https://katex.org/)** — math typesetting of answers and steps.

The solver pipeline lives in [`src/solver/`](src/solver): `parse.ts` detects the problem type
and normalizes loose syntax (implicit multiplication, unicode operators), and `solve.ts`
dispatches to the right engine and returns
`{ answerLatex, answerText, steps, error? }`.

## Develop

```bash
npm install
npm run dev        # start Vite dev server
npm test           # run the solver unit tests (vitest)
npm run typecheck  # tsc --noEmit
npm run build      # tsc --noEmit && vite build → dist/
npm run preview    # preview the production build
```

## Deploy

Pushing to `main` triggers `.github/workflows/deploy-pages.yml`, which installs, tests,
typechecks, builds with `base: '/calc/'`, validates the artifact, and publishes to GitHub
Pages at `https://harsh.bet/calc/`.
