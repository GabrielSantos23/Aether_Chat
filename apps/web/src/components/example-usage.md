# Sources Button Integration Example

## How to Use the Sources Button

The Sources Button will automatically appear when the AI performs a web search. Here's how to integrate it into your message components:

### 1. Basic Usage

```tsx
import { SourcesButton } from "@/components/sources-button";

function MessageComponent({ message }) {
  return (
    <div>
      <div>{message.content}</div>
      <SourcesButton toolCalls={message.toolCalls} />
    </div>
  );
}
```

### 2. With AI Message Component

```tsx
import { AIMessageWithSources } from "@/components/ai-message-with-sources";

function MessageComponent({ message }) {
  return (
    <AIMessageWithSources
      content={message.content}
      toolCalls={message.toolCalls}
      isComplete={message.isComplete}
    />
  );
}
```

### 3. How It Works

1. **Automatic Detection**: The SourcesButton automatically detects when `toolCalls` contains a `webSearch` tool call
2. **Button Display**: Shows a "View X sources" button with the number of search results
3. **Sidebar Integration**: Clicking the button opens the right sidebar with formatted search results
4. **Real-time Updates**: The sidebar updates automatically when new search results are available

### 4. Message Data Structure

Your message should have this structure:

```typescript
interface Message {
  content: string;
  toolCalls?: Array<{
    toolCallId: string;
    toolName: string;
    args: {
      query: string;
      maxResults?: number;
      searchDepth?: string;
      timeRange?: string;
    };
    result: Array<{
      title: string;
      url: string;
      content: string;
      score?: number;
      published_date?: string;
    }>;
  }>;
  isComplete: boolean;
}
```

### 5. Styling

The SourcesButton includes:

- Hover animations
- Responsive design
- Consistent styling with your UI theme
- Loading states

### 6. Context Integration

The sidebar state is managed globally through the `SidebarProvider` context, so the button and sidebar work together seamlessly across your entire application.

## Current Status

✅ Sources Button Component Created
✅ Right Sidebar Updated for Real Search Results  
✅ Context Provider Added
✅ Integration Example Provided
✅ Automatic Detection of Search Results

The system is ready to use! Just add the `SourcesButton` component to your message display logic.
