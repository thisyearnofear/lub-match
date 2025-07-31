// Image compression utility for handling large user uploads
// Optimizes images for web while maintaining quality

import { UPLOAD_LIMITS } from '@/config/uploadLimits';

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeKB?: number;
  format?: 'jpeg' | 'webp' | 'png';
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  ...UPLOAD_LIMITS.COMPRESSION,
  maxSizeKB: UPLOAD_LIMITS.TARGET_COMPRESSED_SIZE / 1024,
};

/**
 * Compress a File object to reduce size while maintaining quality
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }
    
    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      const { width: newWidth, height: newHeight } = calculateDimensions(
        img.width,
        img.height,
        opts.maxWidth,
        opts.maxHeight
      );
      
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      
      // Convert to blob with compression
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }
          
          // Check if we need further compression
          if (blob.size > opts.maxSizeKB * 1024 && opts.quality > 0.1) {
            // Recursively compress with lower quality
            const lowerQualityOptions = {
              ...opts,
              quality: Math.max(0.1, opts.quality - 0.1)
            };
            
            const compressedFile = new File([blob], file.name, {
              type: `image/${opts.format}`,
              lastModified: Date.now()
            });
            
            compressImage(compressedFile, lowerQualityOptions)
              .then(resolve)
              .catch(reject);
          } else {
            // Create final file
            const compressedFile = new File([blob], file.name, {
              type: `image/${opts.format}`,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          }
        },
        `image/${opts.format}`,
        opts.quality
      );
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Compress multiple images in parallel with progress tracking
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = {},
  onProgress?: (progress: number) => void
): Promise<File[]> {
  const results: File[] = [];
  
  for (let i = 0; i < files.length; i++) {
    try {
      const compressed = await compressImage(files[i], options);
      results.push(compressed);
      onProgress?.((i + 1) / files.length * 100);
    } catch (error) {
      console.error(`Failed to compress image ${files[i].name}:`, error);
      // Fallback to original file if compression fails
      results.push(files[i]);
    }
  }
  
  return results;
}

/**
 * Calculate new dimensions while maintaining aspect ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let { width, height } = { width: originalWidth, height: originalHeight };
  
  // Scale down if too wide
  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }
  
  // Scale down if too tall
  if (height > maxHeight) {
    width = (width * maxHeight) / height;
    height = maxHeight;
  }
  
  return { width: Math.round(width), height: Math.round(height) };
}

/**
 * Check if a file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

// formatFileSize moved to @/config/uploadLimits for centralized utility functions

/**
 * Server-side image compression using Canvas API (Node.js)
 */
export async function compressImageServer(
  buffer: Buffer,
  options: CompressionOptions = {}
): Promise<Buffer> {
  // This would require a server-side image processing library like Sharp
  // For now, we'll implement client-side compression and handle server limits
  throw new Error('Server-side compression not implemented. Use client-side compression.');
}