#!/usr/bin/env node

/**
 * This script creates an OpenAI Assistant for behavior trait analysis
 * Usage: node create-openai-assistant.js
 */

import { config } from 'dotenv';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config();

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

// Try to get API key from different sources
async function getApiKey() {
  // First try: direct from environment variable
  const directApiKey = process.env.OPENAI_API_KEY;
  if (directApiKey) {
    console.log('Using OpenAI API key from environment variable');
    return directApiKey;
  }
  
  console.log('No API key found in environment variables, checking Supabase...');
  
  // Second try: from Supabase
  try {
    // Get Supabase credentials
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Error: Supabase credentials not found in environment variables.');
      console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
      process.exit(1);
    }
    
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // IMPORTANT: You need to set up a table with API keys in your Supabase project
    // Replace these values with your actual configuration:
    const tableName = 'api_keys';  // Your table name
    const columnName = 'key_value'; // Column containing the API key
    const identifier = 'openai';    // Identifier for the OpenAI API key
    
    // Fetch the API key
    const { data, error } = await supabase
      .from(tableName)
      .select(columnName)
      .eq('name', identifier)
      .single();
    
    if (error) {
      console.error('Error fetching API key from Supabase:', error);
      return null;
    }
    
    if (!data || !data[columnName]) {
      console.error('API key not found in Supabase');
      return null;
    }
    
    console.log('Using OpenAI API key from Supabase');
    return data[columnName];
  } catch (error) {
    console.error('Error accessing Supabase:', error);
    return null;
  }
}

async function createAssistant() {
  try {
    const OPENAI_API_KEY = await getApiKey();
    if (!OPENAI_API_KEY) {
      console.error('Failed to retrieve API key from any source');
      console.error('Please set OPENAI_API_KEY in your environment or configure Supabase API key storage');
      process.exit(1);
    }

    const openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });

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