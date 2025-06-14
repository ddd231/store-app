# Supabase Environment Variables Setup

This project uses environment variables to securely manage Supabase credentials. Follow these steps to set up your environment.

## Quick Start

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Get your Supabase credentials:**
   - Go to your [Supabase Dashboard](https://app.supabase.com)
   - Select your project
   - Go to Settings → API
   - Copy your Project URL and anon public key

3. **Update the `.env` file with your credentials:**
   ```env
   # For React web apps
   REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here

   # For Expo/React Native apps
   EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## Environment Variable Naming Conventions

### React Web Applications
- Use `REACT_APP_` prefix for all custom environment variables
- Example: `REACT_APP_SUPABASE_URL`

### Expo/React Native Applications
- Use `EXPO_PUBLIC_` prefix for all custom environment variables
- Example: `EXPO_PUBLIC_SUPABASE_URL`

## File Structure

```
project-root/
├── .env                    # Your local environment variables (git ignored)
├── .env.example           # Example environment file (committed to git)
├── .gitignore             # Ensures .env is not committed
├── app.config.js          # Expo configuration
└── src/
    ├── services/
    │   ├── supabaseClient.js   # Supabase client (JavaScript)
    │   └── supabaseClient.ts   # Supabase client (TypeScript)
    ├── utils/
    │   ├── config.js           # Configuration helper (JavaScript)
    │   └── config.ts           # Configuration helper (TypeScript)
    └── types/
        └── env.d.ts            # TypeScript environment variable types
```

## Security Best Practices

1. **Never commit `.env` files to version control**
   - The `.gitignore` file is configured to exclude all `.env` files

2. **Use the anon/public key only**
   - Never use the service role key in client-side code
   - The anon key is safe to use in client-side applications

3. **Validate environment variables**
   - The configuration files include validation to ensure required variables are present

4. **Different environments**
   - Create separate `.env` files for different environments:
     - `.env.local` for local development
     - `.env.production` for production builds

## Troubleshooting

### Missing Environment Variables Error
If you see an error like "Missing required configuration: supabaseUrl, supabaseAnonKey", ensure:
1. You've created the `.env` file
2. The environment variables are correctly named
3. You've restarted your development server after adding the variables

### Expo-specific Issues
For Expo apps:
1. Clear the cache: `expo start -c`
2. Ensure you're using `EXPO_PUBLIC_` prefix
3. Check that `app.config.js` is properly configured

### React Web-specific Issues
For React web apps:
1. Restart the development server after changing `.env`
2. Ensure you're using `REACT_APP_` prefix
3. Variables are accessed via `process.env.REACT_APP_*`

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [React Environment Variables](https://create-react-app.dev/docs/adding-custom-environment-variables/)
- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)