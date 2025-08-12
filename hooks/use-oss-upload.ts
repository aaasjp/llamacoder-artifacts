import { useState } from 'react';

interface UploadResult {
  url: string;
  name: string;
  size: number;
  type: string;
}

export function useOSSUpload() {
  const [isUploading, setIsUploading] = useState(false);

  const uploadToOSS = async (file: File): Promise<UploadResult> => {
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/oss-upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('上传失败');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '上传失败');
      }

      return {
        url: result.url,
        name: result.name,
        size: result.size,
        type: result.type,
      };
    } catch (error) {
      console.error('OSS上传错误:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadToOSS,
    isUploading,
  };
} 