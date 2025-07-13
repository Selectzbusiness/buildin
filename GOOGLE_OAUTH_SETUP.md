# Google OAuth Setup Guide for Job Connect App

This guide will help you enable Gmail/Google sign-in for your Job Connect app using Supabase as the backend.

## Prerequisites

- Supabase project set up
- Google Cloud Console access
- React app with Supabase client configured

## Step 1: Configure Google OAuth in Google Cloud Console

### 1.1 Create/Select Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Make sure the project is active

### 1.2 Enable Google+ API

1. In the Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for "Google+ API" or "Google Identity"
3. Click on it and press **Enable**

### 1.3 Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client IDs**
3. Choose **Web application** as the application type
4. Fill in the following details:
   - **Name**: `Job Connect Web App` (or your preferred name)
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (for development)
     - `https://your-production-domain.com` (for production)
   - **Authorized redirect URIs**:
     - `https://your-project-ref.supabase.co/auth/v1/callback`
     - `http://localhost:3000/auth/callback` (for development)
     - `https://your-production-domain.com/auth/callback` (for production)

5. Click **Create**
6. Copy the **Client ID** and **Client Secret** (you'll need these for Supabase)

## Step 2: Configure Supabase Authentication

### 2.1 Enable Google Provider in Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** → **Providers**
4. Find **Google** in the list
5. Click **Enable**
6. Enter the credentials from Google Cloud Console:
   - **Client ID**: Your Google OAuth Client ID
   - **Client Secret**: Your Google OAuth Client Secret
7. Click **Save**

### 2.2 Configure Site URL

1. In Supabase Dashboard, go to **Authentication** → **Settings**
2. Set the **Site URL** to your domain:
   - Development: `http://localhost:3000`
   - Production: `https://your-production-domain.com`
3. Add redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://your-production-domain.com/auth/callback`

## Step 3: Environment Variables

Make sure your `.env` file has the correct Supabase configuration:

```env
REACT_APP_SUPABASE_URL=https://your-project-ref.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

## Step 4: Code Implementation

The following files have been updated to support Google OAuth:

### 4.1 Updated Components

1. **Login.tsx** - Added Google sign-in button
2. **Signup.tsx** - Added Google sign-up button  
3. **AuthCallback.tsx** - New component to handle OAuth redirects
4. **App.tsx** - Added auth callback route

### 4.2 Key Features Added

- Google OAuth buttons with proper styling
- Loading states for OAuth operations
- Error handling for OAuth failures
- Automatic profile creation for new OAuth users
- Role-based redirects after authentication
- Proper session management

## Step 5: Testing the Implementation

### 5.1 Development Testing

1. Start your development server: `npm start`
2. Navigate to `/login` or `/signup`
3. Click the "Continue with Google" button
4. Complete the Google OAuth flow
5. Verify you're redirected to the appropriate page based on your role

### 5.2 Production Testing

1. Deploy your app to production
2. Update Google Cloud Console with production URLs
3. Update Supabase settings with production URLs
4. Test the complete OAuth flow in production

## Step 6: Mobile App Integration

For mobile apps (React Native/Capacitor), you'll need additional configuration:

### 6.1 Capacitor Configuration

Add the following to your `capacitor.config.ts`:

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourcompany.jobconnect',
  appName: 'Job Connect',
  webDir: 'build',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    // Add any necessary plugins for OAuth
  }
};

export default config;
```

### 6.2 Android Configuration

For Android, you may need to add custom URL schemes to handle OAuth redirects.

## Step 7: Security Considerations

### 7.1 Environment Variables

- Never commit `.env` files to version control
- Use different OAuth credentials for development and production
- Regularly rotate your OAuth client secrets

### 7.2 CORS Configuration

Ensure your Supabase project has the correct CORS settings:

1. Go to **Settings** → **API**
2. Add your domains to the **CORS Origins** list
3. Include both development and production URLs

### 7.3 Rate Limiting

Consider implementing rate limiting for OAuth attempts to prevent abuse.

## Step 8: Troubleshooting

### Common Issues

1. **"Invalid redirect URI" error**
   - Check that your redirect URIs in Google Cloud Console match exactly
   - Ensure no trailing slashes or typos

2. **"OAuth provider not enabled" error**
   - Verify Google provider is enabled in Supabase
   - Check that Client ID and Secret are correct

3. **"Session not found" after OAuth**
   - Ensure AuthCallback component is properly handling the session
   - Check that the callback route is correctly configured

4. **Mobile OAuth not working**
   - Verify Capacitor configuration
   - Check that custom URL schemes are properly configured

### Debug Steps

1. Check browser console for errors
2. Verify Supabase logs in the dashboard
3. Test OAuth flow in incognito mode
4. Check network tab for failed requests

## Step 9: Production Deployment

### 9.1 Update URLs

Before deploying to production:

1. Update Google Cloud Console with production URLs
2. Update Supabase settings with production URLs
3. Update environment variables
4. Test the complete flow

### 9.2 Monitoring

Set up monitoring for:

- OAuth success/failure rates
- User registration through OAuth
- Any authentication errors

## Support

If you encounter issues:

1. Check the [Supabase Auth documentation](https://supabase.com/docs/guides/auth)
2. Review [Google OAuth documentation](https://developers.google.com/identity/protocols/oauth2)
3. Check the browser console and Supabase logs for specific error messages

## Additional Features

Consider implementing these additional features:

1. **Email verification**: Require email verification for OAuth users
2. **Profile completion**: Prompt users to complete their profile after OAuth
3. **Account linking**: Allow users to link multiple OAuth providers
4. **Social login analytics**: Track which OAuth providers are most popular

---

**Note**: This implementation provides a secure, user-friendly Google OAuth integration that works across web and mobile platforms. The code handles edge cases, provides proper error handling, and maintains consistency with your existing authentication flow. 