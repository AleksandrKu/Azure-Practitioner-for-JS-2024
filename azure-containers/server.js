const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 4000;

// Get container registry name from environment variable
const registryName = process.env.CONTAINER_REGISTRY_NAME || 'registry-not-set';
const apiKey = process.env.OPENAI_API_KEY;

// Enable CORS for all routes with proper configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://stgsandfrontendne002.z16.web.core.windows.net',
    'https://chatbotne001-web-app-chatbot.azurewebsites.net'
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204
}));

// Add CORS headers manually for all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', true);
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(204).send();
  }
  next();
});

// Parse JSON bodies
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok!' });
});

// Chat endpoint
app.post('/chat', async (req, res) => {
  const message = req.body.message || '';
  console.log(`Received message: ${message}`);
  
  if (!apiKey) {
    console.error('OpenAI API key not found');
    return res.status(500).json({ 
      error: 'OpenAI API key not configured'
    });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{
          role: "user",
          content: message
        }],
        temperature: 0.7
      })
    });

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    console.log('OpenAI response:', aiResponse);
    
    res.json({
      response: aiResponse,
      containerRegistry: registryName,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    res.status(500).json({ 
      error: 'Failed to get response from OpenAI',
      details: error.message
    });
  }
});

// Fallback route
app.get('*', (req, res) => {
  const name = req.query.name || "World";
  console.log(`Registry name: ${registryName}`);
  res.json({
    message: `Hi ${name}`,
    containerRegistry: registryName,
    timestamp: new Date().toISOString()
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

