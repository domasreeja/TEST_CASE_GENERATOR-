import React, { useState } from 'react';
import axios from 'axios';

const RepoList = ({ repos, accessToken, onFilesFetched, onRepoSelect }) => {
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [repoFiles, setRepoFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);


  const handleRepoClick = async (repoName, repoOwner) => {
    setSelectedRepo(repoName);
     // ✅ Save owner for this repo
    setSelectedFiles([]);

    try {
      const res = await axios.get('http://localhost:5000/api/files', {
        params: {
          accessToken,
          repoName,
        },
      });

      // ✅ Add repoName & owner to each file
      const filesWithOwner = res.data.map(f => ({
        ...f,
        repoName,
        owner: repoOwner
      }));

      setRepoFiles(filesWithOwner);
      onFilesFetched && onFilesFetched(filesWithOwner);
    } catch (err) {
      console.error('❌ Error fetching files:', err);
    }
  };

  const toggleFileSelection = (file) => {
    const isSelected = selectedFiles.some(
      (f) => f.name === file.name && f.repoName === file.repoName
    );

    const updatedSelection = isSelected
      ? selectedFiles.filter((f) => !(f.name === file.name && f.repoName === file.repoName))
      : [...selectedFiles, file];

    setSelectedFiles(updatedSelection);
  };

  const handleGenerateSummary = () => {
    if (selectedFiles.length === 0) {
      alert('Please select files to generate test case summary.');
      return;
    }
    onRepoSelect(selectedFiles); // ✅ Sends files with owner field to App.js
  };

  return (
    <div>
      <h2>Your Repositories:</h2>
      {repos.map((repo) => (
        <div
          key={repo.id}
          onClick={() => handleRepoClick(repo.name, repo.owner.login)} // ✅ Pass owner
          style={{
            cursor: 'pointer',
            padding: '8px 12px',
            border: '1px solid #ccc',
            marginBottom: '8px',
            borderRadius: '5px',
            backgroundColor: selectedRepo === repo.name ? '#e8f0fe' : '#f9f9f9',
          }}
        >
          {repo.name}
        </div>
      ))}

      {selectedRepo && repoFiles.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>Files in <code>{selectedRepo}</code>:</h3>
          <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
            {repoFiles.map((file, idx) => {
              const isSelected = selectedFiles.some(
                (f) => f.name === file.name && f.repoName === file.repoName
              );

              return (
                <li
                  key={idx}
                  onClick={() => toggleFileSelection(file)}
                  style={{
                    cursor: 'pointer',
                    padding: '6px 10px',
                    backgroundColor: isSelected ? '#d0f0c0' : '#f1f1f1',
                    marginBottom: '4px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    userSelect: 'none',
                  }}
                >
                  {file.name}
                </li>
              );
            })}
          </ul>

          <button onClick={handleGenerateSummary} style={{ marginTop: 10 }}>
            Generate Summary for Selected Files
          </button>
        </div>
      )}
    </div>
  );
};

export default RepoList;
