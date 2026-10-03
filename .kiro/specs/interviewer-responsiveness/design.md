# Design — interviewer-responsiveness

## Overview

The core change is replacing three disconnected Gemini calls
(transcribe → evaluate → generate-question) with a two-stage pipeline:

1. **Evaluate** — score the answer, detect candidate intent, produce written feedback.
2. **Generate interviewer turn** — produce one coherent interviewer message (acknowledgement + next move) using the full session context.

The second stage subsumes the current `generateQuestionWithGemini` for all non-session-start
paths and adds the acknowledgement sentence and intent routing that are missing today.

---

## 1. New Gemini function: `generateInterviewerTurnWithGemini`

This replaces the calls to `generateQuestionWithGemini` inside `submit-answer`.
`generateQuestionWithGemini` is kept as-is for the session-start path (first question,
no prior answer to acknowledge).

### Input
```ts
interface InterviewerTurnInput {
  track: TrackType;
  difficulty: DifficultyType;
  companyPreset?: string;
  jobDescription?: string;
  resumeSkills?: string[];
  resumeExperience?: string;
  sessionHistory: {
    questionText: string;
    answerText: string;
    technicalScore: number;
    communicationScore: number;
    aiFeedback: string;
  }[];                        // all answered Q/A pairs, in order
  previousQuestionTexts: string[];  // dedupe guard — all questions asked so far
  candidateIntent: CandidateIntent; // detected by evaluateAnswerWithGemini
  remainingQuestionBudget: number;  // how many more questions (including this turn) are allowed
}

type CandidateIntent =
  | 'answered'        // normal answer, adequate or weak
  | 'dont_know'       // candidate said they don't know / gave up
  | 'off_topic'       // answer is unrelated to the question
  | 'clarifying';     // candidate asked the interviewer a question
```

### Output (Gemini JSON schema)
```ts
interface InterviewerTurnOutput {
  acknowledgement: string;   // 1-2 sentences reacting to the last answer
  nextMove: InterviewerNextMove;
  questionText?: string;     // populated for 'ask_question' and 'ask_followup'
  questionType?: 'technical' | 'behavioral' | 'situational' | 'system_design';
  hintText?: string;         // populated for 'give_hint'
  clarificationText?: string; // populated for 'answer_clarification'
  isFollowup: boolean;
  consumesQuestionSlot: boolean; // false for hint/redirect/clarification turns
}

type InterviewerNextMove =
  | 'ask_question'        // new main question
  | 'ask_followup'        // probing follow-up on the same topic
  | 'give_hint'           // candidate said "I don't know"
  | 'redirect'            // answer was off-topic
  | 'answer_clarification'; // candidate asked for clarification
```

### Prompt structure

```
You are a senior technical interviewer conducting a mock interview.
Track: {track} | Difficulty: {difficulty}
{companyPreset line if set}
{jobDescription line if set}
{resumeSkills / resumeExperience if available}

Remaining question budget: {remainingQuestionBudget}
(You have {remainingQuestionBudget} question slot(s) left, including this turn.
 If budget is 1 or less, do not ask a new main question — wrap up with feedback.)

QUESTIONS ALREADY ASKED (do not repeat any of these):
{previousQuestionTexts as numbered list}

SESSION HISTORY (chronological):
{for each entry: Q: … / Candidate: … / Scores: tech={} comm={} / Feedback: …}

CANDIDATE'S MOST RECENT ANSWER:
Detected intent: {candidateIntent}

<<<UNTRUSTED_CANDIDATE_SUBMISSION_START>>>
{last answer text}
<<<UNTRUSTED_CANDIDATE_SUBMISSION_END>>>

Based on the above, produce your next interviewer turn following these rules:
- If intent is 'answered' and the answer was shallow/incorrect: nextMove = 'ask_followup'
- If intent is 'answered' and the answer was adequate: nextMove = 'ask_question'
- If intent is 'dont_know': nextMove = 'give_hint'; consumesQuestionSlot = false
- If intent is 'off_topic': nextMove = 'redirect'; consumesQuestionSlot = false
- If intent is 'clarifying': nextMove = 'answer_clarification'; consumesQuestionSlot = false
- Never repeat a question from the QUESTIONS ALREADY ASKED list.
- acknowledgement must reference something specific from the candidate's last answer.
```

---

## 2. Updated `evaluateAnswerWithGemini` signature

Add `candidateIntent` detection to the existing evaluation call so that
`generateInterviewerTurnWithGemini` can route correctly. No change to the
scores or `aiFeedback` fields.

```ts
// New output field added:
candidateIntent: CandidateIntent;
// 'shouldAskFollowup' is kept for backward compatibility but is no longer
// used for routing inside submit-answer.
```

The evaluation prompt gets one additional schema field and a detection instruction:

```
Also classify the candidate's intent as one of:
- 'answered'   — gave a substantive attempt
- 'dont_know'  — explicitly said they don't know, have no idea, or gave up
- 'off_topic'  — the response does not address the question
- 'clarifying' — the response is a question directed back at the interviewer
```

---

## 3. Updated `submit-answer` pipeline (server.ts)

```
POST /api/sessions/:id/submit-answer

1. Guard: if GEMINI_API_KEY missing → 503 immediately (no fallback).

2. Transcription (audio path):
   - Call transcribeAudioWithGemini.
   - On failure: return 422 { error: 'transcription_failed', retryable: true }.
   - Do NOT fall back to a placeholder string.
   - If textAnswer is also present, use textAnswer only and note in response
     that transcription failed.

3. Gibberish check (unchanged).

4. Evaluate:
   - Call evaluateAnswerWithGemini with full history + resume context.
   - On failure after retry: return 503 { error: '...', retryable: true }.
   - Store scores and feedback in the answer record.

5. Determine remaining budget:
   answeredCount = questions with answers (after saving this answer)
   remainingBudget = totalQuestionsCount - answeredCount

6. If remainingBudget <= 0:
   - Generate final report (unchanged).
   - Mark session completed.
   - Return { answer, evaluation, isSessionCompleted: true, session }.

7. Else:
   - Call generateInterviewerTurnWithGemini(...) with full context.
   - On failure after retry: return 503 { error: '...', retryable: true }.
   - If turn.consumesQuestionSlot:
       store.addQuestion(sessionId, turn.questionText, turn.questionType,
                         nextOrderIndex, turn.isFollowup)
   - Build interviewerMessage = turn.acknowledgement + '\n\n' + (turn.questionText
     || turn.hintText || turn.clarificationText)
   - Return:
     {
       answer,
       evaluation,
       nextQuestion,            // null if slot not consumed
       interviewerTurn: turn,   // full turn object
       interviewerMessage,      // composed string for TTS + display
       isSessionCompleted: false,
       session,
     }

8. Fix field name: destructure `proctoringReport` (not `proctoring`) from req.body,
   matching what InterviewRoomPage.tsx sends.
```

---

## 4. Front-end changes (InterviewRoomPage.tsx)

### 4a. Display the interviewer turn

Add a new `interviewerMessage` state string. After a successful submission:

```ts
if (data.interviewerTurn) {
  setInterviewerMessage(data.interviewerMessage);
  // speak the full message (acknowledgement + question) via TTS
  if (autoReadQuestion) speakQuestion(data.interviewerMessage);
}
```

Render the `interviewerMessage` in the side panel above the question text, styled
as an AI speech bubble (different visual treatment from the plain question text).

### 4b. Error preservation on failed submission

When the server returns 4xx/5xx:
- Do **not** clear `textAnswer` or `recordedAudioBase64`/`audioBlobUrl`.
- Show the error with a "Retry" button that re-submits the same payload.
- If `retryable: true` is in the error body, surface the retry affordance
  automatically.

### 4c. Transcription failure UX

If the server returns `{ error: 'transcription_failed', retryable: true }`:
- Show: "Audio transcription failed. Your recording is still saved — click Retry,
  or type your answer below and submit."
- Keep the audio blob preview visible.
- Do not clear `textAnswer`.

---

## 5. `getAI()` — remove silent fallback

```ts
function getAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured. Set it in your environment.');
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey, ... });
  }
  return aiClient;
}
```

All callers already have try/catch; those catches must now propagate a proper error
response rather than returning a fallback value.

---

## 6. Model ID constants

Replace hardcoded strings with named constants at the top of `gemini.ts`:

```ts
const GEMINI_CHAT_MODEL    = 'gemini-1.5-flash-latest';   // or env override
const GEMINI_TRANSCRIPTION_MODEL = 'gemini-1.5-flash-latest'; // update when dedicated model confirmed
```

Expose these through the health endpoint.

---

## 7. `/api/health` enhancement

```ts
app.get('/api/health', async (req, res) => {
  const configured = !!process.env.GEMINI_API_KEY;
  let chatReachable = false;
  let transcribeReachable = false;

  if (configured && !healthCache.isStale()) {
    return res.json(healthCache.get());
  }

  if (configured) {
    try {
      await callGeminiWithRetry(() => getAI().models.generateContent({
        model: GEMINI_CHAT_MODEL,
        contents: 'ping',
        config: { maxOutputTokens: 1 },
      }), { timeoutMs: 5000, retries: 0 });
      chatReachable = true;
    } catch {}

    try {
      // reuse chat model until a dedicated transcription model is confirmed
      transcribeReachable = chatReachable;
    } catch {}
  }

  const result = {
    status: (configured && chatReachable) ? 'ok' : 'degraded',
    gemini: {
      configured,
      models: {
        chat: { id: GEMINI_CHAT_MODEL, reachable: chatReachable },
        transcription: { id: GEMINI_TRANSCRIPTION_MODEL, reachable: transcribeReachable },
      },
    },
    timestamp: new Date().toISOString(),
  };

  healthCache.set(result, 60_000);
  res.json(result);
});
```

---

## 8. Firestore transcript sync (dataService.ts)

No schema change needed. After the update, the AI turn appended by
`appendTranscriptTurn` should use `data.interviewerMessage` as the `text` field
instead of `data.nextQuestion.questionText`, so the transcript records the full
acknowledgement + question rather than just the bare question.

---

## 9. What is NOT changed

- Session start (`/api/sessions/start`) continues to call `generateQuestionWithGemini`
  for the first question. There is no prior answer to acknowledge.
- `generateFinalResultsAndPlanWithGemini` is unchanged.
- `parseResumeWithGemini` is unchanged.
- `generateWeeklyPracticeTipWithGemini` is unchanged.
- The gibberish detection logic and prompt-injection defences are kept and extended.
- The `store.ts` data model requires no changes; `InterviewQuestion.isFollowup` and
  `parentQuestionId` are sufficient.
- Rate limiters, auth middleware, and admin routes are unchanged.
- Netlify / Render deployment configs are unchanged.

---

## Sequence diagram — submit-answer (happy path, spoken answer)

```
Client                      server.ts                  gemini.ts
  |                              |                          |
  |-- POST /submit-answer ------>|                          |
  |   { audioBase64, textAnswer }|                          |
  |                              |-- transcribeAudio ------>|
  |                              |<-- transcriptText -------|
  |                              |                          |
  |                              |-- evaluateAnswer ------->|
  |                              |   (full history, resume) |
  |                              |<-- scores + intent ------|
  |                              |                          |
  |                              |-- generateInterviewerTurn>|
  |                              |   (full context, intent, |
  |                              |    remaining budget)     |
  |                              |<-- ack + next move ------|
  |                              |                          |
  |                              |-- store.addAnswer()      |
  |                              |-- store.addQuestion()    |
  |                              |   (if slot consumed)     |
  |                              |                          |
  |<-- { answer, evaluation, ----|                          |
  |      interviewerTurn,        |                          |
  |      interviewerMessage,     |                          |
  |      nextQuestion } ---------|                          |
```
