import React, { useState, useEffect } from 'react';
import axios from 'axios';
import RepoList from './components/RepoList';

function App() {
  const [accessToken, setAccessToken] = useState(null);
  const [repos, setRepos] = useState([]);
  const [summaries, setSummaries] = useState([]);
  const [selectedSummary, setSelectedSummary] = useState(null);
  const [generatedTestCode, setGeneratedTestCode] = useState('');

  // PR creation state
  const [branchName, setBranchName] = useState('');
  const [fileName, setFileName] = useState('');
  const [useAutoNames, setUseAutoNames] = useState(true);
  const [selectedRepoName, setSelectedRepoName] = useState('');
  const [owner, setOwner] = useState('');

  const CLIENT_ID = 'Ov23liECc58Ll2gPrNzt';
  const REDIRECT_URI = 'http://localhost:3000';

  
  const loginWithGitHub = () => {
  window.location.assign(
    `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&prompt=consent`
  );
};


  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code');
    if (code) {
      axios
        .post('http://localhost:5000/authenticate', { code })
        .then((res) => {
          setAccessToken(res.data.access_token);
          fetchRepos(res.data.access_token);
        })
        .catch((err) => console.error('GitHub Auth Error:', err));
    }
  }, []);

  const fetchRepos = (token) => {
    axios
      .get('https://api.github.com/user/repos', {
        headers: { Authorization: `Bearer ${token}` },
        params: { per_page: 100 },
      })
      .then((res) => setRepos(res.data))
      .catch((err) => console.error(err));
  };

  const handleRepoSelectForSummary = async (selectedFilesFromRepoList) => {
    console.log('📥 Selected files received in App.js:', selectedFilesFromRepoList);

    if (selectedFilesFromRepoList.length > 0) {
      const repoName = selectedFilesFromRepoList[0].repoName;
      setSelectedRepoName(repoName);

      // Try to find owner from repos list
      const repoData = repos.find(r => r.name === repoName);
      if (repoData && repoData.owner && repoData.owner.login) {
        setOwner(repoData.owner.login);
        console.log("📦 Owner set from repos[]:", repoData.owner.login);
      } else if (selectedFilesFromRepoList[0].owner) {
        // Fallback if owner is passed from RepoList
        setOwner(selectedFilesFromRepoList[0].owner);
        console.log("📦 Owner set from selectedFilesFromRepoList:", selectedFilesFromRepoList[0].owner);
      } else {
        console.warn("⚠️ Could not determine repo owner for", repoName);
      }
    }

    try {
      const res = await axios.post('http://localhost:5000/api/generate-summary', {
        files: selectedFilesFromRepoList,
      });
      setSummaries(res.data.summaries.map(s => `${s.fileName}: ${s.summary}`));
    } catch (err) {
      console.error('Error generating summary:', err);
    }
  };

  const handleGenerateTestCode = async () => {
    if (!selectedSummary) return;
    try {
      const res = await axios.post('http://localhost:5000/api/generate-test-code', {
        summary: selectedSummary,
      });
      setGeneratedTestCode(res.data.testCode);
    } catch (err) {
      console.error('Error generating test code:', err);
    }
  };

  const handleCreatePR = async () => {
    const branch = useAutoNames ? `auto-test-branch-${Date.now()}` : branchName;
    const file = useAutoNames ? `auto-test-${Date.now()}.test.js` : fileName;

    if (!branch || !file) {
      alert('Please provide branch and file name.');
      return;
    }

    // Debug what we’re sending
    console.log("📤 Creating PR with payload:", {
      accessToken,
      repoName: selectedRepoName,
      owner,
      branchName: branch,
      fileName: file,
      testCode: generatedTestCode
    });

    try {
      const res = await axios.post('http://localhost:5000/api/create-pr', {
        accessToken,
        repoName: selectedRepoName,
        owner,
        branchName: branch,
        fileName: file,
        commitMessage: 'Add generated test cases',
        prTitle: 'Generated Test Cases',
        prBody: 'This PR adds auto-generated test cases.',
        testCode: generatedTestCode,
        auto: useAutoNames
      });
      console.log('✅ PR created:', res.data);
      alert(`✅ PR created successfully! View it here: ${res.data.prUrl}`);
    } catch (err) {
      console.error('❌ Error creating PR:', err.response?.data || err.message);
      alert('❌ Failed to create PR. Check console for details.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50" >
      <h1 className="text-4xl font-bold text-gray-800 mb-8">Test Case Generator</h1>

      {!accessToken ? (
        <button onClick={loginWithGitHub}className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition" >Login with GitHub</button>
      ) : (
        <>
          <RepoList
            repos={repos}
            accessToken={accessToken}
            onRepoSelect={handleRepoSelectForSummary}
          />

          {summaries.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h3>Generated Summaries (select one):</h3>
              <ul>
                {summaries.map((summary, index) => (
                  <li
                    key={index}
                    onClick={() => setSelectedSummary(summary)}
                    style={{
                      marginBottom: 10,
                      backgroundColor: selectedSummary === summary ? '#d0f0c0' : '#f0f0f0',
                      padding: '10px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    <pre>{summary}</pre>
                  </li>
                ))}
              </ul>

              <button
                onClick={handleGenerateTestCode}
                disabled={!selectedSummary}
                style={{ marginTop: 10 }}
              >
                Generate Test Code
              </button>
            </div>
          )}

          {generatedTestCode && (
            <div style={{ marginTop: 20 }}>
              <h3>Generated Test Code:</h3>
              <pre
                style={{
                  background: '#f4f4f4',
                  padding: '10px',
                  borderRadius: '4px',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {generatedTestCode}
              </pre>

              <div style={{ marginTop: 20, padding: 10, border: '1px solid #ccc', borderRadius: 5 }}>
                <h4>Create GitHub PR</h4>

                <label style={{display: 'block',marginBottom:'1opx'}}>
                  <input
                    type="checkbox"
                    checked={useAutoNames}
                    onChange={() => setUseAutoNames(!useAutoNames)}
                  />
                  Use automatic branch and file name
                </label>

                {!useAutoNames && (
                  <div style={{ marginTop: 10 }}>
                    <input
                      type="text"
                      placeholder="Branch name"
                      value={branchName}
                      onChange={(e) => setBranchName(e.target.value)}
                      style={{ display: 'block', marginBottom: 5, width: '100%' }}
                    />
                    <input
                      type="text"
                      placeholder="File name"
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                      style={{ display: 'block', marginBottom: 5, width: '100%' }}
                    />
                  </div>
                )}

                <button style={{ marginTop: 10 }} onClick={handleCreatePR}>
                  Create Pull Request
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
