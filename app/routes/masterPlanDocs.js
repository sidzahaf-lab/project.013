// app/routes/masterPlanDocs.js
import express from 'express';
import masterPlanDocController from '../controllers/masterPlanDocController.js';
import fileUpload from 'express-fileupload';

const router = express.Router();

// File upload middleware
router.use(fileUpload({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  abortOnLimit: true,
  createParentPath: true,
  debug: process.env.NODE_ENV === 'development'
}));

// Check if doc_id exists
router.get('/check-doc-id/:doc_id', masterPlanDocController.checkDocIdExists);

// Create new master plan document
router.post('/', masterPlanDocController.createMasterPlanDoc);

// Get all master plan documents
router.get('/', masterPlanDocController.getAllMasterPlanDocs);

// Get master plan document by ID
router.get('/:id', masterPlanDocController.getMasterPlanDocById);

// FILE UPLOAD ROUTES
router.post('/upload', masterPlanDocController.uploadFile);
router.delete('/upload', masterPlanDocController.deleteFile);
router.get('/download/:doc_id/:fileName', masterPlanDocController.downloadFile);

export default router;