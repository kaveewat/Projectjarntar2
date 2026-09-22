const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { randomUUID } = require('crypto');
const { AppError } = require('./errorHandler');
const { sendError } = require('../utils/response');

// Ensure upload directory exists
const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Storage engine configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${randomUUID()}${ext}`;
    cb(null, uniqueName);
  },
});

// File type filter: only JPEG, PNG, WEBP allowed
const fileFilter = (_req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (allowedMimeTypes.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        `Invalid file type '${file.mimetype}'. Only JPEG, PNG, and WEBP images are allowed.`,
        400,
        'INVALID_FILE_TYPE'
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 10, // Maximum 10 files per scan
  },
});

/**
 * Middleware wrapper for multer array upload with friendly error envelope
 * @param {string} fieldName 
/**
 * Verify Magic Bytes (file header signatures) to detect disguised files (.exe, scripts renamed to .jpg/.png)
 * @param {string} filePath
 * @returns {boolean}
 */
const isValidImageMagicBytes = (filePath) => {
  try {
    if (!fs.existsSync(filePath)) return false;
    const buffer = Buffer.alloc(16);
    const fd = fs.openSync(filePath, 'r');
    const bytesRead = fs.readSync(fd, buffer, 0, 16, 0);
    fs.closeSync(fd);

    if (bytesRead < 4) return false;

    // Reject DOS/Windows Executable header 'MZ' (0x4D 0x5A)
    if (buffer[0] === 0x4d && buffer[1] === 0x5a) {
      return false;
    }

    // Reject ELF Linux binary (0x7F 'E' 'L' 'F')
    if (buffer[0] === 0x7f && buffer[1] === 0x45 && buffer[2] === 0x4c && buffer[3] === 0x46) {
      return false;
    }

    // Check JPEG: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return true;
    }

    // Check PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    ) {
      return true;
    }

    // Check WEBP: RIFF .... WEBP
    if (
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50
    ) {
      return true;
    }

    // Support GIF: GIF87a or GIF89a
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
      return true;
    }

    return false;
  } catch (_err) {
    return false;
  }
};

/**
 * Middleware wrapper for multer array upload with magic bytes validation
 * @param {string} fieldName 
 * @param {number} maxCount 
 */
const uploadSquadImages = (fieldName = 'images', maxCount = 10) => {
  const multerMiddleware = upload.array(fieldName, maxCount);

  return (req, res, next) => {
    multerMiddleware(req, res, (err) => {
      if (!err) {
        // Perform Magic Bytes verification on all uploaded files
        if (req.files && req.files.length > 0) {
          for (const file of req.files) {
            if (!isValidImageMagicBytes(file.path)) {
              // Delete all uploaded files in this request
              req.files.forEach((f) => {
                if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
              });
              return sendError(
                res,
                'INVALID_FILE_CONTENT',
                'File content signature is invalid. Only genuine JPEG, PNG, and WEBP images are allowed.',
                [{ field: fieldName, filename: file.originalname }],
                400
              );
            }
          }
        }
        return next();
      }

      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return sendError(
            res,
            'FILE_TOO_LARGE',
            'File size exceeds the 10MB limit. Please upload a smaller image.',
            [{ field: fieldName, maxSizeBytes: 10 * 1024 * 1024 }],
            400
          );
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return sendError(
            res,
            'TOO_MANY_FILES',
            `Too many files uploaded. Maximum allowed is ${maxCount} files per scan.`,
            [{ field: fieldName, maxCount }],
            400
          );
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return sendError(
            res,
            'UNEXPECTED_FIELD',
            `Unexpected field '${err.field}'. Expected file field name is '${fieldName}'.`,
            [],
            400
          );
        }
        return sendError(res, 'UPLOAD_ERROR', err.message, [], 400);
      }

      // AppError or other errors
      if (err instanceof AppError) {
        return sendError(res, err.code, err.message, err.details, err.statusCode);
      }

      return next(err);
    });
  };
};

/**
 * Middleware wrapper for multer single file upload with magic bytes validation
 * @param {string} fieldName 
 */
const uploadSingleImage = (fieldName = 'payment_proof') => {
  const multerMiddleware = upload.single(fieldName);

  return (req, res, next) => {
    multerMiddleware(req, res, (err) => {
      if (!err) {
        // Perform Magic Bytes verification on the uploaded file
        if (req.file) {
          if (!isValidImageMagicBytes(req.file.path)) {
            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return sendError(
              res,
              'INVALID_FILE_CONTENT',
              'File content signature is invalid. Only genuine JPEG, PNG, and WEBP images are allowed.',
              [{ field: fieldName, filename: req.file.originalname }],
              400
            );
          }
        }
        return next();
      }

      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return sendError(
            res,
            'FILE_TOO_LARGE',
            'File size exceeds the 10MB limit. Please upload a smaller image.',
            [{ field: fieldName, maxSizeBytes: 10 * 1024 * 1024 }],
            400
          );
        }
        return sendError(res, 'UPLOAD_ERROR', err.message, [], 400);
      }

      if (err instanceof AppError) {
        return sendError(res, err.code, err.message, err.details, err.statusCode);
      }

      return next(err);
    });
  };
};

module.exports = {
  uploadSquadImages,
  uploadSingleImage,
  isValidImageMagicBytes,
  UPLOAD_DIR,
};
