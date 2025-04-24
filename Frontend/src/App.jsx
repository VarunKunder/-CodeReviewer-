import { useState, useEffect } from "react";
import "prismjs/themes/prism-tomorrow.css";
import Editor from "react-simple-code-editor";
import prism from "prismjs";
import Markdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import axios from "axios";
import "./App.css";

function App() {
  const [code, setCode] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [typingLines, setTypingLines] = useState([]);

  useEffect(() => {
    prism.highlightAll();
  }, [messages, typingLines]);

  async function reviewCode() {
    const userMessage = { type: "user", content: code };
    setMessages((prev) => [...prev, userMessage]);
    setCode("");
    setIsLoading(true);
    setTypingLines(["Generating response..."]);

    try {
      const response = await axios.post("http://localhost:3000/ai/get-review", {
        code: userMessage.content,
      });

      const fullResponse = response.data;
      const lines = fullResponse.split("\n");

      let index = 0;
      setTypingLines([]);

      const tempTypingLines = [];
      const interval = setInterval(() => {
        const nextLine = lines[index];
        index++;

        tempTypingLines.push(nextLine);
        setTypingLines([...tempTypingLines]);

        if (index >= lines.length) {
          clearInterval(interval);
          setTypingLines([]);
          setMessages((prev) => [
            ...prev,
            { type: "ai", content: fullResponse },
          ]);
          setIsLoading(false);
        }
      }, 50);
    } catch (error) {
      setTypingLines([]);
      setMessages((prev) => [
        ...prev,
        { type: "ai", content: "Error fetching review. Please try again." },
      ]);
      setIsLoading(false);
    }
  }

  return (
    <div className="chat-container dark-mode">
      <button
        className="new-chat-button"
        onClick={() => window.location.reload()}
      >
        +
      </button>

      <div className="project-title">&lt;CodeReviewer /&gt;</div>

      <div className="chat-box">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`message ${
              msg.type === "user" ? "user-message" : "ai-message"
            }`}
          >
            <div className="message-bubble">
              <Markdown rehypePlugins={[rehypeHighlight]}>
                {msg.content}
              </Markdown>
            </div>
          </div>
        ))}

        {typingLines.length > 0 && (
          <div className="message ai-message">
            <div className="message-bubble typing-animation">
              <Markdown rehypePlugins={[rehypeHighlight]}>
                {typingLines.join("\n")}
              </Markdown>
            </div>
          </div>
        )}
      </div>

      <div className={`input-area ${code.trim() !== "" ? "expanded" : ""}`}>
        <div className="input-box">
          <div className="editor-container">
            <Editor
              value={code}
              onValueChange={(newCode) => setCode(newCode)}
              highlight={(code) =>
                prism.highlight(code, prism.languages.javascript, "javascript")
              }
              padding={10}
              placeholder="Enter your code here"
              style={{
                fontFamily: '"Fira code", "Fira Mono", monospace',
                fontSize: 16,
                backgroundColor: "transparent",
                color: "#fff",
                height: "100%",
                width: "100%",
              }}
            />
          </div>
          <button
            onClick={reviewCode}
            className={`send-button ${isLoading ? "square" : "arrow"}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="square-icon" />
            ) : (
              <div className="arrow-icon">↑</div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
