// AI Configuration
export const AI_CONFIG = {
  // API Configuration
  apiKey: (process.env.REACT_APP_OPENROUTER_API_KEY || '')
    .trim()
    .replace(/^"|"$/g, '')
    .replace(/^'|'$/g, ''),
  serviceUrl: process.env.REACT_APP_AI_SERVICE_URL || 'https://openrouter.ai/api/v1/chat/completions',
  model: process.env.REACT_APP_AI_MODEL || 'deepseek/deepseek-r1:free',
  
  // Headers - Updated for better security
  headers: {
    // OpenRouter requires the HTTP-Referer to match the real site origin.
    // Use the current browser origin in dev/prod; fall back to configured site URL.
    'HTTP-Referer': (typeof window !== 'undefined' && window.location?.origin)
      ? window.location.origin
      : (process.env.REACT_APP_SITE_URL || 'http://localhost:3000'),
    'X-Title': 'Selectz AI Assistant',
    'Content-Type': 'application/json',
  },
  
  // System prompts for different contexts
  systemPrompts: {
    'job-search': `You are Selectz Job AI, a specialized assistant for job seekers and career development. 
    You provide expert advice on:
    - Job search strategies and techniques
    - Resume writing and optimization
    - Interview preparation and techniques
    - Career development and planning
    - Professional networking
    - Salary negotiation
    - Industry insights and trends
    
    Context: I'm helping you with job search. Ask me about finding jobs, optimizing your search, or job market insights.
    
    Provide practical, actionable advice. Be encouraging and professional. Keep responses concise but comprehensive.`,
    
    'resume': `You are Selectz Job AI, a specialized assistant for job seekers and career development. 
    You provide expert advice on:
    - Job search strategies and techniques
    - Resume writing and optimization
    - Interview preparation and techniques
    - Career development and planning
    - Professional networking
    - Salary negotiation
    - Industry insights and trends
    
    Context: I'm helping you with resume writing and optimization. Ask me about resume tips, formatting, or content suggestions.
    
    Provide practical, actionable advice. Be encouraging and professional. Keep responses concise but comprehensive.`,
    
    'interview': `You are Selectz Job AI, a specialized assistant for job seekers and career development. 
    You provide expert advice on:
    - Job search strategies and techniques
    - Resume writing and optimization
    - Interview preparation and techniques
    - Career development and planning
    - Professional networking
    - Salary negotiation
    - Industry insights and trends
    
    Context: I'm helping you with interview preparation. Ask me about interview tips, common questions, or how to present yourself.
    
    Provide practical, actionable advice. Be encouraging and professional. Keep responses concise but comprehensive.`,
    
    'career': `You are Selectz Job AI, a specialized assistant for job seekers and career development. 
    You provide expert advice on:
    - Job search strategies and techniques
    - Resume writing and optimization
    - Interview preparation and techniques
    - Career development and planning
    - Professional networking
    - Salary negotiation
    - Industry insights and trends
    
    Context: I'm helping you with career guidance. Ask me about career paths, skill development, or professional growth.
    
    Provide practical, actionable advice. Be encouraging and professional. Keep responses concise but comprehensive.`,
    
    'general': `You are Selectz AI Assistant, a helpful AI assistant for a job matching and recruitment platform. 
    You help users with:
    - Job search advice and tips
    - Resume writing and optimization
    - Interview preparation
    - Career guidance
    - Platform usage questions
    - General job market insights
    
    Be professional, helpful, and provide actionable advice. Keep responses concise but informative.`
  }
};

// Helper function to check if API key is configured
export const isApiKeyConfigured = (): boolean => {
  const apiKey = AI_CONFIG.apiKey;
  return !!(apiKey && 
    apiKey !== 'your_openrouter_api_key_here' && 
    apiKey !== 'YOUR_DEEPSEEK_API_KEY_HERE' &&
    apiKey.trim().length > 0 &&
    apiKey !== 'undefined' &&
    apiKey !== 'null'
  );
};

// Always show debug info (will be removed later)
console.log('🔍 AI CONFIGURATION DEBUG:', {
  hasApiKey: !!AI_CONFIG.apiKey,
  apiKeyLength: AI_CONFIG.apiKey?.length || 0,
  envVarExists: !!process.env.REACT_APP_OPENROUTER_API_KEY,
  apiKeyFirstChars: AI_CONFIG.apiKey ? AI_CONFIG.apiKey.substring(0, 15) + '...' : 'NOT SET',
  isConfigured: isApiKeyConfigured(),
  environment: process.env.NODE_ENV,
  serviceUrl: AI_CONFIG.serviceUrl,
  model: AI_CONFIG.model
});

if (!AI_CONFIG.apiKey) {
  console.error('❌ ERROR: REACT_APP_OPENROUTER_API_KEY is not set!');
  console.log('📝 To fix this:');
  console.log('1. Create a file named .env.local in the job-connect directory');
  console.log('2. Add: REACT_APP_OPENROUTER_API_KEY=your_actual_api_key_here');
  console.log('3. Restart your development server');
}

// Helper function to get API key with error handling
export const getApiKey = (): string => {
  if (!isApiKeyConfigured()) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('AI service is not configured for production. Please contact support.');
    } else {
      throw new Error('OpenRouter API key not configured. Place REACT_APP_OPENROUTER_API_KEY in job-connect/.env.local and restart the dev server.');
    }
  }
  return AI_CONFIG.apiKey!;
};

// Helper function to validate OpenRouter API key format
export const validateApiKeyFormat = (apiKey: string): boolean => {
  return apiKey.startsWith('sk-or-v1-') && apiKey.length > 20;
};

// Helper function to get API configuration status
export const getApiConfigStatus = () => {
  return {
    hasApiKey: !!AI_CONFIG.apiKey,
    apiKeyFormat: AI_CONFIG.apiKey ? validateApiKeyFormat(AI_CONFIG.apiKey) : false,
    serviceUrl: AI_CONFIG.serviceUrl,
    model: AI_CONFIG.model,
    isConfigured: isApiKeyConfigured(),
    environment: process.env.NODE_ENV,
    envCheck: {
      envVarExists: !!process.env.REACT_APP_OPENROUTER_API_KEY,
      envVarValue: process.env.REACT_APP_OPENROUTER_API_KEY ? 'Set' : 'Not Set'
    }
  };
};

// Helper function to make AI API call
export const makeAIApiCall = async (
  messages: Array<{ role: string; content: string }>,
  context: keyof typeof AI_CONFIG.systemPrompts = 'general'
): Promise<string> => {
  // Check if API key is configured
  if (!isApiKeyConfigured()) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('AI service is temporarily unavailable. Please try again later.');
    } else {
      throw new Error('AI service is not properly configured. Please contact support for assistance.');
    }
  }

  const apiKey = getApiKey();
  
  try {
    const response = await fetch(AI_CONFIG.serviceUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': AI_CONFIG.headers['HTTP-Referer'],
        'X-Title': AI_CONFIG.headers['X-Title'],
      },
      body: JSON.stringify({
        model: AI_CONFIG.model,
        messages: [
          {
            role: 'system',
            content: AI_CONFIG.systemPrompts[context]
          },
          ...messages
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || response.statusText;
      console.error('OpenRouter error detail:', { status: response.status, error: errorData });
      
      // Handle specific API errors with more detail
      if (response.status === 401) {
        throw new Error(`Authentication failed: ${errorMessage}. Verify API key and allowed origins for ${AI_CONFIG.headers['HTTP-Referer']}.`);
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      } else if (response.status >= 500) {
        throw new Error('AI service is temporarily unavailable. Please try again later.');
      } else {
        throw new Error(`AI service error: ${errorMessage}`);
      }
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`AI service error: ${data.error.message || 'Unknown error'}`);
    }
    
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No response received from AI service.');
    }
    
    return content;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Network error: Unable to connect to AI service');
  }
};