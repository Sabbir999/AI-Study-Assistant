import React, { useEffect, useState, useCallback, useMemo } from "react";
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

// Skeleton Loading Component
const SkeletonCard = () => (
  <div className="skeleton-card">
    <div className="skeleton-line skeleton-title"></div>
    <div className="skeleton-line skeleton-text"></div>
    <div className="skeleton-line skeleton-text short"></div>
  </div>
);

// Enhanced Empty State Component
const EmptyState = ({ message, buttonText, onAction, icon: Icon }) => (
  <div className="empty-state enhanced">
    {Icon && <Icon className="empty-state-icon" />}
    <p>{message}</p>
    <button onClick={onAction} className="cta-button">
      {buttonText}
    </button>
  </div>
);

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

  const motivationalMessages = useMemo(() => [
    "Knowledge is power! Let's unlock your potential.",
    "Every question you answer brings you closer to mastery!",
    "You're doing amazing! Keep up the great work!",
    "Progress, not perfection. Every step counts!",
    "Your brain is a muscle - keep exercising it!",
    "Take a deep breath. You've got this!",
    "Celebrate every small victory along the way!",
    "Learning is a journey. Enjoy the process!",
  ], []);

  // Memoized time-based calculations
  const { greeting, messages } = useMemo(() => {
    const hour = new Date().getHours();
    const baseMessages = [...motivationalMessages];

    if (hour >= 1 && hour < 5) {
      baseMessages.push(
        "It's late! Remember to rest when you need to.",
        "Quality learning requires quality rest!",
        "Your health is important - consider taking a break soon."
      );
    } else if (hour >= 5 && hour < 12) {
      baseMessages.unshift(
        "Good morning! Fresh start for new achievements!",
        "Rise and shine! Perfect time to learn something new!"
      );
    } else if (hour >= 12 && hour < 17) {
      baseMessages.unshift(
        "Afternoon power! Let's conquer those challenges!",
        "You're in the zone! Keep that momentum going!"
      );
    } else {
      baseMessages.unshift(
        "Evening dedication! Proud of your commitment!",
        "Great work today! Finish strong!"
      );
    }

    const getTimeBasedGreeting = (hour) => {
      if (hour >= 5 && hour < 12) return "Good morning";
      if (hour >= 12 && hour < 17) return "Good afternoon";
      if (hour >= 17 && hour < 21) return "Good evening";
      return "Late night studies? Remember to rest";
    };

    return {
      greeting: getTimeBasedGreeting(hour),
      messages: baseMessages
    };
  }, [motivationalMessages]);

  // Enhanced fetch with retry logic
  const fetchWithRetry = useCallback(async (fetchFunction, maxRetries = 2) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fetchFunction();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }, []);

  // Optimized fetch functions
  const fetchPopularQuizzes = useCallback(async () => {
    return fetchWithRetry(async () => {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const dbRef = ref(database, "quizzes");
      const snapshot = await get(dbRef);
      
      if (!snapshot.exists()) {
        setPopularQuizzes([]);
        return;
      }

      const quizzesData = snapshot.val();
      const quizzesArray = Object.keys(quizzesData).map((key) => ({
        id: key,
        ...quizzesData[key],
      }));

      const recentQuizzes = quizzesArray.filter((quiz) => {
        const createdAt = quiz.createdAt ? new Date(quiz.createdAt).getTime() : 0;
        return createdAt >= twoWeeksAgo.getTime();
      });

      const sortedQuizzes = recentQuizzes
        .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
        .slice(0, 5);
      
      setPopularQuizzes(sortedQuizzes);
    });
  }, [fetchWithRetry]);

  const fetchPopularFlashcards = useCallback(async () => {
    return fetchWithRetry(async () => {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const dbRef = ref(database, "flashcards");
      const snapshot = await get(dbRef);
      
      if (!snapshot.exists()) {
        setPopularFlashcards([]);
        return;
      }

      const flashcardsData = snapshot.val();
      const flashcardsArray = Object.keys(flashcardsData).map((key) => ({
        id: key,
        ...flashcardsData[key],
      }));

      const recentFlashcards = flashcardsArray.filter((flashcard) => {
        const createdAt = flashcard.createdAt ? new Date(flashcard.createdAt).getTime() : 0;
        return createdAt >= twoWeeksAgo.getTime();
      });

      const sortedFlashcards = recentFlashcards
        .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
        .slice(0, 5);
      
      setPopularFlashcards(sortedFlashcards);
    });
  }, [fetchWithRetry]);

  const fetchRecentUserQuizzes = useCallback(async (userId) => {
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
  }, []);

  const fetchRecentUserFlashcards = useCallback(async (userId) => {
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
  }, []);

  const fetchLeaderboardData = useCallback(async () => {
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
        // Your existing leaderboard logic here
        // Keep your current leaderboard implementation
      }
    } catch (error) {
      console.error("Error fetching leaderboard data:", error);
    }
  }, []);

  // Performance tracking
  const trackDashboardLoad = useCallback((loadTime, success = true) => {
    console.log(`Dashboard loaded in ${loadTime}ms - Success: ${success}`);
  }, []);

  // Optimized data loading
  const loadUserData = useCallback(async (userId) => {
    const startTime = performance.now();
    
    try {
      setLoading(true);
      setError(null);
      
      await Promise.allSettled([
        fetchPopularQuizzes(),
        fetchPopularFlashcards(),
        fetchRecentUserQuizzes(userId),
        fetchRecentUserFlashcards(userId),
        fetchLeaderboardData()
      ]);
      
      const loadTime = performance.now() - startTime;
      trackDashboardLoad(loadTime, true);
    } catch (error) {
      console.error("Error loading user data:", error);
      const loadTime = performance.now() - startTime;
      trackDashboardLoad(loadTime, false);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [
    fetchPopularQuizzes, 
    fetchPopularFlashcards, 
    fetchRecentUserQuizzes, 
    fetchRecentUserFlashcards, 
    fetchLeaderboardData, 
    trackDashboardLoad
  ]);

  // Optimized navigation handlers
  const handleQuizClick = useCallback((quiz) => {
    navigate(`/quizzesdetails/${quiz.id}`, { state: { quiz } });
  }, [navigate]);

  const handleFlashcardClick = useCallback((flashcard) => {
    navigate(`/Dashboard/flashcards/${flashcard.id}`, { state: { flashcard } });
  }, [navigate]);

  // Memoized games data
  const games = useMemo(() => [
    { 
      name: "Vocab Quiz", 
      image: require("../mainpages/vocabulary.png"),
      path: "/VocabQuiz" 
    },
    { name: "Guess the Country Flag", image: CountryFlagImage, path: "/Country" },
    { name: "Category Sorting", image: CategorySortingImage, path: "/CategorySortingGame" },
    { name: "Fact or Caps", image: TrueFalseImage, path: "/FactGame" },
  ], []);

  // Optimized authentication effect
  useEffect(() => {
    const auth = getAuth();
    let mounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!mounted) return;
      
      if (user) {
        setUser(user);
        setDynamicGreeting(greeting);
        try {
          await loadUserData(user.uid);
        } catch (error) {
          if (mounted) setError("Failed to load user data");
        }
      } else {
        setLoading(false);
        navigate("/login");
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [navigate, loadUserData, greeting]);

  // Optimized message rotation effect
  useEffect(() => {
    let isMounted = true;
    let messageInterval;

    const setupMessages = () => {
      if (isMounted) {
        setDynamicMessage(messages[messageIndex]);
      }
      
      messageInterval = setInterval(() => {
        if (isMounted) {
          setMessageIndex(prev => (prev + 1) % messages.length);
        }
      }, 8000);
    };

    setupMessages();

    return () => {
      isMounted = false;
      clearInterval(messageInterval);
    };
  }, [messageIndex, messages]);

  // Enhanced loading state with skeleton
  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header skeleton">
          <div className="skeleton-line wide"></div>
          <div className="skeleton-line medium"></div>
        </div>
        
        <div className="dashboard-bottom-section">
          <div className="recent-quizzes-section">
            <div className="section-header skeleton">
              <div className="skeleton-line"></div>
            </div>
            <div className="quizzes-grid">
              {[...Array(3)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>
          
          <div className="recent-flashcards-section">
            <div className="section-header skeleton">
              <div className="skeleton-line"></div>
            </div>
            <div className="flashcards-grid">
              {[...Array(3)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <h3>Error Loading Dashboard</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="retry-button">
          Try Again
        </button>
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
                  onClick={() => handleQuizClick(quiz)}
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
              <EmptyState
                message="You haven't created any quizzes yet. Create your first quiz!"
                buttonText="Create Quiz"
                onAction={() => navigate("/Quizzes")}
                icon={FaBook}
              />
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
              <EmptyState
                message="You haven't created any flashcard sets yet. Create your first set!"
                buttonText="Create Flashcards"
                onAction={() => navigate("/Dashboard/flashcards")}
                icon={FaStickyNote}
              />
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