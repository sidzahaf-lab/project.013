// test-db-insert.js
import dotenv from 'dotenv';
import { sequelize, MasterPlanDoc } from './app/models/index.js';

dotenv.config();

async function testDatabaseInsert() {
  try {
    console.log('🔍 Testing database connection and insert...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    // Generate unique test ID to avoid conflicts
    const testId = 'TEST-' + Date.now();
    
    // Test data that matches your table structure
    const testData = {
      doc_id: testId,
      doc_type: 'Test Document',
      doc_title: 'Test Document Title',
      revision_no: '1.0',
      year: 2024,
      quarter: 'Q1',
      owner: 'Test Owner',
      status: 'Draft',
      doc_status: 'Open',
      is_uploaded: true,
      uploaded_file: 'test.pdf',
      file_type: 'application/pdf',
      file_size: 1024,
      storage_path: `/uploads/master-plans/${testId}/test.pdf`,
      download_url: `/api/masterplandocs/download/${testId}/test.pdf`,
      uploaded_at: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    };

    console.log('📝 Test data to insert:');
    console.log(JSON.stringify(testData, null, 2));
    
    console.log('💾 Attempting to insert test record...');
    const result = await MasterPlanDoc.create(testData);
    
    console.log('✅ SUCCESS: Test record created successfully!');
    console.log(`   Document ID: ${result.doc_id}`);
    console.log(`   Database ID: ${result.id}`);
    
    // Verify the record was actually saved
    console.log('🔎 Verifying record was saved...');
    const savedRecord = await MasterPlanDoc.findOne({ where: { doc_id: testId } });
    
    if (savedRecord) {
      console.log('✅ VERIFICATION: Record found in database!');
      console.log(`   Title: ${savedRecord.doc_title}`);
      console.log(`   Type: ${savedRecord.doc_type}`);
    } else {
      console.log('❌ VERIFICATION: Record not found in database!');
    }
    
    // Clean up - remove test record
    console.log('🧹 Cleaning up test record...');
    await MasterPlanDoc.destroy({ where: { doc_id: testId } });
    console.log('✅ Test record cleaned up.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ DATABASE TEST FAILED:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    if (error.errors) {
      console.error('Validation errors:');
      error.errors.forEach(err => {
        console.error(`  - Field: ${err.path}`);
        console.error(`    Message: ${err.message}`);
        console.error(`    Value: ${err.value}`);
      });
    }
    
    if (error.parent) {
      console.error('Database error:', error.parent.message);
    }
    
    process.exit(1);
  }
}

testDatabaseInsert();