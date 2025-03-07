#!/usr/bin/env node

/**
 * This script creates an OpenAI Assistant for behavior trait analysis
 * Usage: node create-openai-assistant.js
 */

import { config } from 'dotenv';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

// Load environment variables
config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY environment variable is not set.');
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// Instructions for the behavior analysis assistant
const instructions = `
You are an expert behavioral psychologist specializing in professional development.

Your role is to analyze professional behavior traits and provide insightful, personalized analysis based on assessment data.

Guidelines:
1. Write in Portuguese (Brazil) with a professional but supportive tone
2. Focus on specific insights related to the provided data, not generic statements
3. Provide actionable recommendations for professional development
4. Always structure your response in the JSON format specified in the prompt
5. Emphasize strengths while providing constructive feedback on development areas
6. Tailor your analysis to the individual's specific behavioral profile
7. Avoid clinical language; focus on workplace applications and professional growth
8. When analyzing trait scores, consider both the absolute value and relative importance

You specialize in analyzing behavior traits measured on 1-5 scales, where each trait represents a spectrum between opposite qualities (e.g., "autonomous" vs "team-oriented"). Your goal is to help professionals understand their natural tendencies and how to leverage them effectively.
`;

// Create the assistant
async function createAssistant() {
  try {
    console.log('Creating OpenAI Assistant for behavior analysis...');
    
    const assistant = await openai.beta.assistants.create({
      name: "Behavior Trait Analyst",
      description: "Analyzes professional behavior traits and provides personalized insights and recommendations",
      instructions: instructions,
      model: "gpt-4-turbo",
      tools: [],
    });
    
    console.log('Assistant created successfully!');
    console.log(`Assistant ID: ${assistant.id}`);
    
    // Save the assistant ID to a file
    const configData = {
      assistantId: assistant.id,
      createdAt: new Date().toISOString()
    };
    
    fs.writeFileSync(
      path.join(process.cwd(), 'openai-assistant-config.json'),
      JSON.stringify(configData, null, 2)
    );
    
    console.log('Configuration saved to openai-assistant-config.json');
    console.log('\nNext steps:');
    console.log('1. Set the Assistant ID in your Supabase project:');
    console.log(`   supabase secrets set OPENAI_ASSISTANT_ID=${assistant.id} --project-ref your-project-ref`);
    
    return assistant;
  } catch (error) {
    console.error('Error creating OpenAI Assistant:', error);
    process.exit(1);
  }
}

createAssistant();