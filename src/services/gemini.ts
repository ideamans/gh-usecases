import { GoogleGenAI, Type } from '@google/genai';
import { ConfigService } from './config.js';
import fs from 'fs-extra';
import path from 'path';
import { Team } from '../types/index.js';

export interface RepositorySuggestion {
  name: string;
  description?: string;
}

export interface TeamWithRepositories extends Team {
  repositories: Array<{
    name: string;
    description?: string;
  }>;
}

export class GeminiService {
  private ai: GoogleGenAI | null = null;
  private initialized = false;

  private async initialize() {
    if (this.initialized) return;
    
    // First try environment variable
    let apiKey = process.env.GEMINI_API_KEY;
    
    // If not found, try config
    if (!apiKey) {
      try {
        const config = await ConfigService.load();
        apiKey = config?.geminiApiKey;
      } catch (err) {
        // Config not available yet
      }
    }
    
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    }
    
    this.initialized = true;
  }

  async isAvailable(): Promise<boolean> {
    await this.initialize();
    return this.ai !== null;
  }

  private async readMarkdownFiles(): Promise<string> {
    const MAX_SIZE = 50 * 1024; // 50KB
    let totalSize = 0;
    let content = '';
    
    try {
      const files = await fs.readdir(process.cwd());
      const mdFiles = files.filter(f => f.endsWith('.md'));
      
      for (const file of mdFiles) {
        if (totalSize >= MAX_SIZE) break;
        
        try {
          const filePath = path.join(process.cwd(), file);
          const stats = await fs.stat(filePath);
          
          if (stats.isFile()) {
            const fileContent = await fs.readFile(filePath, 'utf-8');
            const remainingSize = MAX_SIZE - totalSize;
            
            if (fileContent.length <= remainingSize) {
              content += `\n---${file}\n${fileContent}\n`;
              totalSize += fileContent.length;
            } else {
              content += `\n---${file}\n${fileContent.substring(0, remainingSize)}\n[truncated]\n`;
              totalSize = MAX_SIZE;
            }
          }
        } catch (err) {
          // Skip files that can't be read
        }
      }
    } catch (err) {
      // Directory read error
    }
    
    return content;
  }

  async suggestRepositoryDetails(additionalContext?: string): Promise<RepositorySuggestion | null> {
    await this.initialize();
    
    if (!this.ai) {
      return null;
    }

    try {
      const config = {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: ['name'],
          properties: {
            name: {
              type: Type.STRING,
            },
            description: {
              type: Type.STRING,
            },
          },
        },
      };

      // Get current directory name
      const currentDir = path.basename(process.cwd());
      
      // Read markdown files
      const markdownContent = await this.readMarkdownFiles();
      
      let context = `Current directory name: ${currentDir}\n`;
      
      // Only include markdown content if we found any
      if (markdownContent) {
        context += `\nMarkdown files content:\n${markdownContent}\n`;
      }
      
      if (additionalContext) {
        context += `\nAdditional context:\n${additionalContext}`;
      }
      
      const model = 'gemini-2.0-flash';
      const contents = [
        {
          role: 'user',
          parts: [
            {
              text: `Based on the following context, suggest a GitHub repository name and optionally a description.
              
Requirements:
- Repository name should be based on the current directory name if appropriate
- Repository name should be lowercase, use hyphens for spaces, and be concise
- Description is OPTIONAL - only provide it if you have enough context to create a meaningful one
- If provided, description should be clear and informative (max 100 characters)
- If the markdown files contain a good description or title, use them
- If there's not enough information for a description, do NOT provide one (omit the description field)

Context:
${context}`,
            },
          ],
        },
      ];

      // Use generateContentStream as shown in the example
      const response = await this.ai.models.generateContentStream({
        model,
        config,
        contents,
      });
      
      // Collect all chunks
      let fullText = '';
      for await (const chunk of response) {
        fullText += chunk.text;
      }
      
      return JSON.parse(fullText) as RepositorySuggestion;
    } catch (error) {
      console.error('Gemini API error:', error);
      return null;
    }
  }
  
  async suggestTeams(repositoryName: string, teamsWithRepos: TeamWithRepositories[]): Promise<string[] | null> {
    await this.initialize();
    
    if (!this.ai) {
      return null;
    }

    try {
      const config = {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
          },
        },
      };

      // Prepare team information
      const teamInfo = teamsWithRepos.map(team => ({
        name: team.name,
        slug: team.slug,
        repositories: team.repositories.map(r => r.name).slice(0, 10), // Limit to 10 repos per team
      }));

      const model = 'gemini-2.0-flash';
      const contents = [
        {
          role: 'user',
          parts: [
            {
              text: `Based on the repository name and existing team structures, suggest which teams this repository should be added to.

Repository to add: ${repositoryName}

Existing teams and their repositories:
${JSON.stringify(teamInfo, null, 2)}

Requirements:
- Return an array of team slugs (not names)
- Only suggest teams where the repository would logically fit based on naming patterns and existing repositories
- If no teams seem appropriate, return an empty array
- Maximum 5 suggestions
- Order by relevance (most relevant first)`,
            },
          ],
        },
      ];

      // Use generateContentStream as shown in the example
      const response = await this.ai.models.generateContentStream({
        model,
        config,
        contents,
      });
      
      // Collect all chunks
      let fullText = '';
      for await (const chunk of response) {
        fullText += chunk.text;
      }
      
      const suggestions = JSON.parse(fullText) as string[];
      
      // Filter to only valid team slugs
      const validSlugs = teamsWithRepos.map(t => t.slug);
      return suggestions.filter(slug => validSlugs.includes(slug)).slice(0, 5);
    } catch (error) {
      console.error('Gemini API error:', error);
      return null;
    }
  }
}

// Singleton instance
export const geminiService = new GeminiService();