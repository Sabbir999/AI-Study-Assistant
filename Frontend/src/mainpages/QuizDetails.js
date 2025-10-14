import { useLocation, useNavigate } from "react-router-dom";
import { FaCheck, FaTimes, FaInfoCircle, FaArrowLeft } from "react-icons/fa";
import "./QuizDetails.css";

export default function QuizDetails() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const quiz = state?.quiz || state?.quizData;

  // Debug: Check what data we're receiving
  console.log('Quiz data received:', quiz);
  console.log('First question:', quiz?.questions?.[0]);

  // If there is no quiz data found in the location state, show error message
  if (!quiz) {
    return (
      <div className="quiz-error">
        <h2>Quiz Not Found</h2>
        <p>The quiz could not be loaded. Please try again.</p>
        <button
          onClick={() => navigate(-1)}
          className="quizdetailback-button"
        >
          <FaArrowLeft />
          Go Back
        </button>
      </div>
    );
  }

  // Function to determine the correct answer index
  const getCorrectAnswerIndex = (question) => {
    const rawValue = question.correctAnswer;

    // If it's already a number and valid
    if (typeof rawValue === "number" && question.answers[rawValue]) {
      return rawValue;
    }

    // Convert string to number
    const numericValue =
      typeof rawValue === "string" ? parseInt(rawValue, 10) : rawValue;

    // Handle 1-based indexing (1 = first answer, 2 = second answer, etc.)
    if (numericValue > 0 && question.answers[numericValue - 1]) {
      return numericValue - 1;
    }

    return 0;
  };

  return (
    <div className="quiz-detail-container">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="quizdetailback-button"
      >
        <FaArrowLeft />
        Back
      </button>

      {/* Quiz Header */}
      <div className="quiz-detail-header">
        <h1>{quiz.title || quiz.quizTitle || "Untitled Quiz"}</h1>
        {quiz.synopsis && (
          <p className="quiz-detail-synopsis">
            <FaInfoCircle className="info-icon" />
            <span>{quiz.synopsis}</span>
          </p>
        )}
      </div>

      {/* Questions Container */}
      <div className="quiz-detail-questions-container">
        {quiz.questions?.length > 0 ? (
          quiz.questions.map((question, qIndex) => {
            const correctAnswerIndex = getCorrectAnswerIndex(question);

            return (
              <div key={qIndex} className="quiz-detail-question-card">
                <h3 className="quiz-detail-question-title">
                  Question {qIndex + 1}: {question.questionText || question.question || "Question text not available"}
                </h3>

                {/* Answer Options */}
                <ul className="quiz-detail-answers-list">
                  {(question.answers || question.options || []).map((answer, aIndex) => {
                    const isCorrect = aIndex === correctAnswerIndex;
                    return (
                      <li
                        key={aIndex}
                        className={`quiz-detail-answer-item ${
                          isCorrect ? "quiz-detail-correct" : ""
                        }`}
                      >
                        <div className="quiz-detail-answer-marker">
                          {isCorrect ? (
                            <FaCheck className="quiz-detail-correct-icon" />
                          ) : (
                            <FaTimes className="quiz-detail-incorrect-icon" />
                          )}
                        </div>
                        <div className="quiz-detail-answer-content">
                          {answer}
                        </div>
                      </li>
                    );
                  })}
                </ul>

                {/* Explanation */}
                {question.explanation && (
                  <div className="quiz-detail-explanation-box">
                    <div className="quiz-detail-explanation-header">
                      <FaInfoCircle /> Explanation
                    </div>
                    <p>{question.explanation}</p>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="quiz-detail-no-questions">
            <p>This quiz does not have any questions yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}