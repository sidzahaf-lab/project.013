// app/controllers/masterPlanDocController.js
import { MasterPlanDoc } from '../models/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const ensureUploadsDir = () => {
  const uploadsDir = path.join(__dirname, '../../uploads/master-plans');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  return uploadsDir;
};

// Simplify long file types to fit database column
const simplifyFileType = (fileType) => {
  if (!fileType) return null;
  
  const typeMap = {
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'application/msword': 'doc',
    'application/pdf': 'pdf',
    'text/plain': 'txt'
  };
  
  return typeMap[fileType] || fileType.substring(0, 20);
};

const masterPlanDocController = {
  // Check if doc_id exists
  async checkDocIdExists(req, res) {
    try {
      const { doc_id } = req.params;
      
      if (!doc_id) {
        return res.status(400).json({ error: 'Document ID is required' });
      }

      const docPlan = await MasterPlanDoc.findOne({
        where: { doc_id }
      });
      
      res.json({ exists: !!docPlan });
    } catch (error) {
      console.error('Error checking document ID:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Create new master plan document
  async createMasterPlanDoc(req, res) {
    try {
      console.log('=== CREATE MASTER PLAN DOC REQUEST ===');
      console.log('Request body:', req.body);

      const {
        doc_id,
        doc_type,
        doc_title,
        revision_no,
        year,
        quarter,
        owner,
        status,
        doc_status = 'Open',
        is_uploaded = false,
        uploaded_file,
        file_type,
        file_size,
        storage_path,
        download_url,
        uploaded_at
      } = req.body;

      // Validate required fields
      const requiredFields = { doc_id, doc_type, doc_title, revision_no, year, owner, status };
      const missingFields = Object.entries(requiredFields)
        .filter(([key, value]) => !value)
        .map(([key]) => key);

      if (missingFields.length > 0) {
        console.log('Missing required fields:', missingFields);
        return res.status(400).json({ 
          message: `Missing required fields: ${missingFields.join(', ')}` 
        });
      }

      // Check if doc_id already exists
      console.log('Checking if doc_id exists:', doc_id);
      const existingDoc = await MasterPlanDoc.findOne({ where: { doc_id } });
      if (existingDoc) {
        console.log('Document ID already exists:', doc_id);
        return res.status(400).json({ message: 'Document ID already exists' });
      }

      // Prepare data for database
      const dbData = {
        doc_id,
        doc_type,
        doc_title,
        revision_no,
        year: parseInt(year),
        quarter: quarter || null,
        owner,
        status,
        doc_status,
        is_uploaded: Boolean(is_uploaded),
        uploaded_file: uploaded_file || null,
        file_type: simplifyFileType(file_type) || file_type?.substring(0, 50),
        file_size: file_size ? parseInt(file_size) : null,
        storage_path: storage_path || null,
        download_url: download_url || null,
        uploaded_at: uploaded_at || null,
        created_at: new Date(),
        updated_at: new Date()
      };

      console.log('Data prepared for database:', dbData);

      // Create the document
      console.log('Creating new document in database...');
      const masterPlanDoc = await MasterPlanDoc.create(dbData);

      console.log('✅ Document created successfully with ID:', masterPlanDoc.id);
      
      res.status(201).json({
        message: 'Master Plan Document created successfully',
        data: masterPlanDoc
      });

    } catch (error) {
      console.error('❌ ERROR creating master plan document:');
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      
      if (error.errors) {
        console.error('Validation errors:');
        error.errors.forEach(err => {
          console.error(`  - ${err.path}: ${err.message} (value: ${err.value})`);
        });
      }
      
      // Handle specific Sequelize errors
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ 
          message: 'Document ID already exists in database' 
        });
      }
      
      if (error.name === 'SequelizeValidationError') {
        const validationErrors = error.errors.map(err => ({
          field: err.path,
          message: err.message,
          value: err.value
        }));
        
        return res.status(400).json({ 
          message: 'Data validation failed',
          errors: validationErrors
        });
      }
      
      if (error.name === 'SequelizeDatabaseError') {
        return res.status(400).json({ 
          message: 'Database error - check field types and constraints' 
        });
      }
      
      // Generic error response
      res.status(500).json({ 
        message: 'Internal server error while saving to database',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Database operation failed'
      });
    }
  },

  // Get all master plan documents
  async getAllMasterPlanDocs(req, res) {
    try {
      const masterPlanDocs = await MasterPlanDoc.findAll({
        order: [['created_at', 'DESC']]
      });
      res.json({ data: masterPlanDocs });
    } catch (error) {
      console.error('Error fetching master plan documents:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Get master plan document by ID
  async getMasterPlanDocById(req, res) {
    try {
      const { id } = req.params;
      const masterPlanDoc = await MasterPlanDoc.findByPk(id);

      if (!masterPlanDoc) {
        return res.status(404).json({ message: 'Master Plan Document not found' });
      }

      res.json({ data: masterPlanDoc });
    } catch (error) {
      console.error('Error fetching master plan document:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // File upload handler
  async uploadFile(req, res) {
    try {
      console.log('Upload request received:', {
        files: req.files ? Object.keys(req.files) : 'no files',
        body: req.body
      });

      if (!req.files || !req.files.document) {
        return res.status(400).json({ 
          success: false,
          message: 'No file uploaded' 
        });
      }

      const document = req.files.document;
      const { doc_id, doc_type, revision_no } = req.body;

      // Validate required metadata
      if (!doc_id || !doc_type || !revision_no) {
        return res.status(400).json({
          success: false,
          message: 'All metadata (doc_id, doc_type, revision_no) is required for file upload'
        });
      }

      console.log('File details:', {
        name: document.name,
        size: document.size,
        mimetype: document.mimetype
      });

      // Validate file size (10MB max)
      if (document.size > 10 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: 'File size must be less than 10MB'
        });
      }

      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain'
      ];

      if (!allowedTypes.includes(document.mimetype)) {
        return res.status(400).json({
          success: false,
          message: 'File type not supported'
        });
      }

      ensureUploadsDir();
      const uploadsDir = path.join(__dirname, '../../uploads/master-plans');
      
      // Create doc_id folder
      const docFolder = path.join(uploadsDir, doc_id);
      if (!fs.existsSync(docFolder)) {
        fs.mkdirSync(docFolder, { recursive: true });
      }

      // Generate unique filename with doc_id and timestamp
      const fileExtension = path.extname(document.name);
      const baseName = path.basename(document.name, fileExtension);
      const timestamp = Date.now();
      const uniqueFileName = `${doc_id}_${baseName}_${timestamp}${fileExtension}`;
      
      const filePath = path.join(docFolder, uniqueFileName);

      console.log('Saving file to:', filePath);

      // Move file to uploads directory - PERMANENT STORAGE
      await document.mv(filePath);

      const storagePath = `/uploads/master-plans/${doc_id}/${uniqueFileName}`;
      const downloadUrl = `/api/masterplandocs/download/${doc_id}/${uniqueFileName}`;

      res.json({
        success: true,
        message: 'File uploaded successfully and stored permanently',
        fileName: uniqueFileName,
        originalName: document.name,
        fileSize: document.size,
        fileType: document.mimetype,
        storagePath: storagePath,
        downloadUrl: downloadUrl
      });

    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({
        success: false,
        message: 'File upload failed',
        error: error.message
      });
    }
  },

  // File delete handler
  async deleteFile(req, res) {
    try {
      const { filePath, doc_id } = req.body;

      if (!filePath) {
        return res.status(400).json({
          success: false,
          message: 'File path is required'
        });
      }

      const fullPath = path.join(__dirname, '../..', filePath);
      console.log('Deleting file:', fullPath);
      
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        res.json({
          success: true,
          message: 'File deleted successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'File not found'
        });
      }

    } catch (error) {
      console.error('File delete error:', error);
      res.status(500).json({
        success: false,
        message: 'File deletion failed',
        error: error.message
      });
    }
  },

  // Download file handler
  async downloadFile(req, res) {
    try {
      const { doc_id, fileName } = req.params;
      
      if (!doc_id || !fileName) {
        return res.status(400).json({ message: 'Document ID and file name are required' });
      }

      const filePath = path.join(__dirname, '../../uploads/master-plans', doc_id, fileName);

      if (fs.existsSync(filePath)) {
        res.download(filePath);
      } else {
        res.status(404).json({ message: 'File not found' });
      }
    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({ message: 'Download failed' });
    }
  }
};

export default masterPlanDocController;