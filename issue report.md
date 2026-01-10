# Issue Report: Retell Interview Generation → Groq Questions → Firebase Storage

## 1) Goal / Expected Behavior

You want an end-to-end flow where:

- A **Retell “Interview Generator” agent** runs a voice call.
- During the call, it asks the user for **5 values**:
  - `role`
  - `level`
  - `type`
  - `techstack`
  - `amount`
- Retell performs **Post-Call Data Extraction** and places those values into the call’s analysis payload.
- Your Next.js backend receives Retell’s **webhook event**.
- The backend uses those 5 values to call **Groq** to generate interview questions.
- The backend stores the generated questions in **Firebase (Firestore)** under `interviews`.
- Later, a second Retell agent (“Interviewer”) receives the stored questions and asks them to candidates.

## 2) Current Observed Symptoms

From screenshots and logs, the major symptom is:

- Interviews are being created in Firestore, but the **generated questions are not the real Groq output**.
- Instead, the system frequently falls back to **default questions**, indicating that the AI response could not be parsed into a JSON array.

Console/log error sequence observed:

- `Error using generateObject, falling back to manual parsing: Error: Model does not have a default object generation mode.`
- `Direct parsing failed, trying extraction...`
- `Could not parse questions as JSON, falling back to text split`
- `All parsing failed, returning default questions`

These messages originate in:

- `lib/actions/interview.action.ts` (see section 4.2)

## 3) Evidence Collected

### 3.1 Vercel logs (`logs_result (2).json`)

This file contains production logs for:

- `ai-mock-interview-roan-phi.vercel.app/api/retell/webhook`

Key findings from those logs:

- Webhook is triggered for both `call_ended` and `call_analyzed`.
- Some payloads show:
  - `Extracted analysis: undefined`
  - and therefore your backend uses defaults:
    - `role: Software Engineer`
    - `level: junior`
    - `type: technical`
    - `techstack: JavaScript`
    - `amount: 5`

In at least one `Full body:` payload, `call_analysis` was present and included:

- `call_analysis.custom_analysis_data: {}` (empty object)

This indicates that your backend sometimes receives analysis but **not the extracted fields** (or they are empty / not in the expected shape).

### 3.2 Retell “Interview Generator” agent (dashboard screenshots)

Your screenshot shows Retell *does* extract values correctly for the generator agent call:

- `amount = 10`
- `role = DevOps engineer`
- `type = mixed`
- `level = junior`
- `techstack = Docker`

So: **Retell extraction is working inside Retell** for that generator call.

### 3.3 Retell Detail logs (`public.log` paste)

The pasted lines show:

- Webhook triggered for `call_ended`
- Webhook triggered for `call_analyzed`
- Webhook responses received for both events

This confirms the webhook is invoked twice per call lifecycle.

### 3.4 Local dev browser console screenshot

Local UI shows Retell call start/end in the browser console. However:

- Groq generation happens in the **server webhook**, not in the browser.
- Your webhook URL was set to Vercel, so Groq logs appear on Vercel, not in local terminal.

## 4) Code Areas Involved (with File + Line Ranges)

### 4.1 Retell webhook handler (root cause area)

**File:** `app/api/retell/webhook/route.ts`

- **Lines 11–61**: Webhook processes both events:
  - `call_ended` OR `call_analyzed`
- **Lines 12–14**: Extracts:
  - `analysis = body.call?.call_analysis?.custom_analysis_data`
  - `metadata = body.call?.metadata`
- **Lines 21–32**: If `metadata.userId` exists, it reads the 5 values, but uses defaults if `analysis` is missing:
  - `role = analysis?.role || "Software Engineer"`
  - `level = analysis?.level || "junior"`
  - `type = analysis?.type || "technical"`
  - `techstackRaw = analysis?.techstack || "JavaScript"`
  - `amount = parseInt(analysis?.amount) || 5`
- **Lines 35–41**: Calls `generateInterviewQuestions` with those values.
- **Lines 45–55**: Stores interview doc into `db.collection("interviews")`.

#### Why this matters

- Retell commonly sends **analysis only on `call_analyzed`**.
- `call_ended` may not have `call_analysis` at all.
- Because your handler runs on both events, **it will sometimes run with `analysis = undefined`**.

Additionally, your production logs show webhook activity where:

- `metadata.type` was sometimes `"interview"` (interview-taking calls)
- yet the webhook still created an interview

This means your webhook can create interviews **during interview sessions**, not only generation sessions.

### 4.2 Groq question generation + parsing

**File:** `lib/actions/interview.action.ts`

- **Lines 16–35**: First attempt uses `generateObject`:
  - Model: `groq("llama-3.3-70b-versatile")`
  - Schema: `{ questions: z.array(z.string()) ... }`
  - Observed error: `Model does not have a default object generation mode.`

- **Lines 39–50**: Fallback uses `generateText` with prompt requiring a JSON array.

- **Lines 52–58**: Logs and cleans the output.
  - Important: `console.log("Raw AI response:", questions);`
  - In production, Vercel logs showed only `Raw AI response:` (missing the response text).

- **Lines 60–70**: Attempts `JSON.parse(cleanedQuestions)`.
- **Lines 71–83**: If parse fails, tries regex extraction `\[[\s\S]*?\]` and parses again.
- **Lines 85–97**: If still fails, falls back to line splitting:
  - `split('\n')`
  - filter requires either a `?` or `^\d+\.`

- **Lines 103–110**: Final default questions returned.

#### Why this matters

Even if Groq returns valid questions, any of these can break parsing:

- Model returns non-JSON text (extra explanation, markdown)
- Model returns list formats like `1)` instead of `1.`
- Model returns bullet list `- question` without `?`

But currently we could not verify Groq output from Vercel logs due to logging format.

### 4.3 Retell call creation endpoint

**File:** `app/api/retell/create-call/route.ts`

- **Lines 7–17**: Chooses which agent to use.
- **Lines 45–55**: Sends metadata to Retell:
  - `metadata.type` becomes `"interview"` or `"generate"`
  - includes `userId`, `interviewId`
- **Lines 25–33**: When interview session, sets dynamic variables including `questions`.

This is the correct mechanism for “how questions reach the interviewer agent”:

- The interview page (`app/(root)/interview/[id]/page.tsx`, lines **31–38**) passes:
  - `type="interview"`
  - `questions={interview.questions}`
  - `interview={interview}`

Then `AgentRetell` calls `/api/retell/create-call` which passes questions to Retell as dynamic variables.

## 5) Root Causes (What is actually broken)

### Root cause A: Webhook runs on both `call_ended` and `call_analyzed`

Because of:

- `app/api/retell/webhook/route.ts` line **11**

The webhook frequently runs at a time when:

- `call_analysis` is missing or incomplete

This leads to:

- `analysis` being `undefined` or `{}`
- backend falling back to default values (Software Engineer / JS / 5)

### Root cause B: Webhook is not gated by `metadata.type`

The webhook currently generates and stores interviews whenever:

- event is `call_ended` or `call_analyzed`
- and metadata has `userId`

But it does not require:

- `metadata.type === "generate"`

So interview-taking calls can trigger interview generation/storage unintentionally.

### Root cause C: Production logs do not capture Groq output

Due to log formatting:

- `console.log("Raw AI response:", questions);`

Some log collectors store only the first string argument, so the actual Groq output is lost.

This prevents diagnosing the real parsing problem.

### Root cause D (secondary): `generateObject` unsupported for Groq in current setup

Dependency versions:

- `ai: ^4.3.16`
- `@ai-sdk/groq: ^3.0.4`

Observed runtime error:

- `Model does not have a default object generation mode.`

This is not fatal (fallback exists), but it is noisy and contributes to confusion.

## 6) Proposed Solutions (What we think will fix it)

### Solution 1 (minimal & recommended first): Process only `call_analyzed`

Change webhook to only run interview creation when:

- `body.event === "call_analyzed"`

This ensures `call_analysis` is present and avoids running with missing analysis.

### Solution 2 (minimal & recommended): Gate by metadata.type

Only generate/store interview when:

- `metadata.type === "generate"`

This prevents interview-taking calls from creating new interviews.

### Solution 3 (minimal): Fix logging to capture the raw Groq output

Replace:

- `console.log("Raw AI response:", questions);`

with a single-string log:

- `console.log("Raw AI response: " + questions);`

so Vercel logs reliably include the model output.

### Solution 4 (follow-up if still needed): Make parsing more tolerant

If Groq output is not strict JSON arrays, update parsing to handle:

- numbered list formats `1)` and `1.`
- bullet list `- question`
- questions without `?`

This should be done only after Solution 3 reveals actual raw outputs.

### Solution 5 (optional): Remove or adjust `generateObject` for Groq

Since `generateObject` currently fails, options are:

- remove the structured attempt and rely on `generateText`
- or configure a supported structured mode (only if the provider supports it)

This is not required to fix the primary issue.

## 7) Action Plan (No Code Changes Yet)

1. Apply Solutions 1 & 2 in `app/api/retell/webhook/route.ts`:
   - only handle `call_analyzed`
   - only proceed if `metadata.type === "generate"`

2. Apply Solution 3 in `lib/actions/interview.action.ts`:
   - log raw AI output as a single string

3. Re-run one generator call and confirm:
   - webhook reads the extracted 5 values (DevOps/Docker/10)
   - Groq raw output is visible
   - parsing succeeds (or we now know exactly why it fails)

## 8) Current Status

- Investigation complete.
- Root causes identified.
- Minimal fix plan prepared.
- Awaiting approval to change code.
