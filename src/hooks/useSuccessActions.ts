"use client";

import { useCallback } from "react";
import { useAppNavigation } from "./useAppNavigation";
import { ShareHelpers, GameShareData, AchievementShareData } from "@/utils/shareHelpers";
import { SuccessAction } from "@/components/shared/SuccessScreen";
// NEW: Challenge sharing imports (ENHANCEMENT FIRST)
import { Challenge } from "@/services/challengeEngine";
import { ViralDetection } from "@/services/viralDetectionService";

interface UseSuccessActionsProps {
  onReset?: () => void;
}

export const useSuccessActions = ({ onReset }: UseSuccessActionsProps = {}) => {
  const navigation = useAppNavigation();

  // Common action creators
  const createPlayNowAction = useCallback((cid: string): SuccessAction => ({
    label: "Play Now",
    onClick: () => navigation.goToGame(cid, true),
    variant: "gradient-pink",
    icon: "🎮"
  }), [navigation]);

  const createShareGameAction = useCallback((gameData: GameShareData): SuccessAction => ({
    label: "Share on Farcaster",
    onClick: () => ShareHelpers.shareGame(gameData),
    variant: "gradient-purple",
    icon: "💝"
  }), []);

  const createShareAchievementAction = useCallback((achievementData: AchievementShareData): SuccessAction => ({
    label: "Share Achievement",
    onClick: () => ShareHelpers.shareAchievement(achievementData),
    variant: "gradient-purple",
    icon: "🎉"
  }), []);

  const createCreateAnotherAction = useCallback((): SuccessAction => ({
    label: "Create Another",
    onClick: () => {
      if (onReset) onReset();
      navigation.goToCreate();
    },
    variant: "gradient-green",
    icon: "✨"
  }), [navigation, onReset]);

  const createPlayDemoAction = useCallback((): SuccessAction => ({
    label: "Home Page",
    onClick: () => navigation.goHome(),
    variant: "gradient-blue",
    icon: "🏠"
  }), [navigation]);

  const createReturnHomeAction = useCallback((): SuccessAction => ({
    label: "Return Home",
    onClick: () => navigation.goHome(),
    variant: "secondary",
    icon: "←"
  }), [navigation]);

  const createBackToGameAction = useCallback((onClose: () => void): SuccessAction => ({
    label: "← Back to Game",
    onClick: onClose,
    variant: "secondary"
  }), []);

  const createViewTransactionAction = useCallback((txHash: string, network = "sepolia"): SuccessAction => ({
    label: "View on Explorer",
    onClick: () => {
      const explorerUrl = network === "sepolia" 
        ? `https://sepolia.arbiscan.io/tx/${txHash}`
        : `https://arbiscan.io/tx/${txHash}`;
      window.open(explorerUrl, '_blank');
    },
    variant: "gradient-blue",
    icon: "🔍"
  }), []);

  const createPlaySocialGamesAction = useCallback((): SuccessAction => ({
    label: "Play Social Games",
    onClick: () => navigation.goToSocialGames(),
    variant: "gradient-blue",
    icon: "🎮"
  }), [navigation]);

  const createViewLeaderboardAction = useCallback((onShowLeaderboard: () => void): SuccessAction => ({
    label: "View Leaderboard",
    onClick: onShowLeaderboard,
    variant: "secondary",
    icon: "🏆"
  }), []);

  const createViewCollectionAction = useCallback((onViewCollection: () => void): SuccessAction => ({
    label: "View in Collection",
    onClick: onViewCollection,
    variant: "gradient-purple",
    icon: "🖼️"
  }), []);

  const createViewNFTAction = useCallback((tokenId: string): SuccessAction => ({
    label: "View My NFT",
    onClick: () => {
      // This could open a detailed NFT view modal or navigate to NFT page
      console.log(`Viewing NFT ${tokenId}`);
    },
    variant: "gradient-purple",
    icon: "💎"
  }), []);

  const createAddToWalletAction = useCallback((tokenId: string, contractAddress: string): SuccessAction => ({
    label: "Add to Wallet",
    onClick: () => {
      // Add NFT to user's wallet (MetaMask, etc.)
      if (window.ethereum) {
        window.ethereum.request({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC721',
            options: {
              address: contractAddress,
              tokenId: tokenId,
            },
          },
        }).catch((error: any) => {
          console.error('Error adding NFT to wallet:', error);
        });
      }
    },
    variant: "gradient-blue",
    icon: "💰"
  }), []);

  const createShareNFTAction = useCallback((tokenId: string, gameData: GameShareData): SuccessAction => ({
    label: "Share My NFT",
    onClick: () => ShareHelpers.shareAchievement({
      type: 'nft_minted',
      details: `Just minted my heart as an NFT! Token #${tokenId}`,
      url: `${typeof window !== 'undefined' ? window.location.origin : ''}/game/${gameData.cid}`
    }),
    variant: "gradient-pink",
    icon: "💝"
  }), []);

  const createOpenSeaAction = useCallback((tokenId: string, contractAddress: string): SuccessAction => ({
    label: "View on OpenSea",
    onClick: () => {
      const openseaUrl = `https://testnets.opensea.io/assets/arbitrum-sepolia/${contractAddress}/${tokenId}`;
      window.open(openseaUrl, '_blank');
    },
    variant: "secondary",
    icon: "🌊"
  }), []);

  // NEW: Challenge-specific action creators (ENHANCEMENT FIRST)
  const createShareChallengeSuccessAction = useCallback((
    challenge: Challenge,
    success: boolean,
    reward: number,
    viralDetected?: boolean
  ): SuccessAction => ({
    label: viralDetected ? "Share Viral Success!" : "Share Challenge",
    onClick: () => {
      const whaleEmoji = challenge.targetUser.follower_count >= 10000 ? '🐋' :
                        challenge.targetUser.follower_count >= 5000 ? '🦈' :
                        challenge.targetUser.follower_count >= 1000 ? '🐟' : '';

      const shareText = success
        ? `🎯 Just completed a ${challenge.difficulty} challenge with @${challenge.targetUser.username}! ${whaleEmoji} Earned ${reward} $LUB ${viralDetected ? '🚀 (VIRAL!)' : ''} \n\nTry Lub Match challenges: ${window.location.origin}`
        : `💪 Attempted a challenge with @${challenge.targetUser.username}! ${whaleEmoji} The grind continues... \n\nJoin the challenge: ${window.location.origin}`;

      ShareHelpers.shareWithFallback({
        text: shareText,
        url: window.location.origin
      });
    },
    variant: viralDetected ? "gradient-pink" : success ? "gradient-purple" : "secondary",
    icon: viralDetected ? "🚀" : success ? "🎯" : "💪"
  }), []);

  const createShareViralDetectionAction = useCallback((detection: ViralDetection): SuccessAction => ({
    label: "Share Viral Moment",
    onClick: () => {
      const shareText = `🚀 My content just went viral on Lub Match! Earned ${detection.reward} $LUB for ${detection.detectionType.replace('_', ' ')} \n\n"${detection.castContent.substring(0, 100)}${detection.castContent.length > 100 ? '...' : ''}" \n\nJoin the viral fun: ${window.location.origin}`;

      ShareHelpers.shareWithFallback({
        text: shareText,
        url: window.location.origin
      });
    },
    variant: "gradient-pink",
    icon: "🚀"
  }), []);

  const createNewChallengeAction = useCallback((): SuccessAction => ({
    label: "New Challenge",
    onClick: () => navigation.goToSocialGames(),
    variant: "gradient-purple",
    icon: "🎯"
  }), [navigation]);

  const createWhaleHuntAction = useCallback((): SuccessAction => ({
    label: "Hunt Whales",
    onClick: () => navigation.goToSocialGames(), // Will open in whale hunting mode
    variant: "gradient-cyan",
    icon: "🐋"
  }), [navigation]);

  // Enhanced NFT mint success actions
  const getNFTMintSuccessActions = useCallback((
    txHash: string,
    gameData: GameShareData,
    onClose: () => void,
    onViewCollection?: () => void,
    tokenId?: string,
    contractAddress?: string
  ): SuccessAction[] => {
    const actions = [];
    
    // Primary actions - most important first
    if (tokenId) {
      actions.push(createShareNFTAction(tokenId, gameData));
    } else {
      actions.push(createShareAchievementAction({
        type: 'nft_minted',
        details: 'Check out my heart NFT!',
        url: `${typeof window !== 'undefined' ? window.location.origin : ''}/game/${gameData.cid}`
      }));
    }
    
    // Secondary actions
    if (onViewCollection) {
      actions.push(createViewCollectionAction(onViewCollection));
    }
    
    if (tokenId && contractAddress) {
      actions.push(createAddToWalletAction(tokenId, contractAddress));
    }
    
    // Utility actions
    actions.push(createViewTransactionAction(txHash));
    
    if (tokenId && contractAddress) {
      actions.push(createOpenSeaAction(tokenId, contractAddress));
    }
    
    // Navigation actions
    actions.push(
      createPlaySocialGamesAction(),
      createCreateAnotherAction()
    );
    
    return actions;
  }, [
    createShareNFTAction,
    createShareAchievementAction,
    createViewCollectionAction,
    createAddToWalletAction,
    createViewTransactionAction,
    createOpenSeaAction,
    createPlaySocialGamesAction,
    createCreateAnotherAction
  ]);

  const getGameCreationSuccessActions = useCallback((
    cid: string,
    onReset?: () => void
  ): SuccessAction[] => [
    createPlayNowAction(cid),
    createShareGameAction({ cid, type: 'heart' }),
    createCreateAnotherAction(),
    createReturnHomeAction()
  ], [createPlayNowAction, createShareGameAction, createCreateAnotherAction, createReturnHomeAction]);

  const getSocialGameSuccessActions = useCallback((
    onPlayAgain: () => void,
    onShowLeaderboard: () => void
  ): SuccessAction[] => [
    {
      label: "Play Again",
      onClick: onPlayAgain,
      variant: "gradient-pink",
      icon: "🎮"
    },
    createViewLeaderboardAction(onShowLeaderboard),
    createPlayDemoAction(),
    createCreateAnotherAction()
  ], [createViewLeaderboardAction, createPlayDemoAction, createCreateAnotherAction]);

  // NEW: Challenge success action combinations (ENHANCEMENT FIRST)
  const getChallengeSuccessActions = useCallback((
    challenge: Challenge,
    success: boolean,
    reward: number,
    viralDetected: boolean = false,
    onNewChallenge: () => void,
    onBackToMenu: () => void
  ): SuccessAction[] => {
    const actions = [];

    // Primary action - share the success
    actions.push(createShareChallengeSuccessAction(challenge, success, reward, viralDetected));

    if (success) {
      // Success-specific actions
      if (challenge.whaleMultiplier > 2) {
        actions.push(createWhaleHuntAction()); // More whale hunting
      } else {
        actions.push(createNewChallengeAction()); // Regular new challenge
      }
    } else {
      // Failure recovery actions
      actions.push({
        label: "Try Again",
        onClick: onNewChallenge,
        variant: "gradient-purple",
        icon: "🔄"
      });
    }

    // Secondary actions
    actions.push({
      label: "Back to Menu",
      onClick: onBackToMenu,
      variant: "secondary",
      icon: "🏠"
    });

    return actions;
  }, [createShareChallengeSuccessAction, createWhaleHuntAction, createNewChallengeAction]);

  const getViralDetectionActions = useCallback((
    detection: ViralDetection,
    onNewChallenge: () => void,
    onBackToMenu: () => void
  ): SuccessAction[] => [
    createShareViralDetectionAction(detection),
    createNewChallengeAction(),
    {
      label: "Back to Menu",
      onClick: onBackToMenu,
      variant: "secondary",
      icon: "🏠"
    }
  ], [createShareViralDetectionAction, createNewChallengeAction]);

  const getErrorRecoveryActions = useCallback((
    onRetry: () => void
  ): SuccessAction[] => [
    {
      label: "Try Again",
      onClick: onRetry,
      variant: "primary",
      icon: "🔄"
    },
    createPlayDemoAction(),
    createCreateAnotherAction(),
    createReturnHomeAction()
  ], [createPlayDemoAction, createCreateAnotherAction, createReturnHomeAction]);

  return {
    // Individual action creators
    createPlayNowAction,
    createShareGameAction,
    createShareAchievementAction,
    createCreateAnotherAction,
    createPlayDemoAction,
    createReturnHomeAction,
    createBackToGameAction,
    createViewTransactionAction,
    createPlaySocialGamesAction,
    createViewLeaderboardAction,
    createViewCollectionAction,
    createViewNFTAction,
    createAddToWalletAction,
    createShareNFTAction,
    createOpenSeaAction,
    
    // Preset combinations
    getNFTMintSuccessActions,
    getGameCreationSuccessActions,
    getSocialGameSuccessActions,
    getErrorRecoveryActions,

    // NEW: Challenge action combinations (ENHANCEMENT FIRST)
    getChallengeSuccessActions,
    getViralDetectionActions,
    createShareChallengeSuccessAction,
    createShareViralDetectionAction,
    createNewChallengeAction,
    createWhaleHuntAction
  };
};