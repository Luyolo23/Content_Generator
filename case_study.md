# Case Study: Engineering the Prompts Behind Concept Coach

**Project:** Concept Coach, an AI-powered study and tech explainer
**Focus:** Prompt engineering, iteration and optimization
**Stack:** React 19, TanStack Router, Groq API (`openai/gpt-oss-120b`), Zod
**Links:** [Live app](#) · [GitHub repository](#) · [Full prompt library](./prompt.md)

---

## Summary

Concept Coach takes any topic and turns it into a complete learning pack: a short summary, a step-by-step explanation, an analogy, an optional code example, common misconceptions, key takeaways, a 5-question quiz, flashcards and follow-up questions.

The hard part was not getting the model to explain things. It was getting it to produce the **same reliable structure every time**, at four different learner levels, in three languages, with output that a web interface could render without breaking. This case study walks through how the prompts evolved to get there.

---

## 1. The problem

A prompt that gives a good answer in a chat window is not enough when the output feeds an application. Concept Coach needed prompts that:

- Return **machine-readable output** the UI can render section by section
- Adapt vocabulary and depth to the learner's level (ELI5 to Advanced)
- Stay **honest**, admitting uncertainty instead of inventing facts, which matters in a study tool
- Produce **quiz questions worth answering**, with plausible wrong options
- Work in English, plus experimental Afrikaans and isiZulu modes

---

## 2. The approach

### A consistent prompt structure

Every prompt in the project is written with the same four parts:

| Part | Purpose |
| --- | --- |
| **Role** | Who the model is (for example, "an expert teacher who explains any concept clearly and honestly") |
| **Context** | The situation, and how the output will be used |
| **Constraints** | A list of specific, testable rules |
| **Output format** | The exact shape of the response |

### One source of truth

All prompts live in a single file, `src/lib/prompts.ts`. The backend builds its requests from it, and the `/prompt-lab` page in the app renders the **same objects**. This means the documentation can never drift from what actually runs in production.

### A small set of focused prompts

| Prompt | Job |
| --- | --- |
| Explanation pack | Generates the full structured learning pack |
| Quiz rules | Governs question quality |
| Flashcards | Governs card length and coverage |
| Go deeper chat | Answers follow-up questions in context |
| JSON repair | One-time fix when a response fails validation |

---

## 3. Iterations

### Iteration 1: From free text to a strict schema

| Version | Change | Problem it addressed |
| --- | --- | --- |
| v1 | One free-text explanation blob | Rendered poorly; quizzes were hard to extract |
| v2 | Strict JSON schema with fixed counts per section | UI can now render each section reliably |

The v2 prompt specifies exactly how many items each section needs, for example 4-7 explanation steps, exactly 3 misconceptions and exactly 5 quiz questions with 4 options each. The model is told to return **only** valid JSON, with the shape written out in the prompt.

**Lesson:** When another program consumes the output, specify the structure, not just the content.

### Iteration 2: Honesty and quality rules

In v3 of the explanation pack I added rules aimed at output quality, not just format:

```text
- Be factually accurate. If you are unsure about something, say so plainly instead of inventing details.
- Never fabricate statistics, dates, citations or quotes.
- Match the vocabulary to the requested level: at ELI5 and Beginner avoid jargon entirely,
  or define it in the same sentence.
- Distractors must be plausible but clearly wrong to someone who understood the explanation.
```

These are written as **testable rules** rather than vague goals. "Make good quiz questions" is hard to check; "exactly one option is unambiguously correct" is easy to check.

**Lesson:** Specific, checkable constraints beat general instructions.

### Iteration 3: Fixing the quiz

| Version | Change | Problem it addressed |
| --- | --- | --- |
| v1 | Initial quiz generation | The correct answer landed in position A most of the time |
| v2 | Distractor-plausibility rules and per-answer explanations | Wrong options were weak; feedback did not teach |
| v3 | Options shuffled **server-side**, `correctIndex` remapped | Position of the answer now leaks nothing |

The position bias was a model habit, and no prompt wording removed it reliably. The fix was in code: shuffle the options after generation and update the index.

**Lesson:** Some problems should be solved in code, not in the prompt.

### Iteration 4: Cost, latency and mobile readability

- **JSON repair:** v1 retried the whole generation from scratch, which doubled cost and latency. v2 repairs the existing output **once** instead of regenerating it.
- **Flashcards:** v1 backs were paragraph-length and unreadable on mobile. v2 added a hard two-sentence cap and a no-duplicates rule.
- **Follow-up chat:** v1 forgot the topic between turns and gave generic answers. v2 restates the topic and level in the system prompt on every turn, and v3 added a 150-word cap and an explicit "admit uncertainty" rule.

**Lesson:** Prompts have to fit the constraints of the product: cost, speed and screen size.

---

## 4. The full pipeline

Prompting is one layer of a larger reliability system:

```text
Learner settings
  -> prompt built from role, context, constraints and output format
  -> model response (JSON only)
  -> strip fences, parse, validate with Zod
  -> if invalid: one repair attempt using the JSON repair prompt
  -> shuffle quiz options server-side
  -> cache and return a typed learning pack
```

Alongside this, the server applies a per-IP rate limit, a 24-hour cache and a 30-second timeout, and the UI shows friendly error states with a retry for rate limits, network failures and malformed responses.

---


What improved, as recorded during development:

- Every section of the learning pack now renders reliably in the UI
- Quiz answers are no longer biased toward one position
- Flashcards are readable on a phone screen
- Failed responses are recovered with a single repair call instead of a full retry

---

## 5. What I learned

1. **Structure the prompt like a spec.** Role, context, constraints and output format keep every prompt consistent and easy to review.
2. **Write constraints you can verify.** Exact counts and clear rules are easier to test than general quality goals.
3. **Keep a version history.** Writing down what each version fixed made it obvious which changes worked.
4. **Know when not to use a prompt.** Shuffling quiz answers and validating JSON are better done in code.
5. **Design for failure.** A repair step, validation and clear error states matter as much as the main prompt.

---

## 6. What I would do next

- Stream the explanation as it generates instead of waiting for the full JSON
- Add human-reviewed quality checks for the Afrikaans and isiZulu modes
- Add spaced-repetition scheduling for flashcards

---

## Prompt library

The complete prompts, with roles, constraints, output formats, examples and version history, are documented in [`prompt.md`](./prompt.md) and shown live on the app's `/prompt-lab` page.
