# Production Setup Guide for AI Feature

## Environment Variables for Production

To make the AI feature work in production, you need to set up the following environment variables in your hosting platform (Netlify, Vercel, etc.):

### Required Environment Variables

1. **REACT_APP_OPENROUTER_API_KEY**
   - Your OpenRouter API key
   - Format: `sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - Get from: https://openrouter.ai/

2. **REACT_APP_SITE_URL** (Optional)
   - Your production site URL
   - Example: `https://selectz.in`
   - Used for API referrer headers

3. **REACT_APP_AI_SERVICE_URL** (Optional)
   - Default: `https://openrouter.ai/api/v1/chat/completions`
   - Only change if using a different AI service

4. **REACT_APP_AI_MODEL** (Optional)
   - Default: `deepseek/deepseek-r1:free`
   - Alternative models: `gpt-3.5-turbo`, `claude-3-haiku`, etc.

## Netlify Setup

1. Go to your Netlify dashboard
2. Navigate to your site settings
3. Go to "Environment variables"
4. Add the following variables:

```
REACT_APP_OPENROUTER_API_KEY = your_actual_openrouter_api_key_here
REACT_APP_SITE_URL = https://your-site-url.com
```

5. Redeploy your site

## Vercel Setup

1. Go to your Vercel dashboard
2. Navigate to your project settings
3. Go to "Environment Variables"
4. Add the variables listed above
5. Redeploy your site

## Security Notes

- Never commit API keys to version control
- Use different API keys for development and production
- Monitor your API usage to avoid unexpected costs
- Consider implementing rate limiting for production use

## Troubleshooting

### Common Production Issues

1. **"AI service is temporarily unavailable"**
   - Check if environment variables are set correctly
   - Verify API key is valid and has sufficient credits
   - Check network connectivity

2. **"Authentication failed"**
   - Verify API key format and validity
   - Check if API key has proper permissions

3. **"Rate limit exceeded"**
   - Implement rate limiting on your end
   - Consider upgrading your OpenRouter plan

### Debug Steps

1. Check browser console for error messages
2. Verify environment variables are loaded in production
3. Test API key directly with OpenRouter
4. Check network tab for API call details

## Support

If you continue to have issues:
1. Check the browser console for detailed error messages
2. Verify your OpenRouter account has sufficient credits
3. Test the API key with a simple curl command
4. Contact support with the specific error message 