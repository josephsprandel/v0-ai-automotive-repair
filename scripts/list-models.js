const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  
  try {
    const models = await genAI.listModels();
    console.log('Available models:');
    for (const model of models) {
      console.log(`- ${model.name}`);
      console.log(`  Display Name: ${model.displayName}`);
      console.log(`  Supported Methods: ${model.supportedGenerationMethods.join(', ')}`);
      console.log('');
    }
  } catch (error) {
    console.error('Error listing models:', error);
  }
}

listModels();
