const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// ✅ Default route for testing
app.get('/', (req, res) => {
  res.send('Backend is running');
});

// ✅ GitHub OAuth Token Exchange Route
app.post('/authenticate', async (req, res) => {
  const code = req.body.code;
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  try {
    const tokenRes = await axios.post(
      `https://github.com/login/oauth/access_token`,
      {
        client_id: clientId,
        client_secret: clientSecret,
        code,
      },
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );

    const accessToken = tokenRes.data.access_token;
    res.json({ access_token: accessToken });
  } catch (err) {
    console.error('❌ Token exchange error:', err);
    res.status(500).json({ error: 'Failed to get access token' });
  }
});

// ✅ Fetch Files from Repo
app.get('/api/files', async (req, res) => {
  const { accessToken, repoName } = req.query;

  if (!accessToken || !repoName) {
    return res.status(400).json({ error: 'Missing accessToken or repoName' });
  }

  try {
    const userRes = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    const username = userRes.data.login;

    const response = await axios.get(
      `https://api.github.com/repos/${username}/${repoName}/contents`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          
          Accept: 'application/vnd.github.v3.raw',
        },
      }
    );

    // Include both file name and repo name so frontend can reuse it
    const files = response.data
      .filter((item) => item.type === 'file')
      .map((item) => ({
        name: item.name,
        repoName,
        owner:username
      }));

    res.json(files);
  } catch (error) {
    console.error('❌ Error fetching repo files:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// ✅ Fetch File Content
app.get('/api/file-content', async (req, res) => {
  const { accessToken, repoName, fileName } = req.query;

  if (!accessToken || !repoName || !fileName) {
    return res.status(400).json({ error: 'Missing accessToken, repoName, or fileName' });
  }

  try {
    const userRes = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const username = userRes.data.login;

    const fileRes = await axios.get(
      `https://api.github.com/repos/${username}/${repoName}/contents/${fileName}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3.raw',
        },
      }
    );
    console.log('📦 Raw file content fetched:', fileRes.data);

    res.json({ content: fileRes.data });
  } catch (error) {
    console.error('❌ Error fetching file content:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch file content' });
  }
});
const { generateTestCases } = require('./testgenerator'); // you'll create this next

app.post('/api/generate-test-cases', async (req, res) => {
  let { fileContent } = req.body;

  if (!fileContent) {
    return res.status(400).json({ error: 'Missing file content' });
  }
console.log('📦 Incoming file content:', fileContent);
  // Optional: Normalize fileContent to a string if it's an object
  if (typeof fileContent === 'object') {
    fileContent = JSON.stringify(fileContent);
  }

  try {
    const testCases = await generateTestCases(fileContent);
    res.json({ testCases });
  } catch (err) {
    console.error('Error generating test cases:', err);
    res.status(500).json({ error: 'Failed to generate test cases' });
  }
});
app.post('/api/generate-summary', async (req, res) => {
  const { files } = req.body;

  if (!files || !Array.isArray(files)) {
    return res.status(400).json({ error: 'Missing or invalid files array' });
  }

  try {
    const summaries = files.map((file) => ({
      fileName: file.name,
      summary: `Summary for ${file.name}: This file appears to contain logic related to XYZ.`,
    }));

    res.json({ summaries });
  } catch (err) {
    console.error('❌ Error generating summaries:', err);
    res.status(500).json({ error: 'Failed to generate summaries' });
  }
});
// ✅ Generate full test code from selected summary
app.post('/api/generate-test-code', async (req, res) => {
  const { summary } = req.body;

  if (!summary) {
    return res.status(400).json({ error: 'Missing summary for test code generation' });
  }

  try {
    // This is a mock/dummy test code for demo purposes
    const testCode = `
      // 🧪 Auto-generated test code
      describe('Test based on summary', () => {
        it('${summary}', () => {
          // TODO: Implement test logic based on above summary
        });
      });
    `;

    res.json({ testCode: testCode.trim() });
  } catch (err) {
    console.error('❌ Error generating test code:', err.message || err);
    res.status(500).json({ error: 'Failed to generate test code' });
  }
});

app.post('/api/create-pr', async (req, res) => {
  console.log("📥 Raw request body:", req.body);

  console.log("📥 PR creation request body:", req.body);
  console.log("📥 Access token received:", req.body.accessToken ? "✅ Present" : "❌ Missing");

  const { accessToken, repoName, owner, branchName, fileName, commitMessage, prTitle, prBody, testCode, auto } = req.body;

  if (!accessToken || !repoName || !testCode || !owner) {
    return res.status(400).json({ error: 'Missing required fields (accessToken, repoName, owner, testCode)' });
  }

  try {
    // Get default branch
    const repoRes = await axios.get(`https://api.github.com/repos/${owner}/${repoName}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const defaultBranch = repoRes.data.default_branch;

    // Get latest commit SHA
    const refRes = await axios.get(`https://api.github.com/repos/${owner}/${repoName}/git/ref/heads/${defaultBranch}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const latestCommitSha = refRes.data.object.sha;

    // Auto branch/file naming if needed
    const finalBranch = auto ? `test-cases-${Date.now()}` : branchName;
    const finalFile = auto ? `auto-test-${Date.now()}.js` : fileName;

    // Create new branch
    await axios.post(
      `https://api.github.com/repos/${owner}/${repoName}/git/refs`,
      {
        ref: `refs/heads/${finalBranch}`,
        sha: latestCommitSha,
      },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    // Create/Update file in new branch
    await axios.put(
      `https://api.github.com/repos/${owner}/${repoName}/contents/${finalFile}`,
      {
        message: commitMessage || `Add test cases from generator`,
        content: Buffer.from(testCode).toString('base64'),
        branch: finalBranch,
      },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    // Create Pull Request
    const prRes = await axios.post(
      `https://api.github.com/repos/${owner}/${repoName}/pulls`,
      {
        title: prTitle || `Add generated test cases`,
        head: finalBranch,
        base: defaultBranch,
        body: prBody || `This PR adds auto-generated test cases.`,
      },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    res.json({ message: 'PR created successfully', prUrl: prRes.data.html_url });
  } catch (err) {
    console.error('❌ PR creation error details:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to create PR', details: err.response?.data || err.message });
  }
});



// ✅ Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
