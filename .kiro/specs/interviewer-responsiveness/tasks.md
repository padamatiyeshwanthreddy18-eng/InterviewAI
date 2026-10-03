# Tasks — interviewer-responsiveness

## Task 1 — Fix `getAI()` and model ID constants

**File:** `src/services/gemini.ts`

- [ ] Add two named constants near the top of the file:
  ```ts
  export const GEMINI_CHAT_MODEL          = process.env.GEMINI_CHAT_MODEL          || 'gemini-1.5-flash-latest';
  export const GEMINI_TRANSCRIPTION_MODEL = process.env.GEMINI_TRANSCRIPTION_MODEL || 'gemini-1.5-flash-latest';
  ```
- [ ] Rewrite `getAI()` to throw `Error('GEMINI_API_KEY is not configured…')` when
  the env var is absent instead of creating a client with `'dummy-key-for-fallback'`.
- [ ] Replace the hardcoded model ID strings `'gemini-3.8-flash'` and
  `'gemini-3.5-transcribe'` everywhere in the file with the two constants.

**Acceptance:** TypeScript compiles. Running the server without `GEMINI_API_KEY` set
logs a clear startup warning (already present) and any AI call returns an error
instead of silently using a dummy client.

---

## Task 2 — Fix `transcribeAudioWithGemini` to propagate failures

**File:** `src/services/gemini.ts`

- [ ] Remove the catch-block fallback that returns `'Audio recording received and
  transcribed.'`.
- [ ] Change the function signature to return `Promise<string | null>` (null = failure).
- [ ] On any exception, `console.error` and return `null`.
- [ ] If the Gemini response text is empty or `undefined`, return `null`.

**Acceptance:** A failed transcription returns `null`. The caller in `submit-answer`
is responsible for the error response (done in Task 4).

---

## Task 3 — Add `candidateIntent` detection to `evaluateAnswerWithGemini`

**File:** `src/services/gemini.ts`

- [ ] Add `CandidateIntent` type:
  ```ts
  export type CandidateIntent = 'answered' | 'dont_know' | 'off_topic' | 'clarifying';
  ```
- [ ] Add `candidateIntent: CandidateIntent` to the function's return type.
- [ ] Extend the Gemini JSON schema with a `candidateIntent` string field (enum:
  `['answered','dont_know','off_topic','clarifying']`).
- [ ] Add the intent detection instruction to the evaluation prompt (see design §2).
- [ ] Add `candidateIntent` to the local fallback `evaluateLocalFallback` return
  (always `'answered'` in the fallback — but per R6 the fallback should no longer
  be reached; add it for type safety only).
- [ ] Update `shouldAskFollowup` logic: keep the field in the return type for
  backward compatibility, but it is no longer used for routing in `submit-answer`.

**Acceptance:** TypeScript compiles with the new return type. A test call with "I
have no idea how to answer this" returns `candidateIntent: 'dont_know'`.

---

## Task 4 — Implement `generateInterviewerTurnWithGemini`

**File:** `src/services/gemini.ts`

- [ ] Add the `InterviewerTurnInput` and `InterviewerTurnOutput` types from design §1.
- [ ] Implement `generateInterviewerTurnWithGemini(input: InterviewerTurnInput): Promise<InterviewerTurnOutput>`.
  - Build the prompt as described in design §1, wrapping candidate text in
    `<<<UNTRUSTED_CANDIDATE_SUBMISSION_START/END>>>` delimiters.
  - Use `callGeminiWithRetry` with `timeoutMs: 20000, retries: 1`.
  - Use `GEMINI_CHAT_MODEL`.
  - Parse the JSON response and return a typed `InterviewerTurnOutput`.
- [ ] **No fallback.** If the call throws, re-throw — the caller handles the 503.
- [ ] Export the function.

**Acceptance:** TypeScript compiles. A manual integration test (with a real API key)
returns an object with non-empty `acknowledgement` and `nextMove`.

---

## Task 5 — Rewrite `submit-answer` in server.ts

**File:** `server.ts`

- [ ] **Fix field name bug:** change `const { ..., proctoring } = req.body` to
  `const { ..., proctoringReport } = req.body` and use `proctoringReport` in the
  subsequent `store.updateSession` call.
- [ ] **Guard missing API key up front:** if `!process.env.GEMINI_API_KEY`, return
  `503 { error: 'AI service is not configured. Set GEMINI_API_KEY.', retryable: true }`.
- [ ] **Transcription:** call `transcribeAudioWithGemini` and check for `null`.
  - If `null` and no `textAnswer`: return `422 { error: 'transcription_failed', retryable: true }`.
  - If `null` but `textAnswer` present: proceed with typed text only; add
    `transcriptionAvailable: false` to the response.
- [ ] **Evaluation:** call updated `evaluateAnswerWithGemini` (now receives
  `sessionHistory`, `resumeSkills`, `resumeExperience`). On exception after retry:
  return `503 { error: 'Evaluation service unavailable.', retryable: true }`.
- [ ] **Compute remaining budget** after saving the answer:
  `remainingBudget = totalQuestionsCount - answeredCount`.
- [ ] **Session completion branch** (budget ≤ 0): unchanged except using new evaluation
  return type.
- [ ] **Interviewer turn branch** (budget > 0):
  - Build `InterviewerTurnInput` with full history + resume + intent.
  - Call `generateInterviewerTurnWithGemini`. On exception: return `503`.
  - If `turn.consumesQuestionSlot`, call `store.addQuestion(...)` (follow-up or main).
  - Compose `interviewerMessage = turn.acknowledgement + '\n\n' + (turn.questionText ?? turn.hintText ?? turn.clarificationText ?? '')`.
  - Return `{ answer, evaluation, nextQuestion, interviewerTurn: turn, interviewerMessage, isSessionCompleted: false, session }`.
- [ ] **Remove follow-up guard** `&& !currentQuestion.isFollowup`.
- [ ] **Remove the two separate `generateQuestionWithGemini` calls** inside
  `submit-answer` (they are replaced by `generateInterviewerTurnWithGemini`).

**Acceptance:** TypeScript compiles. Submitting a typed answer returns a response
with a non-empty `interviewerMessage`. Submitting without `GEMINI_API_KEY` returns
503. Submitting broken audio with `textAnswer` present still succeeds.

---

## Task 6 — Update `evaluateAnswerWithGemini` call sites

**File:** `server.ts`

`evaluateAnswerWithGemini` now needs more context. Update its signature and all callers.

- [ ] Add parameters to `evaluateAnswerWithGemini`:
  ```ts
  sessionHistory: { questionText: string; answerText: string }[],
  resumeSkills?: string[],
  resumeExperience?: string,
  ```
- [ ] Update the evaluation prompt to include these when present.
- [ ] In `server.ts submit-answer`, pass the session history built from
  `updatedSession.questions` and the resume fetched by `store.getResumeByUserId`.

**Acceptance:** TypeScript compiles. The evaluation prompt in a session with prior
answers now includes that history.

---

## Task 7 — Update `/api/health` endpoint

**Files:** `server.ts`, `src/services/gemini.ts`

- [ ] Export `GEMINI_CHAT_MODEL` and `GEMINI_TRANSCRIPTION_MODEL` from `gemini.ts`
  (already exported in Task 1).
- [ ] In `server.ts`, import them.
- [ ] Add a module-level health cache:
  ```ts
  let healthCacheResult: object | null = null;
  let healthCacheExpiry = 0;
  ```
- [ ] Rewrite `GET /api/health` as an `async` handler per design §7.
  - Probe with `timeoutMs: 5000, retries: 0`.
  - Cache result for 60 seconds.
  - Return the structure from design §7.
- [ ] Make the route handler non-blocking for the common case (cache hit returns
  synchronously).

**Acceptance:** `GET /api/health` with a valid key returns `status: 'ok'` and
`gemini.configured: true`. Without a key it returns `status: 'degraded'` and
`gemini.configured: false`.

---

## Task 8 — Front-end: display the interviewer turn and preserve answers on error

**File:** `src/pages/InterviewRoomPage.tsx`

- [ ] Add state:
  ```ts
  const [interviewerMessage, setInterviewerMessage] = useState<string | null>(null);
  ```
- [ ] In `handleSubmitAnswer` success path:
  - Set `setInterviewerMessage(data.interviewerMessage ?? null)`.
  - If `autoReadQuestion` and `data.interviewerMessage`, call
    `speakQuestion(data.interviewerMessage)` instead of reading only the question.
  - Clear `interviewerMessage` when a new question is loaded.
- [ ] In `handleSubmitAnswer` error path:
  - Do NOT clear `textAnswer`, `recordedAudioBase64`, or `audioBlobUrl`.
  - If `errData.retryable` is true, set an error message that includes a "Retry"
    affordance (a button that calls `handleSubmitAnswer` again).
  - If `errData.error === 'transcription_failed'`, set a specific message:
    "Audio transcription failed — your recording is still saved. Retry, or type
    your answer below."
- [ ] Render `interviewerMessage` in the side panel:
  - Show it above the question text, inside a visually distinct "AI interviewer"
    speech bubble (dark background, Bot icon, italic text).
  - Only render it when non-null.
  - Clear it when `currentQuestion` changes.
- [ ] Fix the field name sent to the server: change `proctoringReport` key in the
  `fetch` body to match whatever key `server.ts` now reads (should be
  `proctoringReport` after Task 5 fix — confirm they match).

**Acceptance:** After submitting an answer, the side panel shows the interviewer's
acknowledgement sentence followed by the next question. On a 503 error the typed text
and audio recording are still visible and a retry button is present.

---

## Task 9 — Firestore transcript sync: use `interviewerMessage`

**File:** `src/pages/InterviewRoomPage.tsx`

- [ ] In the `appendTranscriptTurn` call for the AI speaker turn, change:
  ```ts
  text: data.nextQuestion.questionText,
  ```
  to:
  ```ts
  text: data.interviewerMessage ?? data.nextQuestion?.questionText ?? '',
  ```
  so the Firestore transcript records the full acknowledgement + question.

**Acceptance:** A completed session's Firestore transcript subcollection contains AI
turns with the full interviewer message, not just the bare question text.

---

## Task 10 — End-to-end smoke test

**Manual verification steps (no automated test framework required):**

- [ ] Start the server with a valid `GEMINI_API_KEY`.
- [ ] `GET /api/health` → `status: 'ok'`, `gemini.configured: true`, both models show
  `reachable: true`.
- [ ] Start a session, submit a shallow one-sentence answer → confirm `interviewerMessage`
  in the response contains a specific reference to something in the answer and a
  follow-up question (not a new main question).
- [ ] Submit "I don't know" → confirm `interviewerMessage` contains a hint and
  `nextQuestion` is null (slot not consumed).
- [ ] Submit a full, correct answer → confirm `interviewerMessage` contains an
  acknowledgement and a new main question.
- [ ] Submit with `GEMINI_API_KEY` unset → confirm 503 with `retryable: true`.
- [ ] Submit audio that the server cannot transcribe (simulate by killing the API key
  mid-request) → confirm 422 `transcription_failed`.
- [ ] Submit with audio + typed text when transcription fails → confirm typed text is
  evaluated and `transcriptionAvailable: false` is in the response.
- [ ] Check that a previously asked question is never repeated across 5 questions in one
  session.
- [ ] Confirm `proctoring` data appears in the session after a submission
  (the field name bug is fixed).
- [ ] Start the server **without** `GEMINI_API_KEY` → confirm startup warning appears
  and the first AI call returns 503, not a canned question.
