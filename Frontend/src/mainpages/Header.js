import React, { useContext, useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaSearch,
  FaHome,
  FaLayerGroup,
  FaLightbulb,
  FaClipboardList,
  FaStickyNote,
  FaHistory,
  FaGamepad,
  FaCalendarCheck,
  FaSignOutAlt,
  FaAngleDown,
  FaUserCog,
  FaClock,
  FaTimes,
} from "react-icons/fa";
import "./Header.css";
import { ProfilePictureNameChange } from "./ProfilePictureNameChange";
import SearchResults from "./SearchResults";
import { auth, database } from "../config/firebase";
import { ref, onValue } from "firebase/database";
import TimerModal from "./TimerModal";

const GAMES = [
  {
    id: "category-sorting",
    name: "Category Sorting",
    type: "game",
    description: "Sort items into their correct categories",
    path: "/CategorySortingGame",
  },
  {
    id: "country-flags",
    name: "Guess the Country Flag",
    type: "game",
    description: "Test your knowledge of country flags",
    path: "/Country",
  },
  {
    id: "crossword",
    name: "CrossWord Puzzle",
    type: "game",
    description: "Classic crossword puzzle game",
    path: "/CrossWord",
  },
  {
    id: "uno",
    name: "UNO",
    type: "game",
    description: "Play the classic UNO card game",
    path: "/UNO",
  },
];

const NAVIGATION_ITEMS = [
  {
    id: "dashboard",
    icon: <FaHome className="nav-icon" />,
    label: "Dashboard",
    path: "/Dashboard",
    standalone: true,
  },
  {
    id: "flashcards",
    icon: <FaLayerGroup className="nav-icon" />,
    label: "Flashcards",
    path: "/Dashboard/flashcards",
    standalone: true,
  },
  {
    id: "quiz",
    icon: <FaClipboardList className="nav-icon" />,
    label: "Quiz",
    dropdown: [
      {
        icon: <FaClipboardList className="dropdown-icon" />,
        label: "Quizzes",
        path: "/Quizzes",
      },
      {
        icon: <FaStickyNote className="dropdown-icon" />,
        label: "Notes",
        path: "/QuizNotes",
      },
      {
        icon: <FaHistory className="dropdown-icon" />,
        label: "Quiz History",
        path: "/QuizHistory",
      },
    ],
  },
  {
    id: "summarizer",
    icon: <FaLightbulb className="nav-icon" />,
    label: "Summarizer",
    path: "/Dashboard/summarizer",
    standalone: true,
  },
  {
    id: "game",
    icon: <FaGamepad className="nav-icon" />,
    label: "Game",
    path: "/Games",
    standalone: true,
  },
  {
    id: "planner",
    icon: <FaCalendarCheck className="nav-icon" />,
    label: "Study Planner",
    path: "/StudyPlanner",
    standalone: true,
  },
  {
    id: "timer",
    icon: <FaClock className="nav-icon" />,
    label: "Timer",
    action: "toggleTimerModal",
    standalone: true,
  },
];

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userData, profilePicture } = useContext(ProfilePictureNameChange);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [allFlashcards, setAllFlashcards] = useState([]);
  const [allQuizzes, setAllQuizzes] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const searchRef = useRef(null);
  const dropdownContainerRef = useRef(null);
  const timerRef = useRef(null);

  // Firebase data fetching
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        setAllFlashcards([]);
        setAllQuizzes([]);
        return;
      }

      const flashcardsRef = ref(database, `users/${user.uid}/flashcard-lists`);
      const quizzesRef = ref(database, `users/${user.uid}/quizResults`);

      const unsubscribeFlashcards = onValue(flashcardsRef, (snapshot) => {
        const data = snapshot.val();
        setAllFlashcards(data ? Object.values(data) : []);
      });

      const unsubscribeQuizzes = onValue(quizzesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const quizzes = Object.entries(data).map(([key, value]) => ({
            ...value,
            id: key,
          }));
          setAllQuizzes(quizzes);
        } else {
          setAllQuizzes([]);
        }
      });

      return () => {
        unsubscribeFlashcards();
        unsubscribeQuizzes();
      };
    });

    return () => unsubscribeAuth();
  }, []);

  // Event listeners for outside clicks
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownContainerRef.current && !dropdownContainerRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle body scroll lock when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  // Timer persistence
  useEffect(() => {
    const savedTimer = localStorage.getItem('studyTimer');
    if (!savedTimer) return;

    const timerData = JSON.parse(savedTimer);
    const currentTime = Date.now();
    
    if (timerData.endTime > currentTime) {
      setTimeRemaining(Math.floor((timerData.endTime - currentTime) / 1000));
      setTimerActive(true);
    } else if (timerData.active) {
      handleTimerExpiration();
    }
  }, []);

  // Timer countdown
  useEffect(() => {
    if (timerActive && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleTimerCompletion();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerActive, timeRemaining]);

  const handleTimerCompletion = () => {
    clearInterval(timerRef.current);
    setTimerActive(false);
    localStorage.removeItem('studyTimer');
    
    // Play sound notification
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(e => console.log('Audio play error:', e));
    
    // Show browser notification
    if (Notification.permission === 'granted') {
      new Notification('Study Timer', { body: 'Your timer has expired!' });
    }
  };

  const handleTimerExpiration = () => {
    setTimeRemaining(0);
    setTimerActive(false);
    localStorage.removeItem('studyTimer');
    
    if (Notification.permission === 'granted') {
      new Notification('Study Timer', { body: 'Your timer has expired!' });
    }
  };

  const startTimer = (hours, minutes, seconds) => {
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    if (totalSeconds <= 0) return;
    
    setTimeRemaining(totalSeconds);
    setTimerActive(true);
    setShowTimerModal(false);
    
    const endTime = Date.now() + totalSeconds * 1000;
    localStorage.setItem('studyTimer', JSON.stringify({
      endTime,
      active: true,
      duration: totalSeconds
    }));
    
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  };

  const cancelTimer = () => {
    clearInterval(timerRef.current);
    setTimerActive(false);
    setTimeRemaining(0);
    localStorage.removeItem('studyTimer');
  };

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);

    if (term.trim() === "") {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const filteredFlashcards = allFlashcards
      .map((list) => ({ ...list, type: "flashcard" }))
      .filter((list) =>
        list.name.toLowerCase().includes(term) ||
        (list.description && list.description.toLowerCase().includes(term))
      );

    const filteredQuizzes = allQuizzes
      .filter((quiz) => (quiz.quizTitle || "").toLowerCase().includes(term))
      .map((quiz) => ({
        ...quiz,
        type: "quiz",
        name: quiz.quizTitle || "Untitled Quiz",
      }));

    const filteredGames = GAMES.filter((game) =>
      game.name.toLowerCase().includes(term) ||
      game.description.toLowerCase().includes(term)
    );

    const combinedResults = [
      ...filteredFlashcards,
      ...filteredQuizzes,
      ...filteredGames,
    ].sort((a, b) => {
      const dateA = new Date(a.timestamp || 0);
      const dateB = new Date(b.timestamp || 0);
      return dateB - dateA;
    });

    setSearchResults(combinedResults);
    setShowResults(true);
  };

  const getInitials = (name) => {
    if (!name) return "";
    const names = name.split(" ");
    let initials = names[0].substring(0, 1).toUpperCase();
    if (names.length > 1) {
      initials += names[names.length - 1].substring(0, 1).toUpperCase();
    }
    return initials;
  };

  const toggleDropdown = (id) => {
    setActiveDropdown(activeDropdown === id ? null : id);
  };

  const handleNavigation = (item) => {
    if (item.action === "toggleTimerModal") {
      setShowTimerModal(true);
    } else if (item.path) {
      navigate(item.path);
    }
    setActiveDropdown(null);
    setMobileMenuOpen(false);
  };

  const navigateToSettings = () => {
    navigate("/Settings");
    setActiveDropdown(null);
    setMobileMenuOpen(false);
  };

  const navigateToLogout = () => {
    navigate("/Logout");
    setActiveDropdown(null);
    setMobileMenuOpen(false);
  };

  return (
    <div ref={dropdownContainerRef}>
      {/* Mobile menu overlay */}
      <div 
        className={`mobile-menu-overlay ${mobileMenuOpen ? 'active' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      <header className="headerdashboard-header">
        {/* Mobile menu button */}
        <button 
          className={`mobile-menu-button ${mobileMenuOpen ? 'active' : ''}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <div className="hamburger-icon">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </button>

        <div className="headerdashboard-brand">
          <button
            className="headerdashboard-brand-button"
            onClick={() => navigate("/Dashboard")}
          >
            StudyAI
          </button>
        </div>

        <nav className={`navigation-menu ${mobileMenuOpen ? 'active' : ''}`}>
          {NAVIGATION_ITEMS.map((item) => (
            <div key={item.id} className="nav-item-container">
              {item.standalone ? (
                <button
                  className="nav-item"
                  onClick={() => handleNavigation(item)}
                >
                  {item.icon}
                  <span className="nav-label">{item.label}</span>
                  {item.id === "timer" && timerActive && (
                    <span className="timer-display">
                      {formatTime(timeRemaining)}
                    </span>
                  )}
                </button>
              ) : (
                <div className="dropdown-container">
                  <button
                    className={`nav-item ${activeDropdown === item.id ? "active" : ""}`}
                    onClick={() => toggleDropdown(item.id)}
                  >
                    {item.icon}
                    <span className="nav-label">{item.label}</span>
                    <FaAngleDown
                      className={`dropdown-arrow ${activeDropdown === item.id ? "rotated" : ""}`}
                    />
                  </button>
                  {activeDropdown === item.id && item.dropdown && (
                    <div className="dropdown-menu">
                      {item.dropdown.map((dropItem, idx) => (
                        <button
                          key={idx}
                          className="dropdown-item"
                          onClick={() => {
                            navigate(dropItem.path);
                            setActiveDropdown(null);
                            setMobileMenuOpen(false);
                          }}
                        >
                          {dropItem.icon}
                          <span>{dropItem.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Mobile Profile Section */}
          <div className="mobile-profile-section">
            <div className="mobile-profile-info">
              <div className="mobile-profile-picture">
                {profilePicture ? (
                  <img src={profilePicture} alt="Profile" />
                ) : (
                  <div className="mobile-profile-initial">
                    {getInitials(userData?.name || "")}
                  </div>
                )}
              </div>
              <div className="mobile-profile-name">
                {userData?.name || "User"}
              </div>
            </div>
            <div className="mobile-profile-actions">
              <button className="dropdown-item" onClick={navigateToSettings}>
                <FaUserCog className="dropdown-icon" />
                <span>Settings</span>
              </button>
              <button className="dropdown-item logout" onClick={navigateToLogout}>
                <FaSignOutAlt className="dropdown-icon" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </nav>

        <div className="header-right">
          {timerActive && (
            <div className="active-timer">
              <span className="timer-countdown">{formatTime(timeRemaining)}</span>
              <button className="cancel-timer-btn" onClick={cancelTimer}>
                <FaTimes />
              </button>
            </div>
          )}
          
          {location.pathname === "/Dashboard" && (
            <div className="mainHeaderSearchBar" ref={searchRef}>
              <input
                type="text"
                className="mainHeaderSearch"
                placeholder="Search..."
                value={searchTerm}
                onChange={handleSearch}
                onFocus={() => setShowResults(true)}
              />
              <FaSearch className="mainHeaderSearchicon" size={16} />
              {showResults && (
                <SearchResults
                  results={searchResults}
                  onClose={() => setShowResults(false)}
                />
              )}
            </div>
          )}

          <div className="profile-container">
            <div
              className="profilePictureMain"
              onClick={() => toggleDropdown("profile")}
            >
              {profilePicture ? (
                <img
                  src={profilePicture}
                  alt="Profile"
                  className="profile-picture"
                />
              ) : (
                <div className="profile-initial">
                  {getInitials(userData?.name || "")}
                </div>
              )}
            </div>

            {activeDropdown === "profile" && (
              <div className="profile-dropdown">
                <button className="dropdown-item" onClick={navigateToSettings}>
                  <FaUserCog className="dropdown-icon" />
                  <span>Settings</span>
                </button>
                <button className="dropdown-item logout" onClick={navigateToLogout}>
                  <FaSignOutAlt className="dropdown-icon" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      
      {showTimerModal && (
        <TimerModal 
          onClose={() => setShowTimerModal(false)}
          onStartTimer={startTimer}
        />
      )}
    </div>
  );
}

export default Header;