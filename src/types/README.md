# TypeScript Type Definitions

This directory contains comprehensive TypeScript type definitions for the chat-app project.

## Type Files

### `index.ts`
Main type definitions including:
- Application configuration types
- Database/Supabase types (Message, User, Room, etc.)
- API response types
- Realtime event types
- WebSocket types
- Component prop types
- Hook return types
- Utility types and type guards

### `supabase.ts`
Auto-generated Supabase database types that match your database schema:
- Database table types with Row, Insert, and Update variants
- Enum types for database enums
- Helper types for easier type access

### `global.d.ts`
Global type declarations:
- Window interface extensions
- Node.js global types
- React Native platform types
- Expo Constants types

### `env.d.ts`
Environment variable type declarations for:
- React App environment variables
- Expo environment variables
- Node environment types

### `index.d.ts`
Type definition index that re-exports all types for easy importing.

## Usage

Import types in your TypeScript files:

```typescript
import type { Message, User, UseChatReturn } from '@/types';
import type { Database, Tables } from '@/types/supabase';
```

## Type Safety Benefits

1. **Compile-time type checking** - Catch errors before runtime
2. **Better IDE support** - IntelliSense, auto-completion, and refactoring
3. **Self-documenting code** - Types serve as inline documentation
4. **Reduced bugs** - Type mismatches are caught early
5. **Easier refactoring** - Changes propagate through the type system

## Generating Supabase Types

To regenerate Supabase types from your database schema:

```bash
npx supabase gen types typescript --project-id <your-project-id> > src/types/supabase.ts
```

## Best Practices

1. Always use proper types instead of `any`
2. Prefer interfaces over type aliases for object shapes
3. Use type guards for runtime type checking
4. Export types from this central location
5. Keep types close to their usage when specific to a module