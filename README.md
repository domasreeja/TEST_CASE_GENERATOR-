# TEST_CASE_GENERATOR-
Short summary / Why this exists
When building software, writing tests is crucial but time-consuming. The Test Case Generator helps reduce friction by:
 .  Quickly scanning code in your GitHub repos,
 .  Proposing test-case summaries (what to test),
 .  Generating actual test code from a selected summary,
 . Optionally creating a pull request with the generated test file.
This speeds up onboarding, improves test coverage, and gives developers a starting point for writing high-quality tests instead of starting from a blank file.
**How this project helps (plain language)**
  . Saves developer time: auto-suggests tests and scaffolds test files.
  . Standardizes initial tests so reviewers get consistent PRs.
  . Works with your GitHub repositories so generated tests are easy to review and merge.
**Extensible:** the test-generation logic is isolated and can be replaced/enhanced (for example, call an LLM / OpenAI) without rewriting the UI or PR flow.
**Features**
GitHub OAuth login (OAuth flow)

List user repositories and list files in a chosen repo

Select multiple files and ask the backend to generate summaries of suggested test-cases

Select a summary → generate full test code (mock or AI-backed)

Download generated test-cases as JSON

Create a new branch + commit a generated test file and open a GitHub PR (optional / bonus)

Clean UI with selection highlights (Tailwind-ready styling instructions included)

Project Structure
Your folders should now look like this:

cpp
Copy code
test-case-generator/
├── client/              // React frontend
│   └── src/
│       └── App.js       // main UI
└── server/
    ├── index.js         // Express server
    └── .env             // for secrets


**Quick start — Requirements**
Node.js >= 16

npm (or yarn)

A GitHub account (to create OAuth app and test PR flow)

(optional) OpenAI API key if you’ll plug in real AI for test generation

**Setup — step-by-step**
Do these commands from the project root (where package.json for client and server are). Adjust paths if you put code in different folders.

**Install backend dependencies**
bash:
cd server
npm install
Install frontend dependencies

bash:
cd ../client
npm install
(Optional) Tailwind setup
If you want the polished UI with Tailwind (recommended), from client/ run:

bash:
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
If npx tailwindcss init -p gives an error (Windows), ensure you are in the client folder and node_modules exists; if node_modules is broken see Troubleshooting below.

Add to client/src/index.css:

@tailwind base;
@tailwind components;
@tailwind utilities;
And edit tailwind.config.js:

js:
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
};
Create environment variables
Create server/.env (do not commit this file):
ini:
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
PORT=5000
# OPTIONAL if you use OpenAI in testgenerator:
OPENAI_API_KEY=sk-...
In the frontend client/src/App.js, update:
js:
const CLIENT_ID = 'your_github_oauth_client_id';
const REDIRECT_URI = 'http://localhost:3000';
(You can also store client id in an env and load it, but for quick dev this works.)

**Create a GitHub OAuth App**

Go to Settings → Developer settings → OAuth Apps → New OAuth App

Homepage URL: http://localhost:3000

Authorization callback URL: http://localhost:3000

Save the Client ID & Client Secret into server/.env

If you want GitHub to always show the authorize screen when you click Login, add &prompt=consent to the authorization URL in App.js:

js
Copy
Edit
https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&prompt=consent
Start backend
bash:
cd server
node index.js
# or: npm start (if you have configured package.json scripts)
Start frontend
bash:
cd ../client
npm start
Open http://localhost:3000.

**Usage (walkthrough)**
Open http://localhost:3000.

Click Login with GitHub → GitHub authorize prompt (if not already authorized).

After authorization the app receives a code and the backend exchanges it for an access token.

Your repositories appear. Click a repo — file list shows.

Click file entries to select files (you can multi-select).

Click Generate Summary for Selected Files → backend returns summaries of suggested tests.

Click a summary to choose it, then Generate Test Code.

You see the generated test code in the UI. You may:

Download it (JSON or file)

Create a PR: set branch/file names or use automatic names and click Create Pull Request — backend will create branch, commit the test file and open a PR.

**How test generation works (current implementation)**
There is a server/testgenerator.js module.

Default demo behavior: a lightweight heuristic parser that:

Tries to JSON.parse the file content (if JSON) and creates test ideas from keys/array elements.

If parsing fails, it falls back to simple string/line-based heuristics.

**To integrate AI (recommended):**

Replace generateTestCases implementation with a call to an LLM (OpenAI or similar).

Pass the file contents (or a group of selected files) and a prompt that asks for test-case summaries and/or full test code (e.g., Jest, Selenium, JUnit, etc.).

Ensure you provide OPENAI_API_KEY in server/.env.
⚠️ Will it affect your GitHub?
Yes, but only if you allow it. Here’s how:

✅ What it will do (once implemented):
Create a new branch in one of your repositories.

Add a new test file (containing the generated test cases) to that branch.

Open a Pull Request (PR) from that branch to your default branch (usually main or master).

The PR is just a request — no changes will be merged automatically unless you manually approve the PR on GitHub.

🚫 What it will NOT do:
It will not delete, overwrite, or edit existing files in your default branch.

It will not merge anything without your explicit approval.

It will not access any other private repositories unless you authorize it.

💡 Tip:
If you’re worried about modifying a real repository:

You can create a dummy/test repo just for trying this PR feature.

Or you can test it on a fork of your repo.


**Important notes & security**
Never commit .env or any tokens to git. Treat GitHub tokens and API keys as secrets.

The sample implementation obtains an OAuth access token from GitHub and uses it for API calls — this token is ephemeral for testing.

If you open PRs using the generated token, you are committing to your repo — do not run on repos where you don’t want automated commits.

When integrating a third-party LLM, be mindful of sending private code to external APIs — follow your organization’s security policy.

**Future improvements / TODOs**
Replace demo testgenerator with a proper LLM prompt to generate better test ideas and test code.

Add syntax highlighting to the generated test code (e.g., react-syntax-highlighter).

Add toasts and loading spinners for a more polished UX.

Add search/filter for repos and files.

Add unit/integration tests for the generator logic.

Add permissions check: only operate on repos where user has push access.

Support multiple test frameworks (Jest, Mocha, PyTest, Selenium, etc.) via configuration.

**Contribution**
Pull requests welcome — please open PRs against the develop branch.
If adding AI integration, make it pluggable and respect a config TEST_GENERATOR_PROVIDER=mock|openai.


