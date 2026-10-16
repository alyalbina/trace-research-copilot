import { makeSeed } from "../lib/seed";
import { evaluate } from "../lib/research";
const result = evaluate(makeSeed());
console.log(
  "TRACE synthetic reference-corpus consistency evaluation. Not an independent holdout or real-world AI benchmark.",
);
console.table(
  Object.fromEntries(
    Object.entries(result).map(([k, v]) => [
      k,
      {
        matching: v.n,
        total: v.d,
        percent: v.d ? Math.round((v.n / v.d) * 100) : "N/A",
      },
    ]),
  ),
);
if (
  result.citations.n !== result.citations.d ||
  result.exactness.n !== result.exactness.d
)
  process.exitCode = 1;
