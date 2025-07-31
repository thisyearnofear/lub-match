// Centralized upload configuration to avoid magic numbers and ensure consistency
// across client and server validation

export const UPLOAD_LIMITS = {
  // File size limits (in bytes)
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB per file
  MAX_TOTAL_SIZE: 40 * 1024 * 1024, // 40MB total payload
  COMPRESSION_THRESHOLD: 2 * 1024 * 1024, // 2MB - compress files larger than this
  TARGET_COMPRESSED_SIZE: 500 * 1024, // 500KB target after compression
  
  // Image compression settings
  COMPRESSION: {
    maxWidth: 800,
    maxHeight: 800,
    quality: 0.8,
    format: 'jpeg' as const,
  },
  
  // Server limits
  SERVER: {
    REQUEST_TIMEOUT: 60, // seconds
    MAX_REQUEST_SIZE: 50 * 1024 * 1024, // 50MB (server buffer)
  },
  
  // Game-specific limits
  GAME: {
    MAX_PHOTOS: 8,
    MAX_FARCASTER_USERS: 8,
  }
} as const;

// Helper functions for consistent size validation
export const validateFileSize = (file: File) => {
  if (file.size > UPLOAD_LIMITS.MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File "${file.name}" is too large. Maximum size: ${formatBytes(UPLOAD_LIMITS.MAX_FILE_SIZE)}`
    };
  }
  return { valid: true };
};

export const validateTotalSize = (files: File[]) => {
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  if (totalSize > UPLOAD_LIMITS.MAX_TOTAL_SIZE) {
    return {
      valid: false,
      error: `Total upload size too large. Maximum: ${formatBytes(UPLOAD_LIMITS.MAX_TOTAL_SIZE)}, Current: ${formatBytes(totalSize)}`
    };
  }
  return { valid: true, totalSize };
};

export const needsCompression = (file: File) => {
  return file.size > UPLOAD_LIMITS.COMPRESSION_THRESHOLD;
};

// Utility function for consistent byte formatting
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};