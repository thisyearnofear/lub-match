/**
 * ENHANCED DROPZONE COMPONENT
 * Consolidates photo upload patterns with delightful micro-interactions
 * Features: Progress, compression feedback, romantic messaging
 */

import React, { useCallback } from 'react';
import Dropzone from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  colors,
  spacing,
  borderRadius,
  transitions,
  animations,
} from '@/theme/designTokens';
import { useImageCompression } from '@/hooks/useImageCompression';
import { useMicroInteraction, interactionSequences } from '@/hooks/useMicroInteractions';
import { formatBytes } from '@/config/uploadLimits';

interface EnhancedDropzoneProps {
  files: File[];
  setFiles: (files: File[]) => void;
  maxFiles: number;
  accept?: { [key: string]: string[] };
  disabled?: boolean;
  label?: string;
  hint?: string;
  celebration?: boolean; // Show celebration on files added
}

export const EnhancedDropzone = React.forwardRef<HTMLDivElement, EnhancedDropzoneProps>(
  (
    {
      files,
      setFiles,
      maxFiles,
      accept = { 'image/*': [] },
      disabled = false,
      label = '📸 Upload Your Memories',
      hint = 'Tap to select or drag and drop',
      celebration = true,
    },
    ref
  ) => {
    const { isCompressing, progress, processFiles } = useImageCompression();
    const { trigger: triggerMicroInteraction } = useMicroInteraction();

    const onDrop = useCallback(
      async (accepted: File[]) => {
        if (accepted.length + files.length > maxFiles) {
          triggerMicroInteraction({
            type: 'error',
            haptic: true,
          });
          return;
        }

        const newFiles = accepted.slice(0, maxFiles - files.length);
        if (newFiles.length === 0) return;

        try {
          const result = await processFiles(newFiles);
          const updatedFiles = [...files, ...result.files];
          setFiles(updatedFiles);

          // Celebrate each addition
          if (celebration) {
            triggerMicroInteraction({
              type: 'success',
              haptic: true,
            });
          }

          // Log compression stats for transparency
          if (result.compressionStats && result.compressionStats.savedBytes > 0) {
            console.log(
              `✨ Saved ${formatBytes(
                result.compressionStats.savedBytes
              )} (${result.compressionStats.savedPercentage.toFixed(1)}% smaller)`
            );
          }
        } catch (error) {
          triggerMicroInteraction({ type: 'error' });
          throw error;
        }
      },
      [files, setFiles, maxFiles, processFiles, triggerMicroInteraction, celebration]
    );

    const removeFile = (idx: number) => {
      setFiles(files.filter((_, i) => i !== idx));
      triggerMicroInteraction({ type: 'info', haptic: true });
    };

    const completionPercentage = (files.length / maxFiles) * 100;

    return (
      <div ref={ref} className="space-y-4">
        <Dropzone
          onDrop={onDrop}
          accept={accept}
          multiple
          maxFiles={maxFiles}
          disabled={disabled || isCompressing}
        >
          {({ getRootProps, getInputProps, isDragActive }) => (
            <motion.div
              {...(getRootProps() as any)}
              animate={isDragActive ? { scale: 1.02 } : { scale: 1 }}
              transition={{ duration: 0.2 }}
              style={{
                border: `2px dashed ${
                  isDragActive
                    ? colors.primary[400]
                    : isCompressing
                    ? colors.secondary[400]
                    : colors.neutral[300]
                }`,
                borderRadius: borderRadius.xl,
                padding: spacing[6],
                textAlign: 'center',
                cursor: isCompressing ? 'wait' : 'pointer',
                background: isDragActive
                  ? colors.primary[50]
                  : isCompressing
                  ? colors.secondary[50]
                  : colors.neutral[50],
                transition: transitions.property('base'),
              }}
            >
              <input {...getInputProps()} />

              <motion.div
                animate={{
                  scale: isCompressing ? [1, 1.1, 1] : 1,
                }}
                transition={{
                  duration: 2,
                  repeat: isCompressing ? Infinity : 0,
                }}
                style={{
                  fontSize: '3em',
                  marginBottom: spacing[3],
                }}
              >
                {isCompressing ? '🔄' : isDragActive ? '💝' : '📸'}
              </motion.div>

              <p
                style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: colors.neutral[800],
                  marginBottom: spacing[2],
                }}
              >
                {isCompressing
                  ? 'Optimizing your memories...'
                  : files.length === 0
                  ? label
                  : `${files.length}/${maxFiles} memories saved`}
              </p>

              <p
                style={{
                  fontSize: '0.875rem',
                  color: colors.neutral[500],
                  marginBottom: spacing[3],
                }}
              >
                {isCompressing
                  ? `${progress.toFixed(0)}% complete`
                  : isDragActive
                  ? '✨ Drop to add memories'
                  : hint}
              </p>

              {isCompressing && (
                <div
                  style={{
                    width: '100%',
                    height: '8px',
                    background: colors.neutral[200],
                    borderRadius: borderRadius.full,
                    overflow: 'hidden',
                    marginTop: spacing[3],
                  }}
                >
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: `${progress}%` }}
                    style={{
                      height: '100%',
                      background: `linear-gradient(90deg, ${colors.primary[400]} 0%, ${colors.secondary[500]} 100%)`,
                    }}
                  />
                </div>
              )}
            </motion.div>
          )}
        </Dropzone>

        {/* Progress Indicator */}
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {/* Completion Stats */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: `${spacing[2]} ${spacing[3]}`,
                background: colors.neutral[50],
                borderRadius: borderRadius.md,
                fontSize: '0.875rem',
              }}
            >
              <span style={{ color: colors.neutral[600] }}>
                {files.length === maxFiles
                  ? '✨ Ready to create!'
                  : `${maxFiles - files.length} more needed`}
              </span>
              <span
                style={{
                  fontWeight: 600,
                  color: colors.primary[600],
                }}
              >
                {formatBytes(files.reduce((sum, f) => sum + f.size, 0))}
              </span>
            </div>

            {/* Progress Bar */}
            <div
              style={{
                width: '100%',
                height: '6px',
                background: colors.neutral[200],
                borderRadius: borderRadius.full,
                overflow: 'hidden',
              }}
            >
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: `${completionPercentage}%` }}
                transition={{ duration: 0.4 }}
                style={{
                  height: '100%',
                  background: `linear-gradient(90deg, ${colors.primary[400]} 0%, ${colors.primary[600]} 100%)`,
                }}
              />
            </div>

            {/* File Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                gap: spacing[3],
                marginTop: spacing[4],
              }}
            >
              <AnimatePresence>
                {files.map((file, idx) => (
                  <motion.div
                    key={`${file.name}-${idx}`}
                    variants={interactionSequences.uploadSuccess as any}
                    initial="initial"
                    animate="animate"
                    exit={{ scale: 0, opacity: 0 }}
                    style={{ position: 'relative' }}
                  >
                    <Image
                      src={URL.createObjectURL(file)}
                      alt={`Memory ${idx + 1}`}
                      width={100}
                      height={100}
                      className="w-full aspect-square object-cover rounded-xl shadow-md"
                    />

                    {/* Celebration Overlay on Add */}
                    <motion.div
                      initial={{ opacity: 1, scale: 1 }}
                      animate={{ opacity: 0, scale: 1.5 }}
                      transition={{ duration: 0.6 }}
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontSize: '2em',
                        pointerEvents: 'none',
                      }}
                    >
                      ✨
                    </motion.div>

                    {/* Remove Button */}
                    <motion.button
                      type="button"
                      onClick={() => removeFile(idx)}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        width: '28px',
                        height: '28px',
                        borderRadius: borderRadius.full,
                        background: colors.error,
                        color: colors.neutral[0],
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1rem',
                        fontWeight: 600,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      }}
                      aria-label={`Remove ${file.name}`}
                    >
                      ✕
                    </motion.button>

                    {/* File Size Badge */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '4px',
                        left: '4px',
                        background: 'rgba(0, 0, 0, 0.7)',
                        color: colors.neutral[0],
                        fontSize: '0.7rem',
                        padding: `${spacing[1]} ${spacing[2]}`,
                        borderRadius: borderRadius.sm,
                        fontWeight: 600,
                      }}
                    >
                      {formatBytes(file.size)}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </div>
    );
  }
);

EnhancedDropzone.displayName = 'EnhancedDropzone';

export default EnhancedDropzone;
