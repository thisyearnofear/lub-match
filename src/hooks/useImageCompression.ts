"use client";

import { useState, useCallback } from 'react';
import { compressImages, isImageFile } from '@/utils/imageCompression';
import { UPLOAD_LIMITS, validateFileSize, validateTotalSize, needsCompression, formatBytes } from '@/config/uploadLimits';

export interface CompressionState {
  isCompressing: boolean;
  progress: number;
  error: string | null;
}

export interface CompressionResult {
  files: File[];
  compressionStats?: {
    originalSize: number;
    compressedSize: number;
    savedBytes: number;
    savedPercentage: number;
  };
}

export function useImageCompression() {
  const [state, setState] = useState<CompressionState>({
    isCompressing: false,
    progress: 0,
    error: null,
  });

  const processFiles = useCallback(async (
    files: File[],
    onProgress?: (progress: number) => void
  ): Promise<CompressionResult> => {
    setState({ isCompressing: true, progress: 0, error: null });

    try {
      // Filter only image files
      const imageFiles = files.filter(isImageFile);
      const nonImageFiles = files.filter(f => !isImageFile(f));

      if (nonImageFiles.length > 0) {
        console.warn(`Filtered out ${nonImageFiles.length} non-image files`);
      }

      if (imageFiles.length === 0) {
        throw new Error('No valid image files found');
      }

      // Validate individual file sizes
      for (const file of imageFiles) {
        const validation = validateFileSize(file);
        if (!validation.valid) {
          throw new Error(validation.error);
        }
      }

      // Separate files that need compression
      const largeFiles = imageFiles.filter(needsCompression);
      const smallFiles = imageFiles.filter(f => !needsCompression(f));

      let processedFiles: File[] = [...smallFiles];
      let compressionStats: CompressionResult['compressionStats'];

      if (largeFiles.length > 0) {
        console.log(`Compressing ${largeFiles.length} large files...`);

        const originalSize = largeFiles.reduce((sum, f) => sum + f.size, 0);

        // Compress large files
        const compressedFiles = await compressImages(
          largeFiles,
          {
            ...UPLOAD_LIMITS.COMPRESSION,
            maxSizeKB: UPLOAD_LIMITS.TARGET_COMPRESSED_SIZE / 1024,
          },
          (progress) => {
            setState(prev => ({ ...prev, progress }));
            onProgress?.(progress);
          }
        );

        const compressedSize = compressedFiles.reduce((sum, f) => sum + f.size, 0);
        const savedBytes = originalSize - compressedSize;

        compressionStats = {
          originalSize,
          compressedSize,
          savedBytes,
          savedPercentage: (savedBytes / originalSize) * 100,
        };

        processedFiles = [...smallFiles, ...compressedFiles];

        if (savedBytes > 0) {
          console.log(`✅ Compression saved ${formatBytes(savedBytes)} (${compressionStats.savedPercentage.toFixed(1)}% reduction)`);
        }
      }

      // Final validation of total size
      const totalValidation = validateTotalSize(processedFiles);
      if (!totalValidation.valid) {
        throw new Error(totalValidation.error);
      }

      setState({ isCompressing: false, progress: 100, error: null });

      return {
        files: processedFiles,
        compressionStats,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Compression failed';
      setState({ isCompressing: false, progress: 0, error: errorMessage });
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ isCompressing: false, progress: 0, error: null });
  }, []);

  return {
    ...state,
    processFiles,
    reset,
  };
}