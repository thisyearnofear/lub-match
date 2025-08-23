/**
 * Community Reporting Component
 * CLEAN: Clear reporting interface with validation
 * MODULAR: Reusable across different content types
 * PERFORMANT: Efficient form handling with minimal re-renders
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FarcasterUser } from "@/utils/mockData";
import { antiSpamService } from "@/services/antiSpamService";
import ActionButton from "./shared/ActionButton";

interface CommunityReportingProps {
  targetUser: FarcasterUser;
  contentType: 'challenge' | 'cast' | 'user';
  contentId?: string;
  onClose: () => void;
  onReportSubmitted?: (reportId: string) => void;
}

type ReportType = 'spam' | 'abuse' | 'fake' | 'inappropriate';

const REPORT_TYPES: Array<{
  type: ReportType;
  label: string;
  description: string;
  icon: string;
}> = [
  {
    type: 'spam',
    label: 'Spam',
    description: 'Repetitive, unwanted, or promotional content',
    icon: '🚫'
  },
  {
    type: 'abuse',
    label: 'Abuse',
    description: 'Harassment, threats, or harmful behavior',
    icon: '⚠️'
  },
  {
    type: 'fake',
    label: 'Fake Content',
    description: 'Misleading information or impersonation',
    icon: '🎭'
  },
  {
    type: 'inappropriate',
    label: 'Inappropriate',
    description: 'Content that violates community guidelines',
    icon: '🔞'
  }
];

export default function CommunityReporting({
  targetUser,
  contentType,
  contentId,
  onClose,
  onReportSubmitted
}: CommunityReportingProps) {
  const [selectedType, setSelectedType] = useState<ReportType | null>(null);
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!selectedType || !description.trim()) {
      setError('Please select a report type and provide a description');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // In a real implementation, we'd get the current user's ID
      const reporterId = 1; // Placeholder - would come from user context
      
      const result = antiSpamService.submitReport(
        reporterId,
        targetUser.fid,
        selectedType,
        description.trim(),
        evidence.trim() || undefined
      );

      if (result.success && result.reportId) {
        setSubmitted(true);
        onReportSubmitted?.(result.reportId);
        
        // Auto-close after 2 seconds
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(result.error || 'Failed to submit report');
      }
    } catch (err) {
      setError('An error occurred while submitting the report');
      console.error('Report submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      >
        <div className="bg-white rounded-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">
            Report Submitted
          </h3>
          <p className="text-gray-600">
            Thank you for helping keep our community safe. We'll review your report shortly.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Report Content</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Target User Info */}
        <div className="flex items-center gap-3 mb-6 p-3 bg-gray-50 rounded-lg">
          <img
            src={targetUser.pfp_url}
            alt={targetUser.display_name}
            className="w-10 h-10 rounded-full"
          />
          <div>
            <h4 className="font-semibold text-gray-800">
              {targetUser.display_name}
            </h4>
            <p className="text-sm text-gray-600">@{targetUser.username}</p>
          </div>
          <div className="ml-auto text-sm text-gray-500">
            {contentType} {contentId && `• ${contentId.substring(0, 8)}...`}
          </div>
        </div>

        {/* Report Type Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            What's the issue?
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {REPORT_TYPES.map((type) => (
              <button
                key={type.type}
                onClick={() => setSelectedType(type.type)}
                className={`p-3 rounded-lg border-2 text-left transition-colors ${
                  selectedType === type.type
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{type.icon}</span>
                  <div>
                    <div className="font-medium text-gray-800">{type.label}</div>
                    <div className="text-sm text-gray-600">{type.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Please provide details about the issue..."
            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            rows={4}
            maxLength={500}
          />
          <div className="text-xs text-gray-500 mt-1">
            {description.length}/500 characters
          </div>
        </div>

        {/* Evidence (Optional) */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Evidence (Optional)
          </label>
          <textarea
            value={evidence}
            onChange={(e) => setEvidence(e.target.value)}
            placeholder="Links, screenshots, or other supporting information..."
            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            rows={2}
            maxLength={200}
          />
          <div className="text-xs text-gray-500 mt-1">
            {evidence.length}/200 characters
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <ActionButton
            onClick={onClose}
            variant="secondary"
            className="flex-1"
            disabled={isSubmitting}
          >
            Cancel
          </ActionButton>
          <ActionButton
            onClick={handleSubmit}
            variant="gradient-red"
            className="flex-1"
            disabled={isSubmitting || !selectedType || !description.trim()}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </ActionButton>
        </div>

        {/* Disclaimer */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">
            Reports are reviewed by our community moderation team. False reports may result in restrictions on your account. 
            By submitting this report, you confirm that the information provided is accurate to the best of your knowledge.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Hook for easy reporting integration
export function useReporting() {
  const [showReporting, setShowReporting] = useState(false);
  const [reportTarget, setReportTarget] = useState<{
    user: FarcasterUser;
    contentType: 'challenge' | 'cast' | 'user';
    contentId?: string;
  } | null>(null);

  const openReport = (
    user: FarcasterUser,
    contentType: 'challenge' | 'cast' | 'user',
    contentId?: string
  ) => {
    setReportTarget({ user, contentType, contentId });
    setShowReporting(true);
  };

  const closeReport = () => {
    setShowReporting(false);
    setReportTarget(null);
  };

  const ReportingModal = reportTarget ? (
    <AnimatePresence>
      {showReporting && (
        <CommunityReporting
          targetUser={reportTarget.user}
          contentType={reportTarget.contentType}
          contentId={reportTarget.contentId}
          onClose={closeReport}
          onReportSubmitted={(reportId) => {
            console.log('Report submitted:', reportId);
            // Could trigger additional actions here
          }}
        />
      )}
    </AnimatePresence>
  ) : null;

  return {
    openReport,
    closeReport,
    ReportingModal,
    isReporting: showReporting
  };
}
