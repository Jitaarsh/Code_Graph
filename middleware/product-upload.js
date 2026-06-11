import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure upload directory exists
const uploadDir = 'uploads/products';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up storage engine
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Create unique filename: timestamp-random-originalName
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'productImage') {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) return cb(null, true);
        cb(new Error('Only images (JPEG, JPG, PNG, WEBP) are allowed for products'));
    } else if (file.fieldname === 'cataloguePdf') {
        const extname = path.extname(file.originalname).toLowerCase() === '.pdf';
        const mimetype = file.mimetype === 'application/pdf';
        if (extname && mimetype) return cb(null, true);
        cb(new Error('Only PDF files are allowed for catalogues'));
    } else {
        cb(null, true);
    }
};

// Initialize multer
const productUpload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: fileFilter
});

/**
 * Utility to delete a file from the server
 * @param {string} relativePath Path relative to the server root (e.g. 'uploads/products/...')
 */
export const deleteFile = (relativePath) => {
    if (!relativePath) return;
    const absolutePath = path.join(path.resolve(), relativePath);
    if (fs.existsSync(absolutePath)) {
        try {
            fs.unlinkSync(absolutePath);
        } catch (err) {
            console.error(`Failed to delete file: ${absolutePath}`, err);
        }
    }
};

export default productUpload;
