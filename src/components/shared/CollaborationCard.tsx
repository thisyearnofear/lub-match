/**
 * Collaboration Card Component
 * ENHANCEMENT FIRST: Extends existing AnimatedTile and ActionButton patterns
 * CLEAN: Composable component with clear props interface
 * MODULAR: Reusable across different collaboration contexts
 * PERFORMANT: Leverages existing animation optimizations
 */

"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { SocialUser, CollaborationProfile, ExperienceTier } from "@/types/socialGames";
import { PlatformAdapter } from "@/utils/platformAdapter";
import { CollaborationService, CollaborationUtils } from "@/services/collaborationService";
import ActionButton, { ButtonVariant } from "./ActionButton";
import { AnimatedTile } from "./AnimatedTile";
import { useOptimizedAnimation } from "@/utils/animations";

interface CollaborationCardProps {
  user: SocialUser;
  currentUser?: SocialUser;
  variant?: "compact" | "full" | "suggestion";
  showCompatibilityScore?: boolean;
  compatibilityScore?: number;
  matchedSkills?: string[];
  onCollaborationRequest?: (user: SocialUser) => void;
  onViewProfile?: (user: SocialUser) => void;
  onReport?: (user: SocialUser) => void;
  className?: string;
  experienceTier?: ExperienceTier;
  collaborationHint?: 'skill-match' | 'project-fit' | 'cross-platform';
  disabled?: boolean;
  index?: number;
}

export default function CollaborationCard({
  user,
  currentUser,
  variant = "full",
  showCompatibilityScore = false,
  compatibilityScore,
  matchedSkills = [],
  onCollaborationRequest,
  onViewProfile,
  onReport,
  className = "",
  experienceTier = 'professional',
  collaborationHint,
  disabled = false,
  index = 0,
}: CollaborationCardProps) {
  // PERFORMANT: Use existing animation system
  const cardAnimation = useOptimizedAnimation("tileEntry", !disabled);
  
  // CLEAN: Extract user data using existing PlatformAdapter
  const normalizedUser = PlatformAdapter.normalize(user);
  const userSkills = CollaborationService.analyzeSkills(user);
  const collaborationReadiness = CollaborationUtils.getCollaborationReadiness(user);
  const tierStyling = CollaborationUtils.getTierStyling(experienceTier);

  // CLEAN: Calculate compatibility if current user provided
  const calculatedCompatibility = currentUser && !compatibilityScore 
    ? CollaborationService.calculateCompatibility(currentUser, user)
    : compatibilityScore || 0;

  // MODULAR: Format display data
  const formatFollowerCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const getCompatibilityColor = (score: number): string => {
    if (score >= 80) return "text-green-600 bg-green-100";
    if (score >= 60) return "text-yellow-600 bg-yellow-100";
    return "text-gray-600 bg-gray-100";
  };

  const getReadinessIndicator = (readiness: string): { icon: string; color: string; text: string } => {
    switch (readiness) {
      case 'ready':
        return { icon: '🟢', color: 'text-green-600', text: 'Ready to collaborate' };
      case 'interested':
        return { icon: '🟡', color: 'text-yellow-600', text: 'Open to opportunities' };
      default:
        return { icon: '⚪', color: 'text-gray-600', text: 'Not actively looking' };
    }
  };

  const readinessInfo = getReadinessIndicator(collaborationReadiness);

  // ENHANCEMENT FIRST: Compact variant for lists
  if (variant === "compact") {
    return (
      <AnimatedTile
        index={index}
        variant="collaboration"
        collaborationHint={collaborationHint}
        experienceTier={experienceTier}
        onClick={() => onViewProfile?.(user)}
        disabled={disabled}
        className={`bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all ${className}`}
      >
        <div className="flex items-center gap-3 p-3">
          {/* Profile Image */}
          <div className="relative">
            <img
              src={normalizedUser.pfpUrl}
              alt={normalizedUser.displayName}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white flex items-center justify-center">
              <span className="text-xs">{readinessInfo.icon}</span>
            </div>
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-gray-900 truncate text-sm">
                {normalizedUser.displayName}
              </h4>
              {normalizedUser.platform === 'farcaster' && <span className="text-purple-500">🟣</span>}
              {normalizedUser.platform === 'lens' && <span className="text-green-500">🌿</span>}
            </div>
            <p className="text-xs text-gray-600">@{normalizedUser.username}</p>
            {userSkills.length > 0 && (
              <div className="flex gap-1 mt-1">
                {userSkills.slice(0, 2).map((skill) => (
                  <span
                    key={skill}
                    className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full"
                  >
                    {CollaborationUtils.formatSkills([skill])[0]}
                  </span>
                ))}
                {userSkills.length > 2 && (
                  <span className="text-xs text-gray-500">+{userSkills.length - 2}</span>
                )}
              </div>
            )}
          </div>

          {/* Compatibility Score */}
          {showCompatibilityScore && (
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getCompatibilityColor(calculatedCompatibility)}`}>
              {calculatedCompatibility}%
            </div>
          )}

          {/* Action Button */}
          {onCollaborationRequest && (
            <ActionButton
              variant="collaboration-spark"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onCollaborationRequest(user);
              }}
              icon="✨"
            >
              Spark
            </ActionButton>
          )}
        </div>
      </AnimatedTile>
    );
  }

  // ENHANCEMENT FIRST: Suggestion variant for matching results
  if (variant === "suggestion") {
    return (
      <AnimatedTile
        index={index}
        variant="collaboration"
        collaborationHint={collaborationHint}
        experienceTier={experienceTier}
        disabled={disabled}
        className={`bg-gradient-to-br ${tierStyling.primaryColor} rounded-xl shadow-lg border border-white/20 ${className}`}
      >
        <div className="p-4 text-white">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <img
                src={normalizedUser.pfpUrl}
                alt={normalizedUser.displayName}
                className="w-12 h-12 rounded-full object-cover border-2 border-white/30"
              />
              <div>
                <h3 className="font-semibold">{normalizedUser.displayName}</h3>
                <p className="text-white/80 text-sm">@{normalizedUser.username}</p>
              </div>
            </div>
            {showCompatibilityScore && (
              <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                <span className="text-sm font-bold">{calculatedCompatibility}% match</span>
              </div>
            )}
          </div>

          {/* Skills */}
          {userSkills.length > 0 && (
            <div className="mb-3">
              <p className="text-white/80 text-xs mb-2">Skills:</p>
              <div className="flex flex-wrap gap-1">
                {userSkills.map((skill) => (
                  <span
                    key={skill}
                    className="px-2 py-1 bg-white/20 backdrop-blur-sm text-white text-xs rounded-full"
                  >
                    {CollaborationUtils.formatSkills([skill])[0]}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ENHANCED: Match Reasoning */}
          <div className="mb-3">
          <p className="text-white/80 text-xs mb-2">Why this match:</p>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
          <p className="text-white text-sm leading-relaxed">
          {(() => {
          const userSkills = CollaborationService.analyzeSkills(user);
          const currentUserSkills = currentUser ? CollaborationService.analyzeSkills(currentUser) : [];

          if (user.network !== currentUser?.network) {
          return `🌐 Cross-platform opportunity: Connect ${currentUser?.network} and ${user.network} communities`;
          }

              const complementarySkills = userSkills.filter(skill =>
                  !currentUserSkills.includes(skill) && currentUserSkills.some(currSkill => {
                      // Creative + Technical
                      if ((['design', 'art', 'photography', 'video', 'writing', 'music'].includes(skill) &&
                          ['development', 'frontend', 'backend', 'blockchain', 'mobile', 'data'].includes(currSkill)) ||
                         (['development', 'frontend', 'backend', 'blockchain', 'mobile', 'data'].includes(skill) &&
                          ['design', 'art', 'photography', 'video', 'writing', 'music'].includes(currSkill))) {
                        return true;
                      }
                      // Business + Technical/Creative
                      if (['marketing', 'product', 'business', 'finance'].includes(skill) &&
                          (['development', 'frontend', 'backend', 'design', 'art'].includes(currSkill) ||
                           ['development', 'frontend', 'backend', 'design', 'art'].includes(skill))) {
                        return true;
                      }
                      return false;
                    })
                  );

                  if (complementarySkills.length > 0) {
                    const skillNames = CollaborationUtils.formatSkills(complementarySkills.slice(0, 2));
                    return `🤝 Complementary skills: Your ${skillNames.join(' & ')} expertise would work great together`;
                  }

                  return `🎯 Shared interests and complementary backgrounds make this a great collaboration opportunity`;
                })()}
              </p>
            </div>
          </div>

          {/* Matched Skills */}
          {matchedSkills.length > 0 && (
            <div className="mb-3">
              <p className="text-white/80 text-xs mb-2">Shared/Complementary Skills:</p>
              <div className="flex flex-wrap gap-1">
                {matchedSkills.map((skill) => (
                  <span
                    key={skill}
                    className="px-2 py-1 bg-green-500/30 backdrop-blur-sm text-white text-xs rounded-full border border-green-400/30"
                  >
                    {CollaborationUtils.formatSkills([skill])[0]}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {onCollaborationRequest && (
              <ActionButton
                variant="collaboration-spark"
                size="sm"
                onClick={() => onCollaborationRequest(user)}
                icon="✨"
                fullWidth
              >
                Send Collaboration Spark
              </ActionButton>
            )}
            {onViewProfile && (
              <ActionButton
                variant="ghost"
                size="sm"
                onClick={() => onViewProfile(user)}
                className="border-white/30 text-white hover:bg-white/10"
              >
                View Profile
              </ActionButton>
            )}
          </div>
        </div>
      </AnimatedTile>
    );
  }

  // ENHANCEMENT FIRST: Full variant for detailed view
  return (
    <AnimatedTile
      index={index}
      variant="collaboration"
      collaborationHint={collaborationHint}
      experienceTier={experienceTier}
      disabled={disabled}
      className={`bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all ${className}`}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={normalizedUser.pfpUrl}
                alt={normalizedUser.displayName}
                className="w-16 h-16 rounded-full object-cover"
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm">
                <span className="text-sm">{readinessInfo.icon}</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-semibold text-gray-900">
                  {normalizedUser.displayName}
                </h3>
                {normalizedUser.platform === 'farcaster' && <span className="text-purple-500">🟣</span>}
                {normalizedUser.platform === 'lens' && <span className="text-green-500">🌿</span>}
                {normalizedUser.isVerified && <span className="text-blue-500">✓</span>}
              </div>
              <p className="text-gray-600">@{normalizedUser.username}</p>
              <p className={`text-sm ${readinessInfo.color}`}>{readinessInfo.text}</p>
            </div>
          </div>

          {showCompatibilityScore && (
            <div className={`px-3 py-2 rounded-full text-sm font-medium ${getCompatibilityColor(calculatedCompatibility)}`}>
              {calculatedCompatibility}% compatible
            </div>
          )}
        </div>

        {/* Bio */}
        {normalizedUser.bio && (
          <p className="text-gray-700 mb-4 line-clamp-2">{normalizedUser.bio}</p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
          <span>
            <strong className="text-gray-900">{formatFollowerCount(normalizedUser.followerCount)}</strong> followers
          </span>
          <span>
            <strong className="text-gray-900">{formatFollowerCount(normalizedUser.followingCount)}</strong> following
          </span>
        </div>

        {/* Skills */}
        {userSkills.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Skills:</h4>
            <div className="flex flex-wrap gap-2">
              {userSkills.map((skill) => (
                <span
                  key={skill}
                  className={`px-3 py-1 bg-gradient-to-r ${tierStyling.primaryColor} text-white text-sm rounded-full`}
                >
                  {CollaborationUtils.formatSkills([skill])[0]}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Matched Skills */}
        {matchedSkills.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Matched Skills:</h4>
            <div className="flex flex-wrap gap-2">
              {matchedSkills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full border border-green-200"
                >
                  {CollaborationUtils.formatSkills([skill])[0]}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Collaboration Profile */}
        {user.collaborationProfile && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Collaboration Preferences:</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p><strong>Availability:</strong> {user.collaborationProfile.availability}</p>
              {user.collaborationProfile.preferredProjectTypes.length > 0 && (
                <p><strong>Project Types:</strong> {user.collaborationProfile.preferredProjectTypes.join(', ')}</p>
              )}
              {user.collaborationProfile.location && (
                <p><strong>Location:</strong> {user.collaborationProfile.location}</p>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {onCollaborationRequest && (
            <ActionButton
              variant="collaboration-spark"
              onClick={() => onCollaborationRequest(user)}
              icon="✨"
              fullWidth
            >
              Send Collaboration Spark
            </ActionButton>
          )}
          {onViewProfile && (
            <ActionButton
              variant="secondary"
              onClick={() => onViewProfile(user)}
            >
              View Profile
            </ActionButton>
          )}
          {onReport && (
            <ActionButton
              variant="ghost"
              onClick={() => onReport(user)}
              icon="🚨"
              size="sm"
            >
              Report
            </ActionButton>
          )}
        </div>

        {/* Platform Link */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <a
            href={normalizedUser.platform === 'farcaster' 
              ? `https://warpcast.com/${normalizedUser.username}`
              : `https://hey.xyz/u/${normalizedUser.username}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className={`text-xs ${tierStyling.accentColor} hover:underline flex items-center gap-1`}
          >
            <span>View on {normalizedUser.platform === 'farcaster' ? 'Farcaster' : 'Lens'}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
              <path d="M19 19H5V5h7V3H5c-1.1 0-2-.9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7z" />
            </svg>
          </a>
        </div>
      </div>
    </AnimatedTile>
  );
}