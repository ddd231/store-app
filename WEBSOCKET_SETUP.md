# WebSocket Setup Guide for React Native/Expo

This guide explains how to properly configure WebSocket connections for both React Native and Web platforms without requiring polyfills or patches.

## Overview

The WebSocket implementation in this project:
- Works natively on all platforms (iOS, Android, Web)
- Provides automatic reconnection with exponential backoff
- Includes platform-specific optimizations
- Integrates seamlessly with Supabase real-time features
- No polyfills or patches required

## Key Components

### 1. WebSocket Manager (`/src/services/websocketManager.ts`)
- Platform-agnostic WebSocket wrapper
- Automatic reconnection logic
- Event-based architecture
- Connection health monitoring with ping/pong

### 2. Supabase Realtime Service (`/src/services/supabaseRealtime.ts`)
- Enhanced Supabase real-time functionality
- Presence tracking for features like typing indicators
- Channel management with automatic cleanup
- Error handling and recovery

### 3. Platform Configuration (`/src/utils/platformWebSocket.ts`)
- Platform-specific WebSocket settings
- Optimized configurations for iOS, Android, and Web
- URL building utilities
- Error handling helpers

## Usage Examples

### Basic WebSocket Connection

```typescript
import { WebSocketManager } from './services/websocketManager';

// Create WebSocket connection
const ws = new WebSocketManager('wss://your-server.com/ws');

// Add event listeners
ws.addEventListener('open', () => console.log('Connected'));
ws.addEventListener('message', (event) => console.log('Message:', event.data));
ws.addEventListener('error', (error) => console.error('Error:', error));
ws.addEventListener('close', () => console.log('Disconnected'));

// Connect
ws.connect();

// Send message
ws.send(JSON.stringify({ type: 'chat', message: 'Hello!' }));

// Clean up
ws.close();
```

### Supabase Real-time Subscription

```typescript
import { realtimeManager } from './services/supabaseRealtime';

// Subscribe to database changes
const subscription = realtimeManager.subscribeToChanges(
  {
    channel: 'room:123',
    table: 'messages',
    filter: 'room_id=eq.123',
  },
  {
    onInsert: (payload) => console.log('New message:', payload.new),
    onUpdate: (payload) => console.log('Updated:', payload.new),
    onDelete: (payload) => console.log('Deleted:', payload.old),
    onError: (error) => console.error('Error:', error),
  }
);

// Unsubscribe when done
subscription.unsubscribe();
```

### React Hook Usage

```typescript
import { useSupabaseRealtime } from './services/supabaseRealtime';

function ChatComponent({ roomId }) {
  // Automatically subscribes and unsubscribes
  useSupabaseRealtime(
    {
      channel: `room:${roomId}`,
      table: 'messages',
      filter: `room_id=eq.${roomId}`,
    },
    {
      onInsert: (payload) => {
        // Handle new message
      },
    }
  );
}
```

## Platform-Specific Configuration

### iOS Configuration

No special configuration required. WebSocket works natively.

### Android Configuration

For development with cleartext traffic (HTTP WebSocket), add to `android/app/src/main/AndroidManifest.xml`:

```xml
<application android:usesCleartextTraffic="true">
```

### Web Configuration

Ensure your WebSocket server has proper CORS headers:

```javascript
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST
Access-Control-Allow-Headers: Content-Type
```

## Environment Variables

### For Expo:
```bash
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### For Web (Create React App):
```bash
REACT_APP_SUPABASE_URL=your-supabase-url
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

## Troubleshooting

### Connection Issues

1. **Check WebSocket URL**: Ensure it starts with `ws://` or `wss://`
2. **Verify Network**: Check device/emulator has internet access
3. **Platform Logs**: Use platform-specific debugging:
   ```typescript
   import { handleWebSocketError } from './utils/platformWebSocket';
   
   ws.addEventListener('error', (error) => {
     handleWebSocketError(error);
   });
   ```

### Supabase Real-time Issues

1. **Enable Realtime**: Ensure realtime is enabled for your tables in Supabase dashboard
2. **Check Filters**: Verify your filter syntax is correct
3. **Row Level Security**: Ensure RLS policies allow real-time access

### Performance Optimization

1. **Limit Channels**: Don't create too many simultaneous channels
2. **Unsubscribe**: Always clean up subscriptions when components unmount
3. **Batch Updates**: Group multiple updates when possible

## Best Practices

1. **Error Handling**: Always implement error callbacks
2. **Cleanup**: Unsubscribe from channels and close connections when done
3. **Reconnection**: Let the WebSocketManager handle reconnections automatically
4. **State Management**: Use React hooks or state management libraries to handle WebSocket data
5. **Security**: Always use WSS (WebSocket Secure) in production

## Testing

Run the WebSocket example component:

```typescript
import { WebSocketExample } from './components/WebSocketExample';

// In your app
<WebSocketExample />
```

This will demonstrate:
- Basic WebSocket connectivity
- Message sending/receiving
- Supabase real-time integration
- Platform-specific behavior

## Migration from Polyfills

If you were previously using WebSocket polyfills:

1. Remove any WebSocket polyfill imports
2. Remove patches from `index.html` or entry files
3. Replace direct WebSocket usage with `WebSocketManager`
4. Update Supabase subscriptions to use `realtimeManager`

The native implementation is more reliable and performant than polyfills.