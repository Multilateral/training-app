const fs = require('fs');
const path = require('path');

// Read CLINICAL_EXERCISES from sync_clinical_exercises.js
const { execSync } = require('child_process');

const filePath = path.resolve('src/data/recoveryMetadata.js');
let content = fs.readFileSync(filePath, 'utf8');

// Load clinical exercises definitions
const syncScript = require('./sync_clinical_exercises.js');
// Since sync_clinical_exercises runs on require, we can require or recreate data
