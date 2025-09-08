Based on your most recent work, created, deleted or updated files ultrathink about ensuring all of the documentation is up to date and reflects current state of the project.

# Protocol:
1. Collect all of the recent changes with the overall context in a temporary Markdown file in @temp/ folder
2. Get familiar with all of the documentation files inside @docs/ folder
3. Identify all outdated documentation files
4. Use your reasoning to ensure all of the @docs/ documentation is well structured on the files and content level
5. Add, update or delete documentation files depending on your reasoning and all of the rules provided
6. Provide a summary of all of the changes with the your reasoning
7. Get familiar with all of the CLAUDE.md files
8. Update CLAUDE.md files one by one to ensure contain the most relevant and up-to-date information following the best practices
9. Ensure CLAUDE.md files reference relevant @docs/ documentation files
10. Present a comprehensive summary of all of the changes you made and ask me for acceptance
11. In case of comments from my side iterate on changes to the documentation and CLAUDE.md files
12. Delete all temporary files being a result of your work
13. Commit all of the changes and push to remote

# Context:
* @docs/ is a folder
* ALL documentation is stored in @docs/ folder

# CLAUDE.md best practies:
* ALWAYS ensure ALL CLAUDE.md files are written in a way optimal for Claude Code to work with
* ALWASY ensure ALL CLAUDE.md files reference relevant files from the @docs/ folder
* Keep it concise - You're writing for Claude, not onboarding a junior dev
* Use bullet points - Short, declarative statements save tokens
* Include only project-specific info:
  - Tech stack with versions (e.g., Next.js 14.0, TypeScript 5.3)
  - Project structure (key directories and their roles)
  - Critical commands (build, test, lint, deploy)
  - Code style & conventions unique to your project
  - Repository workflows (branch naming, commit formats)
* What NOT to include?
  - Generic advice like "write clean code" or "follow best practices"
  - Basic programming concepts Claude already knows
  - Changing details like current sprint tasks
  - Secrets, API keys, or passwords
  - Information readily available in official docs
* You MUST ensure token efficiency

# @docs/ folder best practices:
* ALWAYS ensure ALL documentation files contain the most up-to-date and relevant information
* ALWAYS ensure ALL documentation files have optimal size to value ratio
* ALWAYS ensure ALL documentation files are written in a way optimal for Claude Code to work with
* You MUST ensure token efficiency

# Rules to follow:
* The information saved in documentation and CLAUDE.md files MUST be extremely precise to avoid misunderstandings
* You MUST follow the protocol described above
* CLAUDE.md files MUST be concise and stick to the best practices
* Any supporting documentation and protocols should be stored in @docs/ folder. CLAUDE.md files should only reference that additional documentation
* Documentation MUST be stored ONLY in the @docs/ folder, nowhere else. The only exception are CLAUDE.md files
* DO NOT create new documentation files without my explicit consent. When asking for permission describe your plan for such a documentation and what value it will bring to the project
* You can use @temp/ folder to create and store temporary files required to acomplish the task
* IF NEEDED, perform an online comprehensive research to fill in the gaps in the documentation
* ALWAYS consider adding links to online documentation