import { InteractionHistory } from '../services/interaction-history.js';

export interface ErrorInfo {
  title: string;
  causes: string[];
  solutions: string[];
  history?: string[];
}

function createErrorInfo(title: string, causes: string[], solutions: string[], includeHistory: boolean): ErrorInfo {
  return {
    title,
    causes,
    solutions,
    ...(includeHistory && { history: InteractionHistory.getFormattedHistory() }),
  };
}

export function getErrorInfo(error: Error | string, includeHistory: boolean = true): ErrorInfo {
  const errorMessage = typeof error === 'string' ? error : error.message;
  
  // Network/Connection errors
  if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('network')) {
    return createErrorInfo(
      'Network Connection Error',
      [
        'Internet connection is disconnected',
        'Cannot connect to GitHub servers',
        'Firewall or proxy settings',
      ],
      [
        'Check your internet connection',
        'If using VPN, try disabling it temporarily',
        'Wait a while and try again',
      ],
      includeHistory
    );
  }
  
  // Authentication errors
  if (errorMessage.includes('authentication') || errorMessage.includes('token') || errorMessage.includes('401')) {
    return createErrorInfo(
      'Authentication Error',
      [
        'GitHub authentication credentials are invalid or expired',
        'Insufficient access token permissions',
        'Not logged in to gh CLI',
      ],
      [
        'Run `gh auth login` to log in again',
        'Check authentication status with `gh auth status`',
        'Ensure you have project-related permissions (project, read:org)',
      ],
      includeHistory
    );
  }
  
  // Permission/Authorization errors
  if (errorMessage.includes('permission') || errorMessage.includes('403') || errorMessage.includes('access')) {
    return createErrorInfo(
      'Access Permission Error',
      [
        'Required permissions not granted',
        'Access restricted by organization settings',
        'No access to projects or teams',
      ],
      [
        'Request necessary permissions from organization administrator',
        'Check access token scopes',
        'Update permissions with `gh auth refresh -s project,read:org`',
      ],
      includeHistory
    );
  }
  
  // Not found errors
  if (errorMessage.includes('not found') || errorMessage.includes('404')) {
    return createErrorInfo(
      'Resource Not Found',
      [
        'Specified project, organization, or team does not exist',
        'No access permissions to resource',
        'Incorrect URL or ID',
      ],
      [
        'Verify name or ID is correct',
        'Confirm you have access permissions',
        'Check capitalization of organization or project names',
      ],
      includeHistory
    );
  }
  
  // Rate limit errors
  if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
    return createErrorInfo(
      'API Rate Limit Error',
      [
        'GitHub API rate limit reached',
        'Too many requests sent in a short time',
      ],
      [
        'Wait a while and try again (usually 1 hour)',
        'Check rate limit status with `gh api rate_limit`',
        'Ensure you are running as an authenticated user',
      ],
      includeHistory
    );
  }
  
  // GraphQL errors
  if (errorMessage.includes('GraphQL') || errorMessage.includes('query')) {
    return createErrorInfo(
      'API Request Error',
      [
        'GitHub API specification changed',
        'Invalid query parameters',
        'Temporary server-side issue',
      ],
      [
        'Update application to latest version',
        'Check that input does not contain special characters',
        'Wait a while and try again',
      ],
      includeHistory
    );
  }
  
  // Project/Team specific errors  
  if (errorMessage.includes('Failed to create project')) {
    return createErrorInfo(
      'Project Creation Error',
      [
        'Project name already in use',
        'No permission to create projects in organization',
        'Organization project limit reached',
      ],
      [
        'Try a different project name',
        'Check permissions with organization administrator',
        'Delete existing projects and try again',
      ],
      includeHistory
    );
  }
  
  if (errorMessage.includes('Failed to load teams')) {
    return createErrorInfo(
      'Team Loading Error',
      [
        'No access to organization teams',
        'Organization does not exist or is inaccessible',
      ],
      [
        'Confirm you are a member of the organization',
        'Verify organization name is correct',
        'Update permissions with `gh auth refresh -s read:org`',
      ],
      includeHistory
    );
  }
  
  if (errorMessage.includes('Could not add project to teams')) {
    return createErrorInfo(
      'Team Addition Error',
      [
        'No permission to add projects to teams',
        'Project already added to team',
      ],
      [
        'Request permissions from team administrator',
        'Verify selected teams',
        'Check project settings with organization administrator',
      ],
      includeHistory
    );
  }
  
  // Validation errors
  if (errorMessage.includes('required') || errorMessage.includes('invalid') || errorMessage.includes('validation')) {
    return createErrorInfo(
      'Input Error',
      [
        'Required fields not filled',
        'Invalid input format',
        'Character limit exceeded',
      ],
      [
        'Fill in all required fields',
        'Avoid special characters or emojis',
        'Keep project name under 255 characters',
      ],
      includeHistory
    );
  }
  
  // Project name required error
  if (errorMessage.includes('Project name is required')) {
    return createErrorInfo(
      'Project Name Not Entered',
      [
        'Project name field is empty',
      ],
      [
        'Enter a project name and press Enter',
        'You can use alphanumeric characters, hyphens, and underscores',
      ],
      includeHistory
    );
  }
  
  // Team selection specific errors
  if (errorMessage.includes('at least one team') || errorMessage.includes('Please select at least one team')) {
    return createErrorInfo(
      'Team Selection Error',
      [
        'No teams selected',
      ],
      [
        'Select one or more teams using the space key',
        'Press Enter to confirm selection',
      ],
      includeHistory
    );
  }
  
  // Personal account team error
  if (errorMessage.includes('Personal accounts cannot have teams') || errorMessage.includes('Personal accounts do not have team features')) {
    return createErrorInfo(
      'Account Type Error',
      [
        'Personal accounts do not have team features',
      ],
      [
        'Select an organization account',
        'Skip team addition for personal projects',
      ],
      includeHistory
    );
  }
  
  // Default error
  return createErrorInfo(
    'An Error Occurred',
    [
      'An unexpected error occurred',
    ],
    [
      'Check error message details',
      'If problem persists, check GitHub status page',
      'Try restarting the application',
    ],
    includeHistory
  );
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
  
  // Add interaction history if available
  if (info.history && info.history.length > 0) {
    lines.push('');
    lines.push('Interaction History:');
    info.history.forEach(entry => {
      lines.push(`  ${entry}`);
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