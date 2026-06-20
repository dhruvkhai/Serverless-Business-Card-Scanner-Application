import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [extractedData, setExtractedData] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);

  console.log("=== COMPONENT RERENDER ===");
  console.log("Current extractedData:", extractedData);

  // Fetch data on component mount
  useEffect(() => {
    console.log("=== useEffect RUN - Initial Load ===");
    fetchCards();
  }, []); // Empty dependency array - only runs once on mount

  const fetchCards = async () => {
    console.log("=== fetchCards CALLED ===");
    setLoading(true);
    try {
      const response = await axios.get(
        "https://rg1fa9l5s2.execute-api.us-east-1.amazonaws.com/prod/cards"
      );

      // Debug Logs
      console.log("=== FULL RESPONSE ===");
      console.log(response);
      console.log("=== RESPONSE.DATA ===");
      console.log(response.data);
      console.log("=== RESPONSE.DATA.BODY ===");
      console.log(response.data.body);

      let cardsData = [];

      // Try to parse the data correctly
      if (response.data) {
        if (typeof response.data === 'string') {
          console.log("response.data is a string - parsing JSON");
          cardsData = JSON.parse(response.data);
        } else if (response.data.body) {
          console.log("response.data.body exists");
          if (typeof response.data.body === 'string') {
            console.log("response.data.body is a string - parsing JSON");
            cardsData = JSON.parse(response.data.body);
          } else {
            console.log("response.data.body is already an object");
            cardsData = response.data.body;
          }
        } else {
          console.log("response.data is already the array");
          cardsData = response.data;
        }
      }

      // Make sure it's an array
      if (!Array.isArray(cardsData)) {
        console.log("⚠️ cardsData is NOT an array, wrapping in empty array:", cardsData);
        cardsData = [];
      }

      console.log("=== FINAL CARDS DATA ===");
      console.log(cardsData);
      console.log("Setting extractedData with length:", cardsData.length);

      // Take first 10 items and set state
      const dataToSet = cardsData.slice(0, 10);
      console.log("About to call setExtractedData with:", dataToSet);
      setExtractedData(dataToSet);
    } catch (error) {
      console.error("❌ Error fetching cards:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (files) => {
    console.log("=== handleFileSelect CALLED ===");
    const newFiles = Array.from(files);
    const totalFiles = [...selectedFiles, ...newFiles].slice(0, 5);
    console.log("Setting selectedFiles:", totalFiles.map(f => f.name));
    setSelectedFiles(totalFiles);
  };

  const handleFileInputChange = (e) => {
    if (e.target.files) {
      handleFileSelect(e.target.files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const removeFile = (index) => {
    console.log("=== removeFile CALLED for index:", index);
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    console.log("Setting selectedFiles to:", newFiles.map(f => f.name));
    setSelectedFiles(newFiles);
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const uploadFiles = async () => {
    console.log("=== uploadFiles CALLED ===");
    setUploading(true);
    try {
      // Convert all files to Base64
      const uploadPromises = selectedFiles.map(async (file) => {
        const base64 = await convertToBase64(file);
        console.log("Uploading file:", file.name);
        // Upload each file as Base64
        return axios.post(
          "https://rg1fa9l5s2.execute-api.us-east-1.amazonaws.com/dev",
          {
            file: base64,
            fileName: file.name
          }
        );
      });

      await Promise.all(uploadPromises);
      console.log("✅ All files uploaded successfully");

      // Clear selected files after upload
      console.log("Clearing selectedFiles");
      setSelectedFiles([]);

      // Refresh the cards list
      console.log("Calling fetchCards to refresh data");
      await fetchCards();

      alert("Files uploaded successfully!");
    } catch (error) {
      console.error("❌ Error uploading files:", error);
      alert(`Error uploading files: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="header">
        <h1>Business Card Organizer</h1>
        <p>Upload up to 5 business cards and manage your contacts</p>
      </div>

      <div
        className={`upload-area ${dragOver ? "drag-over" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById("file-input").click()}
      >
        <input
          id="file-input"
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInputChange}
          style={{ display: "none" }}
        />
        <div className="upload-icon">📁</div>
        <h2>Drag & Drop Your Business Cards Here</h2>
        <p>or click to select files (Max 5)</p>
      </div>

      {selectedFiles.length > 0 && (
        <div className="selected-files">
          <h3>Selected Files ({selectedFiles.length}/5)</h3>
          <div className="file-list">
            {selectedFiles.map((file, index) => (
              <div key={index} className="file-item">
                <span className="file-name">{file.name}</span>
                <button
                  className="remove-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button
            className="upload-btn"
            onClick={uploadFiles}
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Upload & Extract"}
          </button>
        </div>
      )}

      <div className="data-section">
        <div className="section-header">
          <h2>Business Cards (Latest 10)</h2>
          <button className="refresh-btn" onClick={fetchCards} disabled={loading}>
            {loading ? "Refreshing..." : "🔄 Refresh"}
          </button>
        </div>

        {/* Temporary Debug Section */}
        <div style={{
          background: "#f0f9ff",
          border: "1px solid #bae6fd",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "24px",
          overflow: "auto"
        }}>
          <h3 style={{ marginBottom: "12px", color: "#0369a1" }}>🔍 Debug - Current extractedData</h3>
          <pre style={{ fontSize: "12px", whiteSpace: "pre-wrap" }}>
            {JSON.stringify(extractedData, null, 2)}
          </pre>
        </div>

        {loading ? (
          <div className="loading">Loading...</div>
        ) : extractedData.length === 0 ? (
          <div className="empty-state">No business cards found. Upload some cards to get started!</div>
        ) : (
          <div className="table-container">
            <table className="cards-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Company</th>
                  <th>Email</th>
                  <th>Phone</th>
                </tr>
              </thead>
              <tbody>
                {extractedData.map((card, index) => (
                  <tr key={index}>
                    <td>{card.name || card.Name || "-"}</td>
                    <td>{card.company || card.Company || "-"}</td>
                    <td>{card.email || card.Email || "-"}</td>
                    <td>{card.phone || card.Phone || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
