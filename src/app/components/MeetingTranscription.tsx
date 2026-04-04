import React, { useEffect } from "react";

const MeetingTranscription: React.FC = () => {
  useEffect(() => {
    // Open the frontend.html in a new tab or iframe
    const win = window.open("/voice_detection/frontend.html", "_blank");
    // Optionally, focus the new window
    if (win) win.focus();
  }, []);

  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h2>Launching Real-Time Meeting Transcription...</h2>
      <p>If the transcription window did not open, please allow popups and try again.</p>
    </div>
  );
};

export default MeetingTranscription;
