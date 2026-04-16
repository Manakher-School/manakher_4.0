# AI Agents Instructions

If you are an AI assistant working on this project, you **MUST** follow these rules:

**Tech Stack Note:** We are using **Next.js** for the frontend, **PocketBase** for the backend, and you should leverage the **pocketbase-mcp** this is for you (the agent) to interact with pocketbase (with great power comes great responsibility).

## 1. Single Source of Truth
The file `journal.md` is the single source of truth for the project. Always read it first to understand the current milestone, what has been completed, and what the current state is.

## 2. STRICT Design & UI/UX Rules
- **Aesthetic**: Minimal, gentle, and clean design. Do NOT use "shiny or playful" naming conventions in code or UI.
- **Colors**: Bright palettes are allowed but they MUST NOT be blinding or excessively colorful. Keep it restrained.
- **Visuals/Icons**: NO emojis. NO playful or cartoonish icons.
- **Animations**: NO stupid, heavy, or playful animations.
- **Bottom line**: We are building for young ages, but the environment must feel calm, structured, and professional. NEVER chaotic or overtly playful.

## 3. Mandatory Milestone Testing (Browser Recording)
**CRITICAL:** At the completion of EVERY milestone, you MUST open a browser to navigate, log in if necessary, and actually test the UI and logic in front of the user using the `browser_subagent` tool. The user expects to see a recording/proof of the UI working. NEVER hand off a milestone without testing it visually first.

## 4. Milestone Statuses
The project is divided into a to-do list of milestones in `journal.md`. Each milestone must have one of these statuses:
- `PLANNING`
- `INPROGRESS`
- `NOT_STARTED`
- `HANDOFF`
- `VERIFIED_BY_USER` (This means the milestone is entirely complete and approved).

## 5. Iteration History Logging
The `journal.md` file also serves as a history of iterations. 
Every time you make an iteration (write code, debug, set up infrastructure, etc.), you **MUST** manually edit `journal.md` to log what you did under the current milestone.

**Your log entry must include:**
- What you did/accomplished.
- What you struggled with or broke (what you "fucked up"), so the next agent has full context and doesn't repeat your mistakes.

Never finish your task without updating the iteration history in `journal.md`. Keep your logs clear and concise.


---

make sure you commit stuff as you go
