import { useCallback } from 'react';

interface UseSuccessActionsOptions {
  onReset?: () => void;
}

interface SuccessAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: string;
}

/**
 * Shared hook for success actions across different game creation flows
 */
export function useSuccessActions({ onReset }: UseSuccessActionsOptions = {}) {
  const getGameCreationSuccessActions = useCallback(
    (gameId?: string): SuccessAction[] => {
      const actions: SuccessAction[] = [];

      if (gameId) {
        actions.push({
          label: 'Play Game',
          onClick: () => {
            window.location.href = `/game/${gameId}`;
          },
          variant: 'primary'
        });

        actions.push({
          label: 'Share Game',
          onClick: () => {
            const shareUrl = `${window.location.origin}/game/${gameId}`;
            if (navigator.share) {
              navigator.share({
                title: 'Check out my memory game!',
                url: shareUrl
              });
            } else {
              navigator.clipboard.writeText(shareUrl);
            }
          },
          variant: 'secondary'
        });
      }

      if (onReset) {
        actions.push({
          label: 'Create Another',
          onClick: onReset,
          variant: 'ghost'
        });
      }

      return actions;
    },
    [onReset]
  );

  const getErrorRecoveryActions = useCallback(
    (onRetryOrError?: (() => void) | string): SuccessAction[] => {
      const actions: SuccessAction[] = [];
      
      // Determine if the parameter is a callback or error string
      const isCallback = typeof onRetryOrError === 'function';
      const onRetry = isCallback ? onRetryOrError : undefined;

      // Retry action - use custom callback if provided, otherwise reload
      actions.push({
        label: 'Try Again',
        onClick: onRetry || (() => {
          window.location.reload();
        }),
        variant: 'primary'
      });

      // Go back action
      actions.push({
        label: 'Go Back',
        onClick: () => {
          if (window.history.length > 1) {
            window.history.back();
          } else {
            window.location.href = '/';
          }
        },
        variant: 'secondary'
      });

      return actions;
    },
    []
  );

  const getSocialGameSuccessActions = useCallback(
    (onPlayAgain?: () => void, onShare?: () => void): SuccessAction[] => {
      const actions: SuccessAction[] = [];

      actions.push({
        label: 'Play Again',
        onClick: onPlayAgain || (() => {
          window.location.reload();
        }),
        variant: 'primary'
      });

      actions.push({
        label: 'Share Results',
        onClick: onShare || (() => {
          if (navigator.share) {
            navigator.share({
              title: 'Check out my social game results!',
              text: `I just played a fun social memory game!`,
              url: window.location.href
            });
          } else {
            navigator.clipboard.writeText(window.location.href);
          }
        }),
        variant: 'secondary'
      });

      return actions;
    },
    []
  );

  const getChallengeSuccessActions = useCallback(
    (
      challenge?: any, 
      success?: boolean, 
      totalReward?: number, 
      viralDetected?: boolean, 
      onNewChallenge?: () => void, 
      onRetry?: () => void
    ): SuccessAction[] => {
      const actions: SuccessAction[] = [];

      if (success) {
        actions.push({
          label: 'New Challenge',
          onClick: onNewChallenge || (() => {
            window.location.reload();
          }),
          variant: 'primary'
        });
      } else {
        actions.push({
          label: 'Try Again',
          onClick: onRetry || (() => {
            window.location.reload();
          }),
          variant: 'primary'
        });
      }

      actions.push({
        label: 'Share Achievement',
        onClick: () => {
          const text = success 
            ? `I just completed a social challenge${totalReward ? ` and earned ${totalReward} LUB!` : '!'}` 
            : `I attempted a social challenge!`;
          
          if (navigator.share) {
            navigator.share({
              title: 'Social Challenge',
              text,
              url: window.location.href
            });
          } else {
            navigator.clipboard.writeText(window.location.href);
          }
        },
        variant: 'secondary'
      });

      return actions;
    },
    []
  );

  return {
    getGameCreationSuccessActions,
    getErrorRecoveryActions,
    getSocialGameSuccessActions,
    getChallengeSuccessActions
  };
}
