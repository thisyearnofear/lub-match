import { useState, useEffect } from 'react';

interface GameLoadingStatesProps {
  cid: string;
  onRetry: () => void;
}

export default function GameLoadingStates({ cid, onRetry }: GameLoadingStatesProps) {
  const [stage, setStage] = useState<'preparing' | 'fetching' | 'almostReady' | 'failed'>('preparing');
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    // Stage progression for better UX
    const stageTimer = setTimeout(() => setStage('fetching'), 2000);
    const almostReadyTimer = setTimeout(() => setStage('almostReady'), 15000);
    const failedTimer = setTimeout(() => setStage('failed'), 45000);

    return () => {
      clearInterval(timer);
      clearTimeout(stageTimer);
      clearTimeout(almostReadyTimer);
      clearTimeout(failedTimer);
    };
  }, []);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  };

  if (stage === 'preparing') {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="bg-white rounded-2xl shadow-2xl px-10 py-16 max-w-lg text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Game Created! 🎉</h2>
            <p className="text-lg text-gray-600">
              Your Valentine's memory game is being prepared...
            </p>
          </div>
          
          <div className="flex items-center justify-center space-x-2 mb-6">
            <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          
          <p className="text-sm text-gray-500">
            Setting up your personalized game experience...
          </p>
        </div>
      </main>
    );
  }

  if (stage === 'fetching') {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="bg-white rounded-2xl shadow-2xl px-10 py-16 max-w-lg text-center">
          <div className="mb-6">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-pink-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-pink-500 rounded-full border-t-transparent animate-spin"></div>
              <div className="absolute inset-4 bg-pink-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">💝</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Almost Ready!</h2>
            <p className="text-gray-600 mb-4">
              We're fetching your game from our secure network. This usually takes 10-30 seconds.
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Loading progress</span>
              <span className="text-sm font-medium text-pink-600">{formatTime(timeElapsed)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min((timeElapsed / 30) * 100, 90)}%` }}
              ></div>
            </div>
          </div>
          
          <p className="text-xs text-gray-400">
            Game ID: {cid.slice(0, 8)}...{cid.slice(-6)}
          </p>
        </div>
      </main>
    );
  }

  if (stage === 'almostReady') {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="bg-white rounded-2xl shadow-2xl px-10 py-16 max-w-lg text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <span className="text-2xl">⏳</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Just a Few More Seconds...</h2>
            <p className="text-gray-600 mb-4">
              Your game is almost ready! Sometimes our network needs a little extra time to sync everything perfectly.
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 mb-6 border border-yellow-200">
            <p className="text-sm text-yellow-800">
              <strong>Good news:</strong> Your game was created successfully! We're just making sure everything loads perfectly for your special someone. 💕
            </p>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">Time elapsed: {formatTime(timeElapsed)}</p>
            <div className="flex justify-center space-x-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-pink-400 rounded-full animate-pulse"
                  style={{ animationDelay: `${i * 0.2}s` }}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Failed state
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="bg-white rounded-2xl shadow-2xl px-10 py-16 max-w-lg text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Taking Longer Than Expected</h2>
          <p className="text-gray-600 mb-6">
            Don't worry! Your game was created successfully, but our network is being a bit slow today.
          </p>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={onRetry}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
          >
            Try Loading Again
          </button>
          
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">Or</p>
            <a 
              href="/create" 
              className="text-pink-600 hover:text-pink-700 font-medium underline"
            >
              Create a new game instead
            </a>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Time waited: {formatTime(timeElapsed)} • Game ID: {cid.slice(0, 8)}...{cid.slice(-6)}
          </p>
        </div>
      </div>
    </main>
  );
}
