# AI API Setup Guide

This guide explains how to configure the OpenRouter API for your Selectz job platform.

## Environment Variables Setup

### 1. Create/Update `.env` file

Add the following environment variables to your `.env` file in the root directory:

```env
# OpenRouter API Configuration
REACT_APP_OPENROUTER_API_KEY=your_actual_openrouter_api_key_here

# AI Service Configuration (optional - defaults provided)
REACT_APP_AI_SERVICE_URL=https://openrouter.ai/api/v1/chat/completions
REACT_APP_AI_MODEL=deepseek/deepseek-r1:free
```

### 2. Getting Your API Key

#### Using OpenRouter
1. Go to [OpenRouter](https://openrouter.ai/)
2. Sign up for an account
3. Add credits to your account
4. Get your API key from the dashboard
5. Use the API key in `REACT_APP_OPENROUTER_API_KEY`

## AI Components

The following components have been updated to use environment variables:

### 1. JobAI Component (`src/components/JobAI.tsx`)
- Context-aware AI assistant for job-related queries
- Supports different contexts: job-search, resume, interview, career, general
- Uses centralized AI configuration

### 2. AIAssistant Component (`src/components/AIAssistant.tsx`)
- Floating chat assistant
- Maintains conversation history
- Uses centralized AI configuration

### 3. AI Configuration (`src/config/ai.ts`)
- Centralized configuration for all AI components
- Environment variable management
- Helper functions for API calls
- System prompts for different contexts

### 4. Static HTML (`src/ai-assistant.html`)
- Standalone HTML file with AI functionality
- Requires manual API key configuration in the `AI_CONFIG` object

## Usage

### React Components
The AI components will automatically use the environment variables once configured:

```tsx
import JobAI from './components/JobAI';
import AIAssistant from './components/AIAssistant';

// JobAI with specific context
<JobAI context="interview" className="mt-8" />

// Floating AI Assistant
<AIAssistant size="large" />
```

### Static HTML
For the static HTML file, update the `AI_CONFIG` object:

```javascript
const AI_CONFIG = {
  apiKey: 'your_actual_openrouter_api_key_here',
  serviceUrl: 'https://openrouter.ai/api/v1/chat/completions',
  model: 'deepseek/deepseek-r1:free'
};
```

## Error Handling

The components include error handling for:
- Missing API key configuration
- Network errors
- API response errors

If the API key is not configured, users will see a helpful error message.

## Security Notes

1. **Never commit API keys to version control**
2. The `.env` file is already in `.gitignore`
3. Use environment variables for all sensitive configuration
4. Consider using different API keys for development and production

## Troubleshooting

### Common Issues

1. **"API key not configured" error**
   - Check that your `.env` file exists in the root directory
   - Verify the environment variable names are correct
   - Restart your development server after adding environment variables

2. **"Network error" or "API error"**
   - Check your internet connection
   - Verify your API key is valid
   - Check if you have sufficient credits (if using OpenRouter)

3. **Environment variables not loading**
   - Make sure the `.env` file is in the root directory (same level as `package.json`)
   - Restart your development server
   - Check that variable names start with `REACT_APP_`

### Development vs Production

- **Development**: Use `.env.local` for local development
- **Production**: Set environment variables in your hosting platform (Netlify, Vercel, etc.)

## API Limits and Costs

- **OpenRouter**: Pay-per-use model, check their pricing
- Monitor your usage to avoid unexpected costs

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your API key is working with a simple test
3. Check the network tab for API call details
4. Ensure your environment variables are properly set 