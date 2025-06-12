export interface ErrorInfo {
  title: string;
  causes: string[];
  solutions: string[];
}

export function getErrorInfo(error: Error | string): ErrorInfo {
  const errorMessage = typeof error === 'string' ? error : error.message;
  
  // Network/Connection errors
  if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('network')) {
    return {
      title: 'Network Connection Error',
      causes: [
        'Internet connection is disconnected',
        'Cannot connect to GitHub servers',
        'Firewall or proxy settings',
      ],
      solutions: [
        'Check your internet connection',
        'If using VPN, try disabling it temporarily',
        'Wait a while and try again',
      ],
    };
  }
  
  // Authentication errors
  if (errorMessage.includes('authentication') || errorMessage.includes('token') || errorMessage.includes('401')) {
    return {
      title: 'Authentication Error',
      causes: [
        'GitHub authentication credentials are invalid or expired',
        'Insufficient access token permissions',
        'Not logged in to gh CLI',
      ],
      solutions: [
        'Run `gh auth login` to log in again',
        'Check authentication status with `gh auth status`',
        'Ensure you have project-related permissions (project, read:org)',
      ],
    };
  }
  
  // Permission/Authorization errors
  if (errorMessage.includes('permission') || errorMessage.includes('403') || errorMessage.includes('access')) {
    return {
      title: 'Access Permission Error',
      causes: [
        'Required permissions not granted',
        'Access restricted by organization settings',
        'No access to projects or teams',
      ],
      solutions: [
        'Request necessary permissions from organization administrator',
        'Check access token scopes',
        'Update permissions with `gh auth refresh -s project,read:org`',
      ],
    };
  }
  
  // Not found errors
  if (errorMessage.includes('not found') || errorMessage.includes('404')) {
    return {
      title: 'Resource Not Found',
      causes: [
        'Specified project, organization, or team does not exist',
        'No access permissions to resource',
        'Incorrect URL or ID',
      ],
      solutions: [
        'Verify name or ID is correct',
        'Confirm you have access permissions',
        'Check capitalization of organization or project names',
      ],
    };
  }
  
  // Rate limit errors
  if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
    return {
      title: 'API Rate Limit Error',
      causes: [
        'GitHub API rate limit reached',
        'Too many requests sent in a short time',
      ],
      solutions: [
        'Wait a while and try again (usually 1 hour)',
        'Check rate limit status with `gh api rate_limit`',
        'Ensure you are running as an authenticated user',
      ],
    };
  }
  
  // GraphQL errors
  if (errorMessage.includes('GraphQL') || errorMessage.includes('query')) {
    return {
      title: 'API Request Error',
      causes: [
        'GitHub API specification changed',
        'Invalid query parameters',
        'Temporary server-side issue',
      ],
      solutions: [
        'Update application to latest version',
        'Check that input does not contain special characters',
        'Wait a while and try again',
      ],
    };
  }
  
  // Project/Team specific errors  
  if (errorMessage.includes('Failed to create project')) {
    return {
      title: 'Project Creation Error',
      causes: [
        'Project name already in use',
        'No permission to create projects in organization',
        'Organization project limit reached',
      ],
      solutions: [
        'Try a different project name',
        'Check permissions with organization administrator',
        'Delete existing projects and try again',
      ],
    };
  }
  
  if (errorMessage.includes('Failed to load teams')) {
    return {
      title: 'Team Loading Error',
      causes: [
        'No access to organization teams',
        'Organization does not exist or is inaccessible',
      ],
      solutions: [
        'Confirm you are a member of the organization',
        'Verify organization name is correct',
        'Update permissions with `gh auth refresh -s read:org`',
      ],
    };
  }
  
  if (errorMessage.includes('Could not add project to teams')) {
    return {
      title: 'Team Addition Error',
      causes: [
        'No permission to add projects to teams',
        'Project already added to team',
      ],
      solutions: [
        'Request permissions from team administrator',
        'Verify selected teams',
        'Check project settings with organization administrator',
      ],
    };
  }
  
  // Validation errors
  if (errorMessage.includes('required') || errorMessage.includes('invalid') || errorMessage.includes('validation')) {
    return {
      title: 'Input Error',
      causes: [
        'Required fields not filled',
        'Invalid input format',
        'Character limit exceeded',
      ],
      solutions: [
        'Fill in all required fields',
        'Avoid special characters or emojis',
        'Keep project name under 255 characters',
      ],
    };
  }
  
  // Project name required error
  if (errorMessage.includes('Project name is required')) {
    return {
      title: 'Project Name Not Entered',
      causes: [
        'Project name field is empty',
      ],
      solutions: [
        'Enter a project name and press Enter',
        'You can use alphanumeric characters, hyphens, and underscores',
      ],
    };
  }
  
  // Team selection specific errors
  if (errorMessage.includes('at least one team') || errorMessage.includes('Please select at least one team')) {
    return {
      title: 'Team Selection Error',
      causes: [
        'No teams selected',
      ],
      solutions: [
        'Select one or more teams using the space key',
        'Press Enter to confirm selection',
      ],
    };
  }
  
  // Personal account team error
  if (errorMessage.includes('Personal accounts cannot have teams') || errorMessage.includes('Personal accounts do not have team features')) {
    return {
      title: 'Account Type Error',
      causes: [
        'Personal accounts do not have team features',
      ],
      solutions: [
        'Select an organization account',
        'Skip team addition for personal projects',
      ],
    };
  }
  
  // Default error
  return {
    title: 'An Error Occurred',
    causes: [
      'An unexpected error occurred',
    ],
    solutions: [
      'Check error message details',
      'If problem persists, check GitHub status page',
      'Try restarting the application',
    ],
  };
}

export function formatErrorDisplay(error: Error | string): string[] {
  const info = getErrorInfo(error);
  const lines: string[] = [];
  
  lines.push(`❌ ${info.title}`);
  lines.push('');
  
  if (info.causes.length > 0) {
    lines.push('Possible causes:');
    info.causes.forEach(cause => {
      lines.push(`  • ${cause}`);
    });
    lines.push('');
  }
  
  if (info.solutions.length > 0) {
    lines.push('How to fix:');
    info.solutions.forEach((solution, index) => {
      lines.push(`  ${index + 1}. ${solution}`);
    });
  }
  
  // Add original error message for debugging
  const originalMessage = typeof error === 'string' ? error : error.message;
  if (originalMessage) {
    lines.push('');
    lines.push(`Details: ${originalMessage}`);
  }
  
  return lines;
}