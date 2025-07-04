# React Hooks Error Resolution Guide

This guide helps you fix common React Hook errors in your chat application.

## Common React Hook Errors and Solutions

### 1. "Invalid hook call" Error

**Symptoms:**
- Error: "Hooks can only be called inside of the body of a function component"
- Hooks not working as expected

**Common Causes:**
1. **Multiple React versions** - Most common cause
2. Calling hooks outside React components
3. Calling hooks from regular JavaScript functions
4. Using hooks in class components

**Solutions:**

#### Check for Multiple React Versions:
```bash
# Check React installations
npm run check:react

# Fix duplicate React
npm run fix:dedupe

# Or manually check
npm ls react
npm ls react-dom
```

#### Ensure Proper Hook Usage:
```typescript
// ❌ BAD - Hook in regular function
function getData() {
  const [data, setData] = useState(); // ERROR!
  return data;
}

// ✅ GOOD - Hook in React component
function MyComponent() {
  const [data, setData] = useState();
  return <div>{data}</div>;
}

// ✅ GOOD - Hook in custom hook
function useData() {
  const [data, setData] = useState();
  return data;
}
```

### 2. "Rendered more/fewer hooks than expected" Error

**Symptoms:**
- Error appears after state changes
- Component crashes on re-render

**Common Causes:**
1. Conditional hook calls
2. Hooks inside loops
3. Early returns before hooks

**Solutions:**

```typescript
// ❌ BAD - Conditional hooks
function ChatComponent({ isLoggedIn }) {
  if (isLoggedIn) {
    const [messages, setMessages] = useState([]); // ERROR!
  }
}

// ✅ GOOD - Always call hooks
function ChatComponent({ isLoggedIn }) {
  const [messages, setMessages] = useState([]);
  
  if (!isLoggedIn) {
    return <div>Please log in</div>;
  }
  
  return <div>{messages.length} messages</div>;
}
```

### 3. Hook Call Order Issues

**Always follow these rules:**

1. **Only call hooks at the top level**
   - Not inside loops
   - Not inside conditions
   - Not inside nested functions

2. **Only call hooks from:**
   - React function components
   - Custom hooks (functions starting with "use")

3. **Same order every render**
   - React relies on hook call order
   - Don't conditionally skip hooks

## Using the Hook Validator

We've included a hook validator to help debug issues:

```typescript
import { validator } from './hooks/hookValidator';

// Check for React version issues
validator.checkReactVersions();

// Log full validation report
validator.logReport();
```

## Project-Specific Solutions

### For React Native/Expo Projects

1. **Check metro bundler cache:**
```bash
# Clear metro cache
npx react-native start --reset-cache

# For Expo
expo start -c
```

2. **Ensure single React instance:**
```json
// In package.json
{
  "resolutions": {
    "react": "^18.2.0"
  }
}
```

### For Web Projects

1. **Check webpack aliases:**
```javascript
// webpack.config.js
module.exports = {
  resolve: {
    alias: {
      react: path.resolve('./node_modules/react')
    }
  }
};
```

2. **Use React DevTools:**
- Install React DevTools browser extension
- Check Components tab for hook errors
- Look for duplicate React instances

## Quick Debugging Checklist

1. **Run diagnostics:**
   ```bash
   npm run check:hooks
   ```

2. **Clear all caches:**
   ```bash
   rm -rf node_modules
   npm install
   npm run fix:dedupe
   ```

3. **Check import statements:**
   ```typescript
   // Ensure consistent imports
   import React, { useState, useEffect } from 'react';
   // Not: import { useState } from 'React';
   ```

4. **Validate hook usage:**
   - Use the provided `useReactHooks.ts` patterns
   - Follow examples in `ChatExample.tsx`
   - Run hook validator from `hookValidator.ts`

5. **Common fixes:**
   - Move hooks to top of component
   - Remove conditional hook calls
   - Convert class components to functions
   - Ensure custom hooks start with "use"

## Using the Safe Hooks

We've provided safe hook implementations in `useReactHooks.ts`:

```typescript
import { useSafeState, useAsync, useDebounce } from './hooks/useReactHooks';

function ChatComponent() {
  // Safe state that prevents updates on unmounted components
  const [messages, setMessages] = useSafeState([]);
  
  // Async data fetching with proper cleanup
  const { data, loading, error } = useAsync(() => fetchMessages());
  
  // Debounced search input
  const debouncedSearch = useDebounce(searchTerm, 500);
}
```

## Need More Help?

1. Check `hookRules.ts` for detailed examples
2. Use `hookValidator.ts` for runtime debugging
3. Follow patterns in `ChatExample.tsx`
4. Run `npm run check:react` to verify installations