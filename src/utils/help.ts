/* eslint-disable no-useless-escape */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Upload } from 'antd';
import toast from 'react-hot-toast';
import { parse } from 'tldts';

// Remove Vietnamese diacritics and convert to lowercase
export const removeVietnameseTones = (str: string) => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
};

// Validate image before uploading (type, size, dimensions)
export const beforeUpload = async (
  file: File,
  dimensions: number = 1,
) => {
  const isImage = file.type.startsWith('image/');
  const isLt5MB = file.size / 1024 / 1024 < 5;

  if (!isImage) {
    toast.error('Only image files are allowed!');
    return Upload.LIST_IGNORE;
  }
  if (!isLt5MB) {
    toast.error('Image size must be less than 5MB!');
    return Upload.LIST_IGNORE;
  }
  const dimensionRatio = await getImageDimensions(file);
  if (!dimensionRatio) {
    toast.error('Unable to read image dimensions!');
    return Upload.LIST_IGNORE;
  }

  if (dimensionRatio < dimensions) {
    toast.error(`Minimum dimension ratio is ${dimensions} / 1`);
    return Upload.LIST_IGNORE;
  }
  return true; // Valid file
};

// Helper to get image width / height ratio
const getImageDimensions = (file: File): Promise<number> => {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = event => {
      const img = new Image();
      img.onload = () => {
        resolve(img.width / img.height);
      };
      img.onerror = () => {
        resolve(1);
      };
      if (event.target?.result) {
        img.src = event.target.result as string;
      }
    };
    reader.onerror = () => resolve(1);
    reader.readAsDataURL(file);
  });
};

// Helper to get exact image dimensions (width and height)
const getImageExactDimensions = (
  file: File,
): Promise<{ width: number; height: number } | null> => {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = event => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => {
        resolve(null);
      };
      if (event.target?.result) {
        img.src = event.target.result as string;
      }
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
};

// Validate file based on allowed extensions and max size
export const beforeUploadFile = async (
  file: File,
  allowedExtensions = [
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.bmp',
    '.webp',
    '.svg',
    '.tiff',
    '.ico',
  ],
  maxSizeMB = 10,
  dimensions?: { width: number; height: number },
) => {
  const fileExtension =
    '.' + file.name.split('.').pop()?.toLowerCase();
  const isAllowedExtension =
    allowedExtensions.includes(fileExtension);
  const isLtMaxSize = file.size / 1024 / 1024 < maxSizeMB;

  if (!isAllowedExtension) {
    toast.error(
      `Only the following formats are supported: ${allowedExtensions
        .join(', ')
        .toUpperCase()}`,
    );
    return false;
  }

  if (!isLtMaxSize) {
    toast.error(`File size must be less than ${maxSizeMB}MB!`);
    return false;
  }

  if (dimensions) {
    const imageDimensions = await getImageExactDimensions(file);
    if (!imageDimensions) {
      toast.error('Unable to read image dimensions!');
      return false;
    }

    const { width, height } = imageDimensions;
    if (width !== dimensions.width || height !== dimensions.height) {
      toast.error(
        `Image must be exactly ${dimensions.width} x ${dimensions.height} pixels!`,
      );
      return false;
    }
  }

  return true; // Valid file
};

// Normalize Ant Design's file input event
export const normFile = (e: any) => {
  if (Array.isArray(e)) {
    return e;
  }
  return e?.fileList;
};

// Append empty arrays to FormData to ensure backend receives them
export const ensureEmptyArrays = (
  formData: FormData,
  data: Record<string, any>,
) => {
  Object.entries(data).forEach(([key, value]) => {
    if (Array.isArray(value) && value.length === 0) {
      formData.append(`${key}[]`, '');
    }
  });
};

// Convert text to URL-friendly slug
export const createSlugSearch = (value: string) => {
  return value
    .normalize('NFD')
    .trim()
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\W_]+/g, '-')
    .toLowerCase()
    .replace(/^-+|-+$/g, '');
};

// Format number string into Vietnamese money format (e.g. 1.000.000)
export const formatVndMoney = (value: string) => {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

// Check if URL is a valid YouTube embed link
export const isYoutubeUrl = (url: string) => {
  const youtubeEmbedRegex =
    /^https:\/\/www\.youtube\.com\/embed\/([A-Za-z0-9_-]+)/;
  return youtubeEmbedRegex.test(url);
};

// Convert YouTube watch URL to embed URL
export function convertToEmbedUrl(url: string) {
  const regex =
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = url && url.match(regex);

  let youtubeUrl = '';
  if (match) {
    const videoId = match[1];
    youtubeUrl = `https://www.youtube.com/embed/${videoId}`;
  } else {
    youtubeUrl = url;
  }
  if (isYoutubeUrl(youtubeUrl)) {
    return youtubeUrl;
  }
  return;
}

export function stripHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, '').trim();
}

export const isRootDomain = (domain: string): boolean => {
  const result = parse(domain);

  return (
    (!result.subdomain || result.subdomain === 'www') &&
    !!result.domain
  );
};

export const hexToRgba = (hex: string, opacity: number) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(
    hex,
  );
  if (result) {
    return `rgba(${parseInt(result[1], 16)}, ${parseInt(
      result[2],
      16,
    )}, ${parseInt(result[3], 16)}, ${opacity / 100})`;
  }
  return hex;
};

export function rgbStringToHex(colorStr: string) {
  if (typeof colorStr !== 'string') return '';

  if (colorStr.startsWith('#')) {
    return colorStr.replace('#', '').toUpperCase();
  }

  const regex =
    /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(0|1|0?\.\d+))?\s*\)$/i;
  const match = colorStr.match(regex);

  if (!match) return '';

  const r = Math.min(255, Math.max(0, parseInt(match[1], 10)));
  const g = Math.min(255, Math.max(0, parseInt(match[2], 10)));
  const b = Math.min(255, Math.max(0, parseInt(match[3], 10)));

  const hex = [r, g, b]
    .map(val => val.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();

  return hex;
}
