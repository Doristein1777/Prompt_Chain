require('dotenv').config();
const Airtable = require('airtable');

// Configuration
const BATCH_SIZE = 100;
const BASE_ID = process.env.AIRTABLE_BASE_ID;
const API_KEY = process.env.AIRTABLE_API_KEY;

const base = new Airtable({ apiKey: API_KEY }).base(BASE_ID);

function isWithinWorkHours() {
  const now = new Date();
  const hour = now.getUTCHours();
  const START_HOUR = 9;  // 9 AM UTC
  const END_HOUR = 17;   // 5 PM UTC
  return hour >= START_HOUR && hour < END_HOUR;
}

function getRandomDelay() {
  const MIN_DELAY = 3000;  // 3 seconds
  const MAX_DELAY = 10000; // 10 seconds
  return Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY + 1)) + MIN_DELAY;
}

async function processRecords() {
  if (!isWithinWorkHours()) {
    console.log('Outside of working hours. Exiting.');
    return;
  }

  try {
    // Get records that haven't been processed yet
    const records = await base('Table 1')  // Replace 'Table 1' with your actual table name
      .select({
        filterByFormula: "AND({Perplexity output} = '')",
        maxRecords: BATCH_SIZE
      })
      .firstPage();

    console.log(`Processing ${records.length} records`);

    for (const record of records) {
      try {
        const prompt = record.get('Perplexity prompt');

        if (!prompt || prompt.toString().trim() === '') {
          continue;
        }

        // Update status
        await base('Table 1').update(record.id, {
          'Perplexity output': 'Processing...'
        });

        // Simulated API call
        const response = await makePerplexityAPICall(prompt);

        // Update record with response
        await base('Table 1').update(record.id, {
          'Perplexity output': response
        });
        console.log(`Updated record ${record.id}`);

        // Random delay between requests
        const delay = getRandomDelay();
        console.log(`Waiting ${delay}ms before next request...`);
        await new Promise(resolve => setTimeout(resolve, delay));

      } catch (error) {
        console.error(`Error processing record ${record.id}:`, error);
        await base('Table 1').update(record.id, {
          'Perplexity output': `Error: ${error.toString()}`
        });
      }
    }
  } catch (error) {
    console.error('Error fetching records:', error);
  }
}

// Simulated Perplexity API Call
async function makePerplexityAPICall(prompt) {
  // Replace with your actual API integration
  return `Response for prompt: ${prompt}`;
}

// Start processing
processRecords();

