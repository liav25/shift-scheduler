# Frontend Architecture Documentation

## 🏗️ Project Structure

The frontend has been completely refactored into a modular, production-ready architecture following React best practices.

```
frontend/src/
├── components/           # Core application components
│   ├── ErrorBoundary.tsx
│   ├── SchedulerForm.tsx
│   ├── ScheduleTable.tsx
│   ├── AlgorithmInfo.tsx
│   └── ConnectionStatus.tsx
├── features/            # Feature-specific components
│   └── scheduler/
│       └── components/
│           ├── SchedulePeriodSection.tsx
│           └── ChipInputSection.tsx
├── hooks/               # Custom React hooks
│   ├── useScheduleGeneration.ts
│   └── useConnection.ts
├── ui/                  # Reusable UI components
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Select.tsx
│   ├── Chip.tsx
│   └── index.ts
├── layout/              # Layout components
│   └── Card.tsx
├── utils/               # Utility functions
│   ├── dateUtils.ts
│   └── validationUtils.ts
├── constants/           # Application constants
│   └── index.ts
├── services/            # API services
│   └── api.ts
├── types/               # TypeScript types
│   └── index.ts
├── App.tsx              # Main application component
└── main.tsx             # Application entry point
```

## 🔧 Key Improvements

### 1. **Separation of Concerns**
- **Components**: Focus purely on rendering UI
- **Hooks**: Contain business logic and state management
- **Services**: Handle API communication
- **Utils**: Provide helper functions
- **Constants**: Centralize configuration

### 2. **Reusable UI Components**
- `Button`: Configurable button with variants, sizes, and loading states
- `Input`: Form input with validation and error states
- `Select`: Dropdown component with options
- `Chip`: Tag-like component for removable items
- `Card`: Layout container with optional title and icon

### 3. **Custom Hooks**
- `useScheduleGeneration`: Manages schedule generation state and API calls
- `useConnection`: Handles backend connection status

### 4. **Feature-Based Organization**
- `scheduler/components/`: Components specific to the scheduler feature
- Allows for easy scaling and maintenance

### 5. **Error Handling**
- `ErrorBoundary`: Catches and handles React errors gracefully
- Comprehensive validation utilities
- Proper error states in UI

## 📦 Component Details

### Core Components

#### `SchedulerForm`
- Main form component for schedule configuration
- Uses modular sub-components for different sections
- Integrated validation and error handling

#### `ScheduleTable`
- Displays generated schedule results
- Optimized for performance with large datasets
- Responsive design with proper date grouping

### UI Components

#### `Button`
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
}
```

#### `Input`
```typescript
interface InputProps {
  label?: string;
  error?: string;
  helper?: string;
  fullWidth?: boolean;
}
```

### Feature Components

#### `SchedulePeriodSection`
- Handles date and time input for schedule period
- Uses consistent time options (XX:00, XX:30)
- Proper validation and disabled states

#### `ChipInputSection`
- Reusable component for adding/removing items (Guards, Posts)
- Supports Enter key for adding items
- Customizable colors and minimum item constraints

## 🎯 Benefits

### 1. **Maintainability**
- Small, focused components are easier to understand and modify
- Clear separation of concerns reduces coupling
- Consistent patterns across the codebase

### 2. **Reusability**
- UI components can be used throughout the application
- Custom hooks can be shared between components
- Utility functions eliminate code duplication

### 3. **Testability**
- Small, pure components are easier to test
- Business logic is isolated in hooks
- Clear interfaces make mocking straightforward

### 4. **Scalability**
- Feature-based organization supports growth
- New features can be added without touching existing code
- Consistent patterns make onboarding new developers easier

### 5. **Production Ready**
- Error boundaries prevent crashes
- Proper TypeScript types ensure type safety
- Validation prevents invalid data submission
- Loading states and disabled states improve UX

## 🔄 Migration Guide

### Before (Monolithic)
```typescript
// One large component with everything mixed together
const SchedulerForm = () => {
  // 500+ lines of mixed logic
  const [formData, setFormData] = useState(/* ... */);
  const [isLoading, setIsLoading] = useState(false);
  // API calls mixed with UI logic
  // Validation mixed with rendering
  // No reusable components
};
```

### After (Modular)
```typescript
// Clean, focused components
const SchedulerForm = () => {
  const { schedule, isLoading, handleGenerateSchedule } = useScheduleGeneration();
  const validation = validateFormData(formData);
  
  return (
    <form>
      <SchedulePeriodSection {...periodProps} />
      <ChipInputSection {...guardsProps} />
      <ChipInputSection {...postsProps} />
      <Button loading={isLoading} onClick={handleSubmit}>
        Generate Schedule
      </Button>
    </form>
  );
};
```

## 🚀 Usage Examples

### Using UI Components
```typescript
import { Button, Input, Select, Chip } from '../ui';

// Button with loading state
<Button 
  loading={isSubmitting} 
  variant="primary" 
  icon={SaveIcon}
>
  Save Changes
</Button>

// Input with validation
<Input 
  label="Email" 
  error={errors.email} 
  value={email}
  onChange={handleEmailChange}
/>
```

### Using Custom Hooks
```typescript
import { useScheduleGeneration } from '../hooks/useScheduleGeneration';

const MyComponent = () => {
  const { schedule, isLoading, handleGenerateSchedule } = useScheduleGeneration();
  
  return (
    <div>
      {isLoading && <Spinner />}
      {schedule && <ScheduleResults data={schedule} />}
    </div>
  );
};
```

## 📋 Best Practices Implemented

1. **Single Responsibility Principle**: Each component has one clear purpose
2. **Composition over Inheritance**: Components are composed together
3. **Props Interface Design**: Clear, well-typed interfaces
4. **Error Handling**: Graceful error boundaries and validation
5. **Performance**: Optimized renders and proper state management
6. **Accessibility**: Proper labels, ARIA attributes, and keyboard navigation
7. **Consistent Styling**: Centralized design system with Tailwind CSS

This architecture provides a solid foundation for continued development and maintenance of the shift scheduler application. 