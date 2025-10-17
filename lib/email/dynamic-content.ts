// Define the component interfaces locally to avoid circular dependencies
interface BaseComponent {
  id: string;
  type: string;
  styles?: ComponentStyles;
}

interface TextComponent extends BaseComponent {
  type: 'text';
  content: string;
}

interface HeadingComponent extends BaseComponent {
  type: 'heading';
  level: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  content: string;
}

interface ImageComponent extends BaseComponent {
  type: 'image';
  src: string;
  alt: string;
}

interface ButtonComponent extends BaseComponent {
  type: 'button';
  text: string;
  href: string;
}

interface DividerComponent extends BaseComponent {
  type: 'divider';
}

interface SpacerComponent extends BaseComponent {
  type: 'spacer';
  height: string;
}

interface ListComponent extends BaseComponent {
  type: 'list';
  listType: 'ul' | 'ol';
  items: string[];
}

interface ColumnComponent extends BaseComponent {
  type: 'column';
  columnWidths: string[];
  children?: EmailComponent[][];
}

interface ContainerComponent extends BaseComponent {
  type: 'container';
  children: EmailComponent[];
}

interface DynamicContentComponent extends BaseComponent {
  type: 'dynamic';
  variableId: string;
  fallbackText?: string;
}

type EmailComponent = TextComponent | HeadingComponent | ImageComponent | ButtonComponent |
  DividerComponent | SpacerComponent | ListComponent | ColumnComponent | ContainerComponent | DynamicContentComponent;

interface ComponentStyles {
  // Typography
  fontSize?: string;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: 'normal' | 'italic' | 'oblique';
  lineHeight?: string;
  color?: string;
  textDecoration?: 'none' | 'underline' | 'line-through';
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  letterSpacing?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  textIndent?: string;
  
  // Layout
  display?: 'block' | 'inline' | 'inline-block' | 'flex' | 'none';
  width?: string;
  height?: string;
  maxWidth?: string;
  minWidth?: string;
  margin?: string;
  marginTop?: string;
  marginRight?: string;
  marginBottom?: string;
  marginLeft?: string;
  padding?: string;
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  
  // Visual
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundSize?: string;
  backgroundPosition?: string;
  backgroundRepeat?: string;
  border?: string;
  borderWidth?: string;
  borderStyle?: 'none' | 'solid' | 'dashed' | 'dotted' | 'double' | 'groove' | 'ridge' | 'inset' | 'outset';
  borderColor?: string;
  borderRadius?: string;
  boxShadow?: string;
  textShadow?: string;
  opacity?: string | number;
  cursor?: 'pointer' | 'default' | 'move' | 'text' | 'wait' | 'help' | 'crosshair';
  
  // Positioning
  position?: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky';
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  zIndex?: string | number;
  
  // Flexbox
  justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
  flexDirection?: 'row' | 'row-reverse' | 'column' | 'column-reverse';
  flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  gap?: string;
  
  // List
  listStyleType?: 'none' | 'disc' | 'circle' | 'square' | 'decimal' | 'lower-roman' | 'upper-roman' | 'lower-alpha' | 'upper-alpha';
  listStylePosition?: 'inside' | 'outside';
  
  // Table
  borderCollapse?: 'collapse' | 'separate';
  verticalAlign?: 'top' | 'middle' | 'bottom' | 'baseline';
  
  // Transition
  transition?: string;
  
  // Custom properties
  [key: string]: any;
}

// Define the data structure for variable replacement
export interface DynamicVariableData {
  // Team variables
  team?: {
    name: string;
    userGroup: string;
    adminGroup: string;
    contactEmail: string;
    memberCount: number;
  };
  // Application variables
  application?: {
    name: string;
    tla: string;
    shortIdentifier: string;
    status: string;
    assetId: string;
    lifecycle: string;
    lastSync: string;
  };
  // User variables
  user?: {
    name: string;
    email: string;
    role: string;
  };
  // System variables
  system?: {
    currentDate: string;
    currentTime: string;
    companyName: string;
  };
  // Allow for custom variables
  [key: string]: any;
}

// Function to replace dynamic variables in text content
export function replaceInlineVariables(text: string, data: DynamicVariableData): string {
  if (!text) return text;
  
  // Regex to find all {{variable}} patterns
  const variableRegex = /\{\{([^}]+)\}\}/g;
  
  return text.replace(variableRegex, (match, variablePath) => {
    // Try to get the value from the predefined variables
    const value = getVariableValue(variablePath.trim(), data);
    if (value) return value;
    
    // If not in predefined variables, try to get it from the data object directly
    const pathParts = variablePath.trim().split('.');
    let currentValue: any = data;
    
    for (const part of pathParts) {
      if (currentValue && typeof currentValue === 'object' && part in currentValue) {
        currentValue = currentValue[part];
      } else {
        return match; // Return the original {{variable}} if not found
      }
    }
    
    return String(currentValue !== undefined ? currentValue : match);
  });
}

// Function to extract all inline variables from text content
export function extractInlineVariables(text: string): string[] {
  if (!text) return [];
  
  const variableRegex = /\{\{([^}]+)\}\}/g;
  const variables: string[] = [];
  let match;
  
  while ((match = variableRegex.exec(text)) !== null) {
    variables.push(match[1].trim());
  }
  
  return [...new Set(variables)]; // Remove duplicates
}

// Function to replace dynamic variables in email components
export function processDynamicContent(
  components: EmailComponent[],
  data: DynamicVariableData
): EmailComponent[] {
  return components.map(component => {
    // Process inline variables in text content
    if (component.type === 'text' || component.type === 'heading') {
      const updatedComponent = { ...component };
      if (updatedComponent.content) {
        updatedComponent.content = replaceInlineVariables(updatedComponent.content, data);
      }
      return updatedComponent;
    }
    
    // Process button text
    if (component.type === 'button') {
      const updatedComponent = { ...component } as any;
      if (updatedComponent.text) {
        updatedComponent.text = replaceInlineVariables(updatedComponent.text, data);
      }
      return updatedComponent;
    }
    
    // Process image alt text
    if (component.type === 'image') {
      const updatedComponent = { ...component } as any;
      if (updatedComponent.alt) {
        updatedComponent.alt = replaceInlineVariables(updatedComponent.alt, data);
      }
      return updatedComponent;
    }
    
    // Process list items
    if (component.type === 'list') {
      const updatedComponent = { ...component } as any;
      if (updatedComponent.items) {
        updatedComponent.items = updatedComponent.items.map((item: string) =>
          replaceInlineVariables(item, data)
        );
      }
      return updatedComponent;
    }
    
    if (component.type === 'dynamic') {
      const dynamicComp = component as DynamicContentComponent;
      const value = getVariableValue(dynamicComp.variableId, data);
      const fallbackText = dynamicComp.fallbackText || value || 'N/A';
      
      // Replace the dynamic component with a text component containing the actual value
      return {
        id: component.id,
        type: 'text',
        content: fallbackText,
        styles: component.styles
      };
    }
    
    // Process nested components if they exist
    if ('children' in component && component.children) {
      if (component.type === 'column') {
        const columnComp = component as any;
        return {
          ...component,
          children: columnComp.children.map((columnArray: EmailComponent[]) =>
            processDynamicContent(columnArray, data)
          )
        };
      } else {
        return {
          ...component,
          children: processDynamicContent(component.children, data)
        };
      }
    }
    
    return component;
  });
}

// Helper function to get the value of a specific variable
function getVariableValue(variableId: string, data: DynamicVariableData): string {
  const parts = variableId.split('.');
  const category = parts[0];
  const field = parts[1];
  
  if (!data[category as keyof DynamicVariableData]) {
    return '';
  }
  
  const categoryData = data[category as keyof DynamicVariableData] as any;
  
  if (!categoryData || !categoryData[field]) {
    return '';
  }
  
  return String(categoryData[field]);
}

// Function to generate a sample data object for testing
export function generateSampleData(): DynamicVariableData {
  return {
    team: {
      name: 'Engineering Team',
      userGroup: 'engineering-users',
      adminGroup: 'engineering-admins',
      contactEmail: 'engineering@example.com',
      memberCount: 12
    },
    application: {
      name: 'My Application',
      tla: 'APP',
      shortIdentifier: 'my-app',
      status: 'Active',
      assetId: '12345',
      lifecycle: 'Production',
      lastSync: new Date().toLocaleDateString()
    },
    user: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'Admin'
    },
    system: {
      currentDate: new Date().toLocaleDateString(),
      currentTime: new Date().toLocaleTimeString(),
      companyName: 'Acme Corp'
    }
  };
}