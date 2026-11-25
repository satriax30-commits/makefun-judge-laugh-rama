// SPDX-License-Identifier: MIT
// Make the AI Judge Laugh
// Writes one original single-line office joke to /output/entry.txt.
// Node 22, stdlib only, deterministic, no network, no wall clock.
//
// How the joke is built (setup / turn / payoff):
//   Setup — "I set my out-of-office to 'unavailable'": a routine office
//     action every worker recognises. The quoted word 'unavailable' is
//     doing double duty: it is both the literal status text and the
//     premise the rest of the sentence will take literally.
//   Turn — "so my calendar scheduled a meeting": the tool that is supposed
//     to protect the unavailability instead violates it. The calendar
//     behaves like a literal-minded colleague who treats the status as a
//     topic, not a boundary.
//   Payoff — "to discuss why I'm unavailable": the meeting's agenda is the
//     unavailability itself, which is exactly the thing the meeting
//     prevents. The joke loops back on its own premise, and the final two
//     words ("I'm unavailable") restate the setup as the punchline.
// Why each validation exists:
//   - empty / whitespace-only: an entry must say something.
//   - MAX_LENGTH: the bounty caps entries at 200 characters.
//   - single line: the entry is one joke, not a paragraph in disguise.
//   - no control characters: invisible bytes would make the visible text
//     and the stored bytes disagree, and could break downstream parsers.
//   - no trailing whitespace: trailing spaces are invisible padding that
//     would make the byte length lie about the visible length.
//   - read-back check in main(): proves the file on disk is byte-for-byte
//     the validated string, so a partial write can never pass silently.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// The joke: a familiar office setup (out-of-office set to "unavailable")
// taken somewhere unexpected — the calendar books a meeting to discuss
// the unavailability itself. The payoff lands in the last two words.
const JOKE =
  "I set my out-of-office to 'unavailable', so my calendar scheduled a meeting to discuss why I'm unavailable.";

// The bounty caps the entry at 200 characters; keep the limit as a named
// constant so the check and the error message can never drift apart.
const MAX_LENGTH = 200;

// A single-line entry must contain no control characters: they are
// invisible in a transcript, can break downstream parsers, and would
// let a "one line" entry smuggle in extra structure. Tab is included
// because a tab inside the line is still a formatting control, not
// printable joke text.
const CONTROL_CHAR_PATTERN = /[\u0000-\u001f\u007f]/;

// Aborts the run with a clear message. Typed as `never` so callers can
// use it inline in expressions (for example inside a ternary or after
// an `||`) and TypeScript knows execution cannot continue past it.
function fail(message: string): never {
  throw new Error(message);
}

function validate(joke: string): void {
  if (joke.length === 0) fail("joke is empty");
  if (joke.length > MAX_LENGTH) fail(`joke is ${joke.length} characters, over the ${MAX_LENGTH} limit`);
  if (joke.trim().length === 0) fail("joke is only whitespace");
  if (joke.includes("\n") || joke.includes("\r")) fail("joke must be a single line");
  if (CONTROL_CHAR_PATTERN.test(joke)) fail("joke contains a control character");
  if (joke !== joke.trimEnd()) fail("joke has trailing whitespace");
}

// Writes the validated joke to <outDir>/entry.txt and proves the write
// by reading the file back and comparing it byte-for-byte. Returns the
// full path of the entry file so the caller can report it. Keeping the
// write plus its verification in one helper means main() cannot write
// without verifying, and the verification cannot be skipped by accident.
function writeEntry(joke: string, outDir: string): string {
  const outPath = join(outDir, "entry.txt");

  mkdirSync(outDir, { recursive: true });
  writeFileSync(outPath, joke, "utf8");

  // Read back and verify byte-for-byte what was written.
  const roundTrip = readFileSync(outPath, "utf8");
  if (roundTrip !== joke) fail("read-back mismatch: entry.txt differs from the joke");
  validate(roundTrip);

  return outPath;
}

function main(): void {
  validate(JOKE);

  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  const outPath = writeEntry(JOKE, outDir);

  console.log(`Wrote ${JOKE.length}-character single-line entry to ${outPath} (verified byte-for-byte)`);
}

main();
