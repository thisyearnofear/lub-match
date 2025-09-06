"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  FarcasterUser,
  SocialUser,
  UsernameGuessingGame,
  UsernameGuessingResult,
} from "@/types/socialGames";
import { SocialGameUsernameButton } from "@/components/shared/UsernameButton";
import { SocialGameProfileLink } from "@/components/shared/ProfileLinkButton";

interface UsernameGuessingGameProps {
  game: UsernameGuessingGame;
  onGameComplete: (result: UsernameGuessingResult) => void;
  onExit: () => void;
}

interface QuestionData {
  user: SocialUser;
  options: string[];
  userGuess?: string;
  isCorrect?: boolean;
  timeSpent?: number;
}

export default function UsernameGuessingGameComponent({
  game,
  onGameComplete,
  onExit,
}: UsernameGuessingGameProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [waitingForNext, setWaitingForNext] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [gameStartTime] = useState(Date.now());
  const [score, setScore] = useState(0);

  // Initialize questions
  useEffect(() => {
    const gameQuestions: QuestionData[] = game.users.map((user) => {
      const correctAnswer = user.username;
      const wrongAnswers = game.options
        .filter((option) => option !== correctAnswer)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      const shuffledOptions = [correctAnswer, ...wrongAnswers].sort(
        () => Math.random() - 0.5
      );

      return {
        user,
        options: shuffledOptions,
      };
    });

    setQuestions(gameQuestions);
    setQuestionStartTime(Date.now());
  }, [game]);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const handleAnswerSelect = useCallback(
    (answer: string) => {
      if (selectedAnswer) return; // Prevent multiple selections

      setSelectedAnswer(answer);

      const timeSpent = (Date.now() - questionStartTime) / 1000;
      const isCorrect = answer === currentQuestion.user.username;

      // Update question data
      const updatedQuestions = [...questions];
      updatedQuestions[currentQuestionIndex] = {
        ...currentQuestion,
        userGuess: answer,
        isCorrect,
        timeSpent,
      };
      setQuestions(updatedQuestions);

      if (isCorrect) {
        setScore((prev) => prev + 1);
      }

      setShowResult(true);

      // Wait for user to decide to continue instead of auto-advancing
      setWaitingForNext(true);
    },
    [
      selectedAnswer,
      currentQuestion,
      questions,
      currentQuestionIndex,
      isLastQuestion,
      questionStartTime,
    ]
  );

  const nextQuestion = () => {
    setCurrentQuestionIndex((prev) => prev + 1);
    setSelectedAnswer(null);
    setShowResult(false);
    setWaitingForNext(false);
    setQuestionStartTime(Date.now());
  };

  const handleNextClick = () => {
    if (isLastQuestion) {
      completeGame(questions);
    } else {
      nextQuestion();
    }
  };

  const completeGame = async (finalQuestions: QuestionData[]) => {
    const totalTime = (Date.now() - gameStartTime) / 1000;
    const correctGuesses = finalQuestions.filter((q) => q.isCorrect).length;
    const accuracy = (correctGuesses / finalQuestions.length) * 100;

    // Calculate score: 100 points per correct answer
    const score = correctGuesses * 100;
    const maxScore = finalQuestions.length * 100;

    const result: UsernameGuessingResult = {
      gameId: game.id,
      playerId: `player-${Date.now()}`, // Simple player ID
      score,
      maxScore,
      accuracy,
      timeSpent: totalTime,
      completedAt: new Date(),
      gameData: {
        correctGuesses,
        totalQuestions: finalQuestions.length,
        questionsData: finalQuestions.map((q) => ({
          user: q.user,
          userGuess: q.userGuess!,
          correctAnswer: q.user.username,
          isCorrect: q.isCorrect!,
          timeSpent: q.timeSpent!,
        })),
      },
    };

    // No need to save separately - handled by parent component

    onGameComplete(result);
  };

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading game...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gradient-to-br from-purple-900 to-pink-900 rounded-2xl shadow-2xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-white">
          <h2 className="text-2xl font-bold">{game.name}</h2>
          <p className="text-purple-200">
            Question {currentQuestionIndex + 1} of {questions.length}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-white text-right">
            <div className="text-sm text-purple-200">Score</div>
            <div className="text-xl font-bold">
              {score}/{questions.length}
            </div>
          </div>
          <button
            onClick={onExit}
            className="text-purple-200 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-purple-800 rounded-full h-2 mb-8">
        <motion.div
          className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full"
          initial={{ width: 0 }}
          animate={{
            width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
          }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Question */}
      <div className="text-center mb-8">
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="relative w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden border-4 border-purple-400">
            <Image
              src={currentQuestion.user.pfpUrl}
              alt="Profile"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <h3 className="text-xl text-white font-semibold">
            What's this user's username?
          </h3>
          {currentQuestion.user.bio && (
            <p className="text-purple-200 text-sm mt-2 max-w-md mx-auto">
              "{currentQuestion.user.bio}"
            </p>
          )}
        </motion.div>

        {/* Answer Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-lg mx-auto">
          <AnimatePresence>
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === option;
              const isCorrect = option === currentQuestion.user.username;

              return (
                <motion.div
                  key={option}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <SocialGameUsernameButton
                    username={option}
                    onClick={() => handleAnswerSelect(option)}
                    disabled={selectedAnswer !== null}
                    isCorrect={isCorrect}
                    isSelected={isSelected}
                    showResult={showResult}
                    animate={false} // We handle animation with the wrapper
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Result Feedback with Profile Connection */}
        <AnimatePresence>
          {showResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 space-y-4"
            >
              {selectedAnswer === currentQuestion.user.username ? (
                <div className="text-center">
                  <div className="text-green-400 font-semibold mb-3">
                    🎉 Correct! Great job!
                  </div>
                  <div className="text-purple-200 text-sm mb-3">
                    Want to connect with this user?
                  </div>
                  <div className="flex justify-center">
                    <SocialGameProfileLink
                      user={currentQuestion.user}
                      isCorrectAnswer={true}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-red-400 font-semibold mb-3">
                    ❌ Incorrect. The answer was @
                    {currentQuestion.user.username}
                  </div>
                  <div className="text-purple-200 text-sm mb-3">
                    Learn more about this user:
                  </div>
                  <div className="flex justify-center">
                    <SocialGameProfileLink
                      user={currentQuestion.user}
                      isCorrectAnswer={false}
                    />
                  </div>
                </div>
              )}

              {/* Next/Finish Button */}
              {waitingForNext && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex justify-center mt-4"
                >
                  <button
                    onClick={handleNextClick}
                    className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105"
                  >
                    {isLastQuestion ? "Finish Game 🏁" : "Next Question →"}
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
