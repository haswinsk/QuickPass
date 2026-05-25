// Cloudinary File Upload Integration
// Handles real file uploads for Xerox documents (PDF, JPG, PNG)

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = import.meta.env.VITE_CLOUDINARY_API_KEY;
const CLOUDINARY_UPLOAD_PRESET = 'quickpass_unsigned'; // Unsigned upload preset for client-side

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  format: string;
  bytes: number;
  resource_type: string;
  created_at: string;
}

// Upload file to Cloudinary
export const uploadToCloudinary = async (
  file: File,
  folder: string = 'xerox-documents'
): Promise<{ success: boolean; result?: CloudinaryUploadResult; error?: string }> => {
  try {
    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: 'Invalid file type. Only PDF, JPG, and PNG are allowed.' };
    }

    // Validate file size (max 10MB for Cloudinary)
    if (file.size > 10 * 1024 * 1024) {
      return { success: false, error: 'File size exceeds 10MB limit.' };
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);
    formData.append('folder', folder);
    formData.append('api_key', CLOUDINARY_API_KEY);

    // Add metadata
    formData.append('context', `original_name=${file.name}|uploaded_at=${new Date().toISOString()}`);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { 
        success: false, 
        error: errorData.error?.message || `Upload failed with status ${response.status}` 
      };
    }

    const result: CloudinaryUploadResult = await response.json();
    return { success: true, result };
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    return { success: false, error: error.message || 'File upload failed.' };
  }
};

// Get optimized URL with transformations
export const getOptimizedUrl = (publicId: string, options?: {
  width?: number;
  height?: number;
  quality?: string;
  format?: string;
}): string => {
  const transformations = [];
  
  if (options?.width) transformations.push(`w_${options.width}`);
  if (options?.height) transformations.push(`h_${options.height}`);
  if (options?.quality) transformations.push(`q_${options.quality}`);
  if (options?.format) transformations.push(`f_${options.format}`);
  
  const transformString = transformations.length > 0 ? `/${transformations.join(',')}` : '';
  
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload${transformString}/${publicId}`;
};

// Generate download URL for uploaded documents
export const getDownloadUrl = (publicId: string, fileName: string, resourceType: string = 'image', format?: string): string => {
  const safeFileName = encodeURIComponent(fileName);
  const cloudResourceType = resourceType === 'raw' ? 'raw' : 'image';
  const formattedPublicId = format && cloudResourceType !== 'raw' ? `${publicId}.${format}` : publicId;
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/${cloudResourceType}/upload/fl_attachment:${safeFileName}/${formattedPublicId}`;
};

// Delete file from Cloudinary (would need server-side implementation)
export const deleteFromCloudinary = async (publicId: string): Promise<boolean> => {
  // Note: Deletion requires server-side signature
  // In production, this would call your backend API
  return true;
};

// Format file size for display
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
