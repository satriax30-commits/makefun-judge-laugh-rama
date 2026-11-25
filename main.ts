// SPDX-License-Identifier: MIT
// Make the AI Judge Laugh
// Writes one original single-line office joke to /output/entry.txt.
// Node 22, stdlib only, deterministic, no network, no wall clock.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// The joke: a familiar office setup (out-of-office set to "unavailable")
// taken somewhere unexpected — the calendar books a meeting to discuss
// the unavailability itself. The payoff lands in the last two words.
const JOKE =
  "I set my out-of-office to 'unavailable', so my calendar scheduled a meeting to discuss why I'm unavailable.";

function fail(message: string): never {
  throw new Error(message);
}

function validate(joke: string): void {
  if (joke.length === 0) fail("joke is empty");
  if (joke.length > 200) fail(`joke is ${joke.length} characters, over the 200 limit`);
  if (joke.trim().length === 0) fail("joke is only whitespace");
  if (joke.includes("\n") || joke.includes("\r")) fail("joke must be a single line");
}

function main(): void {
  validate(JOKE);

  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  const outPath = join(outDir, "entry.txt");

  mkdirSync(outDir, { recursive: true });
  writeFileSync(outPath, JOKE, "utf8");

  // Read back and verify byte-for-byte what was written.
  const roundTrip = readFileSync(outPath, "utf8");
  if (roundTrip !== JOKE) fail("read-back mismatch: entry.txt differs from the joke");
  validate(roundTrip);

  console.log(`Wrote ${JOKE.length}-character entry to ${outPath}`);
}

main();
