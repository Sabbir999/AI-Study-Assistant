import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

function Home() {
  const navigate = useNavigate();
  const [currentMessage, setCurrentMessage] = useState(0);
  const [fadeState, setFadeState] = useState("fade-in");

  const messages = [
    "Are you ready for the next generation of studying?",
    "Intelligent learning made simple.",
    "Study smarter, not harder.",
    "Your academic success starts here.",
  ];

  useEffect(() => {
    const fadeInterval = setInterval(() => {
      if (fadeState === "fade-in") {
        setFadeState("fade-out");
        setTimeout(() => {
          setCurrentMessage((prev) => (prev + 1) % messages.length);
          setFadeState("fade-in");
        }, 1000);
      }
    }, 4000);

    return () => clearInterval(fadeInterval);
  }, [fadeState, messages.length]);

  useEffect(() => {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;
    
    for (let i = 0; i < 30; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.animationDelay = Math.random() * 15 + 's';
      particle.style.animationDuration = (Math.random() * 10 + 10) + 's';
      particlesContainer.appendChild(particle);
    }
  }, []);

  return (
    <div className="home-container">
      <div className="animated-bg">
        <div className="floating-shape"></div>
        <div className="floating-shape"></div>
        <div className="floating-shape"></div>
        <div className="floating-shape"></div>
      </div>
      <div className="grid-overlay"></div>
      <div id="particles"></div>

      <div className="home-content">
        <div className="logo-icon">🎓</div>
        <h1 className="main-title">StudyAI</h1>
        <p className="subtitle">Intelligent Learning Made Simple</p>
        <p className={`flavor-text ${fadeState}`}>{messages[currentMessage]}</p>
        
        <div className="cta-container">
          <button className="sign-in-button primary" onClick={() => navigate("/signup")}>
            Get Started
          </button>
          <button className="sign-in-button secondary" onClick={() => navigate("/about")}>
            Learn More
          </button>
        </div>

        <div className="features">
          <div className="feature-card">
            <div className="feature-icon">🧠</div>
            <div className="feature-title">AI-Powered</div>
            <div className="feature-description">Smart algorithms adapt to your learning style</div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📚</div>
            <div className="feature-title">Comprehensive</div>
            <div className="feature-description">Quizzes, flashcards, and interactive games</div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📈</div>
            <div className="feature-title">Track Progress</div>
            <div className="feature-description">Monitor your improvement over time</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;