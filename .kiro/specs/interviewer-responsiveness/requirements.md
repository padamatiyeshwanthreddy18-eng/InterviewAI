# Requirements — interviewer-responsiveness

## Problem Statement

The AI interviewer does not react to what the candidate actually said. Every answer is
evaluated and scored, but the evaluations are never fed into the next interviewer turn.
`submit-answer` runs three disconnected Gemini calls (transcribe → evaluate → generate
next question); the evaluation result is stored but is never given to the question
generator. The result is a session that feels like a static quiz: the interviewer
ignores every answer and just reads out the next item on a fixed list.

Verified root causes (all confirmed in the code):

1. **No acknowledgement turn.** `generateQuestionWithGemini` never produces a reaction
   sentence. The history array it receives contains previous Q/A pairs but the prompt
   instruction for non-follow-up questions is "Generate a realistic, high-signal
   interview question…" — no mention of acknowledging or building on the last answer.

2. **Follow-up logic is broken in three ways.**
   - `evaluateAnswerWithGemini` sees only the current question and answer — no history,
     no resume, no job description. Its prompt gives no criteria for when a follow-up
     is warranted.
   - The follow-up call passes `undefined` for `parsedSkills` and `parsedExperience`
     (server.ts line ~430).
   - A hard guard `!currentQuestion.isFollowup` caps follow-ups at one per question;
     a second shallow answer on a follow-up always moves forward.

3. **No special handling for "I don't know", off-topic, or clarifying answers.** All
   four candidate intents (weak answer, "I don't know", off-topic, clarifying question)
   route to the same code path.

4. **Silent fallbacks hide API failures.**
   - `getAI()` creates a client with `'dummy-key-for-fallback'` when
     `GEMINI_API_KEY` is absent; the client initialises without error but all model
     calls will fail at runtime.
   - `generateQuestionWithGemini` falls back to hardcoded per-track lists on any
     exception.
   - `evaluateAnswerWithGemini` falls back to a word-count heuristic.
   - `transcribeAudioWithGemini` returns `'Audio recording received and transcribed.'`
     on failure; that fake string passes the gibberish check and is stored and scored
     as a real answer.

5. **Front-end field name mismatch.** `InterviewRoomPage.tsx` sends the field as
   `proctoringReport`; `server.ts submit-answer` destructures `proctoring`. The
   proctoring data is silently dropped on every answer submission.

6. **No health endpoint for Gemini.** `GET /api/health` returns `{ status: 'ok' }` with
   no information about whether the AI backend is configured or reachable.

7. **Unverified model IDs.** `'gemini-3.8-flash'` and `'gemini-3.5-transcribe'` are
   hardcoded strings. Neither is a real public model name at time of writing. The code
   has never verified they actually respond.

---

## Requirements (EARS format)

### R1 — Acknowledgement + next question in one interviewer turn
**When** a candidate submits an answer (typed or spoken),  
**the system shall** return a single `interviewerTurn` object that contains:  
(a) a one-to-two sentence acknowledgement that references something specific from the
    candidate's answer (a claim they made, a term they used, a gap they left), and  
(b) the next question or follow-up that follows naturally from that acknowledgement.

The acknowledgement and the next question shall be delivered as a single, coherent
interviewer message — not two separate fields rendered independently.

### R2 — Full context passed to every interviewer-turn generation
**When** the server generates any interviewer turn (first question, main question,
follow-up, hint, redirect, or clarification),  
**the system shall** supply to the Gemini call:
- the full ordered session history (all previous questions, the candidate's verbatim
  answer text, and the evaluation scores and feedback for each answered question),
- resume `parsedSkills` and `parsedExperience` (when a resume exists for the user),
- `jobDescription`, `companyPreset`, `track`, and `difficulty`,
- the remaining question budget (questions remaining before session end).

### R3 — Follow-up bounded only by the session's total question count
**While** a candidate's answer is vague, technically incorrect, or shallow,  
**the system shall** be able to generate a probing follow-up question.  
The only bound on the number of consecutive follow-ups shall be the session's
`totalQuestionsCount`; the hard one-follow-up-per-question cap shall be removed.

The decision to follow up shall be made by the same single Gemini call that generates
the acknowledgement and next question (R1), not by the separate `evaluateAnswerWithGemini`
call. `evaluateAnswerWithGemini` shall continue to produce scores and written feedback
but shall not be the source of the `shouldAskFollowup` routing decision.

### R4 — Intent-aware interviewer responses
**When** a candidate's answer matches one of the following intents,  
**the system shall** respond accordingly instead of generating a new main question:
- **"I don't know"** — the interviewer shall give a brief hint or a simplified version
  of the question and keep the question budget unchanged.
- **Off-topic answer** — the interviewer shall acknowledge and redirect to the original
  question without spending a question slot.
- **Clarifying question** — the interviewer shall answer the candidate's clarification
  and re-present the current question without spending a question slot.

### R5 — No repeated questions
**When** generating any question,  
**the system shall** not produce a question whose text is substantively the same as any
question already asked in the current session.  
The full list of previously asked question texts shall be included in the prompt context
sent to Gemini (already partially done; this requires confirming it applies to all
code paths including follow-ups and session-start).

### R6 — Hard failure on missing or failed Gemini, with answer preservation
**If** `GEMINI_API_KEY` is absent or a Gemini call fails after one retry,  
**the system shall**:
- return an HTTP 503 response with a user-readable `error` field,
- include a `retryable: true` flag so the client can offer a retry button,
- **not** substitute canned questions, heuristic scores, or fake transcripts.

The front end shall preserve the candidate's typed text and the recorded audio blob URL
across a failed submission so the candidate can retry without re-recording.

### R7 — Transcription failure is an explicit, recoverable error
**If** audio transcription fails or returns empty after retry,  
**the system shall** return HTTP 422 with `{ error: "transcription_failed", retryable: true }`.  
**The system shall not** evaluate or store a failed or placeholder transcription as the
candidate's answer.

Typed text submitted alongside audio shall be unaffected; if `textAnswer` is present
and transcription fails the system shall evaluate the typed text only and record that
transcription was unavailable.

### R8 — Typed and spoken answers share a single server code path
**When** a candidate submits either a typed answer or a spoken (transcribed) answer,  
**the system shall** route both through the same evaluation and interviewer-turn
generation logic.  
There shall be no conditional branching that applies different scoring, context
assembly, or response generation based solely on whether the answer originated from
audio or text.

### R9 — Prompt-injection defences and gibberish detection preserved
**When** evaluating or using any candidate-supplied text,  
**the system shall** wrap it in explicit untrusted-data delimiters in every Gemini
prompt (the `<<<UNTRUSTED_CANDIDATE_SUBMISSION_START/END>>>` pattern already present in
`evaluateAnswerWithGemini` shall be extended to every call that embeds candidate text).  
Gibberish detection shall continue to short-circuit evaluation and generate a request
for a real answer.

### R10 — /api/health reports Gemini configuration and model reachability
**When** `GET /api/health` is called,  
**the system shall** return:
```json
{
  "status": "ok" | "degraded",
  "gemini": {
    "configured": true | false,
    "models": {
      "chat": { "id": "<model-id>", "reachable": true | false },
      "transcription": { "id": "<model-id>", "reachable": true | false }
    }
  },
  "timestamp": "<ISO-8601>"
}
```
The `reachable` check shall be a lightweight probe (e.g. a minimal `generateContent`
call or a `models.get` call); it shall time out within 5 seconds and shall not be
triggered on every health poll in production (cache the result for at least 60 seconds).
