import React, { useEffect, useState } from "react";
import "./Dashboard.css";
import CrossWordImage from "./crosswordPuzzle.jpg";
import CountryFlagImage from "./worldmap.jpg";
import CategorySortingImage from "./sortinggame.jpg";
import TrueFalseImage from "./factORFiction.jpg";
import { useNavigate } from "react-router-dom";
import {
  FaBook,
  FaPoll,
  FaStickyNote,
  FaEye,
  FaCrown,
  FaChartLine,
  FaCalendarAlt,
  FaPlus,
  FaTrophy,
  FaFire,
  FaStar,
  FaGamepad,
  FaHistory,
  FaClock,
  FaUser,
  FaBullseye,
} from "react-icons/fa";
import {
  getDatabase,
  ref,
  get,
  set,
  query,
  orderByChild,
  limitToLast,
} from "firebase/database";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { database } from "../config/firebase";
import { v4 as uuidv4 } from "uuid";

function Dashboard() {
  const navigate = useNavigate();
  const [popularQuizzes, setPopularQuizzes] = useState([]);
  const [popularFlashcards, setPopularFlashcards] = useState([]);
  const [recentUserQuizzes, setRecentUserQuizzes] = useState([]);
  const [recentUserFlashcards, setRecentUserFlashcards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [dynamicGreeting, setDynamicGreeting] = useState("");
  const [dynamicMessage, setDynamicMessage] = useState("");
  const [messageIndex, setMessageIndex] = useState(0);

  const motivationalMessages = [
    "Knowledge is power! Let's unlock your potential.",
    "Every question you answer brings you closer to mastery!",
    "You're doing amazing! Keep up the great work!",
    "Progress, not perfection. Every step counts!",
    "Your brain is a muscle - keep exercising it!",
    "Take a deep breath. You've got this!",
    "Celebrate every small victory along the way!",
    "Learning is a journey. Enjoy the process!",
  ];

  const getTimeBasedMessages = () => {
    const hour = new Date().getHours();
    const messages = [...motivationalMessages];

    if (hour >= 1 && hour < 5) {
      messages.push(
        "It's late! Remember to rest when you need to.",
        "Quality learning requires quality rest!",
        "Your health is important - consider taking a break soon."
      );
    } else if (hour >= 5 && hour < 12) {
      messages.unshift(
        "Good morning! Fresh start for new achievements!",
        "Rise and shine! Perfect time to learn something new!"
      );
    } else if (hour >= 12 && hour < 17) {
      messages.unshift(
        "Afternoon power! Let's conquer those challenges!",
        "You're in the zone! Keep that momentum going!"
      );
    } else {
      messages.unshift(
        "Evening dedication! Proud of your commitment!",
        "Great work today! Finish strong!"
      );
    }
    return messages;
  };

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 17) return "Good afternoon";
    if (hour >= 17 && hour < 21) return "Good evening";
    return "Late night studies? Remember to rest";
  };

  // Fetch functions with better error handling
  const fetchPopularQuizzes = async () => {
    try {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const twoWeeksAgoTimestamp = twoWeeksAgo.getTime();

      const dbRef = ref(database, "quizzes");
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        const quizzesData = snapshot.val();
        const quizzesArray = Object.keys(quizzesData).map((key) => ({
          id: key,
          ...quizzesData[key],
        }));
        const recentQuizzes = quizzesArray.filter((quiz) => {
          const createdAt = quiz.createdAt ? new Date(quiz.createdAt).getTime() : 0;
          return createdAt >= twoWeeksAgoTimestamp;
        });
        const sortedQuizzes = recentQuizzes
          .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
          .slice(0, 5);
        setPopularQuizzes(sortedQuizzes);
      } else {
        setPopularQuizzes([]);
      }
    } catch (error) {
      console.error("Error fetching popular quizzes:", error);
      setError("Error fetching popular quizzes.");
      setPopularQuizzes([]);
    }
  };

  const fetchPopularFlashcards = async () => {
    try {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const twoWeeksAgoTimestamp = twoWeeksAgo.getTime();

      const dbRef = ref(database, "flashcards");
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        const flashcardsData = snapshot.val();
        const flashcardsArray = Object.keys(flashcardsData).map((key) => ({
          id: key,
          ...flashcardsData[key],
        }));
        const recentFlashcards = flashcardsArray.filter((flashcard) => {
          const createdAt = flashcard.createdAt ? new Date(flashcard.createdAt).getTime() : 0;
          return createdAt >= twoWeeksAgoTimestamp;
        });
        const sortedFlashcards = recentFlashcards
          .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
          .slice(0, 5);
        setPopularFlashcards(sortedFlashcards);
      } else {
        setPopularFlashcards([]);
      }
    } catch (error) {
      console.error("Error fetching popular flashcards:", error);
      setError("Error fetching popular flashcards.");
      setPopularFlashcards([]);
    }
  };

  const fetchRecentUserQuizzes = async (userId) => {
    try {
      const userResultsRef = query(
        ref(database, `users/${userId}/quizResults`),
        orderByChild("timestamp"),
        limitToLast(5)
      );
      const snapshot = await get(userResultsRef);
      if (snapshot.exists()) {
        const resultsData = snapshot.val();
        const quizzesArray = Object.keys(resultsData)
          .map((key) => ({
            id: key,
            ...resultsData[key],
            createdAt: resultsData[key].timestamp,
          }))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        quizzesArray.forEach((quiz) => {
          if (quiz.questions) {
            quiz.questions = quiz.questions.map((q) => {
              const answers = q.answers || q.allAnswers || [];
              let correctIndex = 1;
              if (answers.length) {
                const idx = answers.indexOf(q.correctAnswer);
                correctIndex = idx !== -1 ? idx + 1 : 1;
              }
              return { ...q, answers, correctAnswer: correctIndex.toString() };
            });
          }
        });
        setRecentUserQuizzes(quizzesArray);
      } else {
        setRecentUserQuizzes([]);
      }
    } catch (error) {
      console.error("Error fetching user quizzes:", error);
      setRecentUserQuizzes([]);
    }
  };

  const fetchRecentUserFlashcards = async (userId) => {
    try {
      const userFlashcardsRef = query(
        ref(database, `users/${userId}/flashcard-lists`),
        orderByChild("createdAt"),
        limitToLast(5)
      );
      const snapshot = await get(userFlashcardsRef);
      if (snapshot.exists()) {
        const flashcardsData = snapshot.val();
        const flashcardsArray = Object.keys(flashcardsData)
          .map((key) => ({
            id: key,
            ...flashcardsData[key],
          }))
          .sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
          });
        setRecentUserFlashcards(flashcardsArray);
      } else {
        setRecentUserFlashcards([]);
      }
    } catch (error) {
      console.error("Error fetching user flashcards:", error);
      setRecentUserFlashcards([]);
    }
  };

  const fetchLeaderboardData = async () => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      const usersRef = ref(database, "users");
      const quizzesRef = ref(database, "quizzes");
      const [usersSnapshot, quizzesSnapshot] = await Promise.all([
        get(usersRef),
        get(quizzesRef),
      ]);

      if (usersSnapshot.exists() && quizzesSnapshot.exists()) {
        const usersData = usersSnapshot.val();
        const quizzesData = quizzesSnapshot.val();

        // ... rest of your leaderboard logic (unchanged)
        // [Keep your existing leaderboard logic here]

      }
    } catch (error) {
      console.error("Error fetching leaderboard data:", error);
    }
  };

  // Load all data for authenticated user
  const loadUserData = async (userId) => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all data in parallel
      await Promise.all([
        fetchPopularQuizzes(),
        fetchPopularFlashcards(),
        fetchRecentUserQuizzes(userId),
        fetchRecentUserFlashcards(userId),
        fetchLeaderboardData()
      ]);
      
    } catch (error) {
      console.error("Error loading user data:", error);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const auth = getAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        setDynamicGreeting(getTimeBasedGreeting());
        loadUserData(user.uid);
      } else {
        setLoading(false);
        navigate("/login");
      }
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const messages = getTimeBasedMessages();
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 8000);
    
    setDynamicMessage(messages[messageIndex]);
    
    return () => clearInterval(interval);
  }, [messageIndex]);

  // Rest of your component JSX remains the same...
  // [Keep your existing JSX code here]

  const handleQuizClick = (quiz) => {
    navigate(`/quizzesdetails/${quiz.id}`, { state: { quiz } });
  };

  const handleFlashcardClick = (flashcard) => {
    navigate(`/Dashboard/flashcards/${flashcard.id}`, { state: { flashcard } });
  };

  const games = [
    { 
      name: "Vocab Quiz", 
      image: require("../mainpages/vocabulary.png"),
      path: "/VocabQuiz" 
    },
    { name: "Guess the Country Flag", image: CountryFlagImage, path: "/Country" },
    { name: "Category Sorting", image: CategorySortingImage, path: "/CategorySortingGame" },
    { name: "Fact or Caps", image: TrueFalseImage, path: "/FactGame" },
  ];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <h3>Error Loading Dashboard</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>{dynamicGreeting}, {user?.displayName || "Learner"}!</h1>
        <p className="dynamic-message">{dynamicMessage}</p>
      </div>

      <div className="dashboard-top-section">
        <div className="leaderboard-container">
          {leaderboardData.map((category) => (
            <div key={category.id} className="leaderboard-category">
              <div className="category-header">
                <div className="category-icon">{category.icon}</div>
                <h4>{category.title}</h4>
              </div>
              <div className="top-users">
                {category.items.length > 0 ? (
                  category.items.map((item, index) => (
                    <div key={item.id} className="user-row">
                      <span className="user-rank">
                        {index === 0 ? (
                          <FaTrophy className="gold" />
                        ) : index === 1 ? (
                          <FaTrophy className="silver" />
                        ) : index === 2 ? (
                          <FaTrophy className="bronze" />
                        ) : (
                          `${index + 1}.`
                        )}
                      </span>
                      {category.isPercentage ? (
                        <>
                          <span className="dashboarduser-name">
                            {item.name}
                            {item.secondaryValue && <small> {item.secondaryValue}</small>}
                          </span>
                          <span className="user-metric">
                            {item.value}{category.metric}
                          </span>
                        </>
                      ) : category.isDate ? (
                        <>
                          <span className="dashboarduser-name">{item.name}</span>
                          <span className="user-metric">{item.value}</span>
                        </>
                      ) : (
                        <>
                          <span className="dashboarduser-name">{item.name}</span>
                          <span className="user-metric">
                            {item.value} {category.metric}
                          </span>
                        </>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="no-data">No data available</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="dashboard-bottom-section">
        {/* Recent Quizzes Section */}
        <div className="recent-quizzes-section">
          <div className="section-header">
            <h3>
              <FaHistory className="section-icon" /> Recently Completed Quizzes
            </h3>
            <button
              className="add-quiz-button"
              onClick={() => navigate("/Quizzes")}
              aria-label="Create new quiz"
            >
              <FaPlus style={{ color: "white", fontSize: "14px" }} />
            </button>
          </div>
          <div className="quizzes-grid scrollable">
            {recentUserQuizzes.length > 0 ? (
              recentUserQuizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="quiz-card"
                  onClick={() =>
                    navigate(`/quizzesdetails/${quiz.id}`, {
                      state: {
                        quiz: {
                          id: quiz.id,
                          title: quiz.quizTitle,
                          synopsis: quiz.quizSynopsis,
                          questions: quiz.questions?.map((q) => ({
                            questionText: q.question,
                            answers: q.answers,
                            correctAnswer: parseInt(q.correctAnswer) - 1,
                            explanation: q.explanation,
                          })) || [],
                        },
                      },
                    })
                  }
                >
                  <div className="card-badge">View Quiz Details</div>
                  <h4>{quiz.quizTitle}</h4>
                  <p>{quiz.quizSynopsis}</p>
                  <div className="card-footer">
                    <span className="card-stats">
                      <FaClock /> {new Date(quiz.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>You haven't created any quizzes yet. Create your first quiz!</p>
                <button onClick={() => navigate("/Quizzes")}>Create Quiz</button>
              </div>
            )}
          </div>
        </div>

        {/* Recent Flashcards Section */}
        <div className="recent-flashcards-section">
          <div className="section-header">
            <h3>
              <FaUser className="section-icon" /> Your Recent Flashcards
            </h3>
            <button
              className="add-flashcard-button"
              onClick={() => navigate("/Dashboard/flashcards")}
              aria-label="Create new flashcard set"
            >
              <FaPlus style={{ color: "white", fontSize: "14px" }} />
            </button>
          </div>
          <div className="flashcards-grid scrollable">
            {recentUserFlashcards.length > 0 ? (
              recentUserFlashcards.map((flashcard) => (
                <div
                  key={flashcard.id}
                  className="flashcard-card"
                  onClick={() => handleFlashcardClick(flashcard)}
                >
                  <div className="card-badge">Your Set</div>
                  <h4>{flashcard.name}</h4>
                  <p>{flashcard.description}</p>
                  <div className="card-footer">
                    <span className="card-stats">
                      <FaClock /> {new Date(flashcard.createdAt || Date.now()).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>You haven't created any flashcard sets yet. Create your first set!</p>
                <button onClick={() => navigate("/Dashboard/flashcards")}>
                  Create Flashcards
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="games-section">
          <h3>
            <FaGamepad className="section-icon" /> Games
          </h3>
          <div className="games-grid">
            {games.map((game, index) => (
              <div
                key={index}
                className="game-card"
                onClick={() => navigate(game.path)}
              >
                <div className="game-image-container">
                  <img src={game.image} alt={game.name} className="game-image" />
                  <div className="game-overlay">
                    <button className="play-button">Play Now</button>
                  </div>
                </div>
                <h4>{game.name}</h4>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
