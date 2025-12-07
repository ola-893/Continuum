# Toast Notification System - Usage Guide

## Quick Start

### 1. Import the Hook

```typescript
import { useToast } from '../hooks/useToast';
```

### 2. Use in Component

```typescript
export const MyComponent: React.FC = () => {
    const { toasts, removeToast, success, error, warning, info } = useToast();
    
    const handleAction = () => {
        success('Operation completed successfully!');
    };
    
    return (
        <>
            <ToastContainer toasts={toasts} onClose={removeToast} />
            {/* Your component content */}
        </>
    );
};
```

## Toast Methods

### Success Toast
```typescript
success('Agent launched successfully!', 7000); // 7 second duration
```

### Error Toast
```typescript
error('Failed to connect to backend', 5000); // 5 second duration
```

### Warning Toast
```typescript
warning('Connection lost. Retrying...'); // Default 5 second duration
```

### Info Toast
```typescript
info('Preparing agent registration...'); // Default 5 second duration
```

## Loading Components

### LoadingSpinner

```typescript
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

// Basic usage
<LoadingSpinner />

// With custom size and color
<LoadingSpinner size={24} color="var(--color-primary)" />

// With message
<LoadingSpinner size={20} message="Loading..." />
```

### ProgressBar

```typescript
import { ProgressBar } from '../components/ui/ProgressBar';

// Basic usage
<ProgressBar progress={50} />

// With message and estimated time
<ProgressBar 
    progress={75} 
    message="Registering on blockchain..."
    estimatedTime="5-10 seconds"
/>

// Without percentage display
<ProgressBar 
    progress={30} 
    showPercentage={false}
/>
```

## Best Practices

### 1. Toast Duration

- **Success**: 5-7 seconds (users like to see success)
- **Error**: 5-8 seconds (users need time to read)
- **Warning**: 5 seconds (standard)
- **Info**: 3-5 seconds (quick information)

### 2. Toast Messages

- Keep messages concise (1-2 sentences)
- Be specific about what happened
- Provide actionable guidance for errors
- Use friendly, conversational tone

### 3. Loading States

- Show loading spinner immediately on action
- Update progress bar smoothly (avoid jumps)
- Provide estimated times for long operations
- Show retry count when retrying

### 4. Error Handling

```typescript
try {
    await someOperation();
    success('Operation completed!');
} catch (err) {
    if (axios.isAxiosError(err)) {
        if (err.response?.status === 503) {
            error('Service temporarily unavailable');
        } else {
            error('Operation failed. Please try again.');
        }
    }
}
```

## Examples

### Example 1: Form Submission with Progress

```typescript
const handleSubmit = async () => {
    setIsLoading(true);
    setProgress(0);
    
    try {
        setProgress(25);
        info('Validating data...');
        await validateData();
        
        setProgress(50);
        info('Submitting to blockchain...');
        await submitToBlockchain();
        
        setProgress(75);
        info('Waiting for confirmation...');
        await waitForConfirmation();
        
        setProgress(100);
        success('Transaction completed successfully!', 7000);
    } catch (err) {
        error('Transaction failed. Please try again.');
        setProgress(0);
    } finally {
        setIsLoading(false);
    }
};

return (
    <>
        <ToastContainer toasts={toasts} onClose={removeToast} />
        <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <LoadingSpinner size={16} color="white" />}
            Submit
        </Button>
        {isLoading && progress > 0 && (
            <ProgressBar 
                progress={progress}
                message="Processing transaction..."
                estimatedTime="10-15 seconds"
            />
        )}
    </>
);
```

### Example 2: API Call with Retry

```typescript
const fetchData = async (retryCount = 0) => {
    setIsLoading(true);
    
    try {
        const data = await api.getData();
        success('Data loaded successfully!');
        return data;
    } catch (err) {
        if (retryCount < 3) {
            warning(`Retrying... (attempt ${retryCount + 1}/3)`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return fetchData(retryCount + 1);
        } else {
            error('Failed to load data after multiple attempts', 7000);
            throw err;
        }
    } finally {
        setIsLoading(false);
    }
};
```

### Example 3: Multiple Toast Types

```typescript
const handleComplexOperation = async () => {
    info('Starting operation...');
    
    try {
        await step1();
        info('Step 1 complete');
        
        await step2();
        warning('Step 2 completed with warnings');
        
        await step3();
        success('All steps completed successfully!', 7000);
    } catch (err) {
        error('Operation failed at step ' + currentStep);
    }
};
```

## Styling

All components use CSS variables from `index.css`:

- `--color-primary`: Primary color
- `--color-success`: Success color (green)
- `--color-error`: Error color (red)
- `--color-warning`: Warning color (yellow)
- `--color-info`: Info color (blue)
- `--spacing-*`: Spacing variables
- `--radius-*`: Border radius variables

## Accessibility

- Toasts have appropriate color contrast
- Icons provide visual cues
- Messages are clear and concise
- Loading spinners are animated for visibility
- Progress bars show percentage for clarity

## Performance

- Toasts auto-dismiss to prevent memory leaks
- Efficient state management with React hooks
- CSS animations are GPU-accelerated
- Minimal re-renders

## Troubleshooting

### Toast Not Appearing

1. Check if `ToastContainer` is rendered
2. Verify `toasts` array is passed correctly
3. Check if `removeToast` function is provided

### Progress Bar Not Updating

1. Ensure progress value is between 0-100
2. Check if state is updating correctly
3. Verify component is re-rendering

### Loading Spinner Not Spinning

1. Check if CSS animation is defined in `index.css`
2. Verify `@keyframes spin` exists
3. Check browser compatibility

## Migration from Alert/Console

### Before
```typescript
alert('Success!');
console.log('Operation completed');
```

### After
```typescript
success('Operation completed successfully!');
```

This provides a much better user experience with:
- Non-blocking notifications
- Auto-dismiss functionality
- Consistent styling
- Better accessibility
