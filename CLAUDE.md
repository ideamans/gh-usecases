# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

gh-usecases is a TypeScript CLI application designed to simplify GitHub repository management workflows. The application allows users to create repositories, add them to teams, and manage organization settings.

**Important:** The user interface is displayed in English.

## Technology Stack

- **Language**: TypeScript
- **UI Framework**: Ink (React for CLI)
- **Authentication**: GitHub CLI (`gh`) integration
- **API**: GitHub GraphQL/REST API
- **Configuration**: Local JSON storage (`~/.gh-usecases.json`)
- **Build Tool**: TypeScript compiler
- **Package Manager**: Yarn
- **Development Tool**: tsx for TypeScript execution

## Development Commands

```bash
# Run CLI in development
yarn command

# Watch mode with hot reload
yarn dev

# Build for production
yarn build

# Run after global install
gh-usecases

# Run via npx
npx gh-usecases
```

## Project Architecture

### Directory Structure
```
gh-usecases/
├── src/
│   ├── index.tsx               # Entry point with shebang (#!/usr/bin/env node)
│   ├── components/             # React/Ink components
│   │   ├── Auth.tsx           # Authentication checks
│   │   ├── AccountSelector.tsx # Account selection (personal/org)
│   │   ├── UseCaseSelector.tsx # Main menu
│   │   ├── RepositoryCreator.tsx  # Repository creation form
│   │   ├── RepositorySelector.tsx # Repository search/selection
│   │   └── TeamSelector.tsx    # Multi-select team interface
│   ├── services/              # Business logic
│   │   ├── auth.ts           # GitHub authentication handling
│   │   ├── github-api.ts     # API integration
│   │   └── config.ts         # Configuration management
│   ├── hooks/                # React hooks
│   │   ├── useAuth.ts
│   │   ├── useProjects.ts
│   │   └── useTeams.ts
│   └── types/                # TypeScript types
│       └── index.ts
├── dist/                     # Build output
├── package.json
├── tsconfig.json
└── README.md
```

### Key Components

1. **Authentication**: Uses existing `gh` CLI authentication via `gh auth token` command (supports keyring and file storage)
2. **Configuration**: Stores user preferences in `~/.gh-usecases.json`
3. **API Integration**: Uses GitHub GraphQL API for efficient queries
4. **Error Handling**: Comprehensive handling for auth, API, and user errors
5. **2FA Support**: Built-in handling for two-factor authentication

### Main User Flows

1. **Create Repository**: Name, description, visibility settings
2. **Add to Teams**: Search existing repositories, select multiple teams
3. **Combined Flow**: Create repository and immediately add to teams

## Implementation Notes

- Use TypeScript strict mode
- Follow React Hooks best practices
- Implement proper error boundaries
- Use async/await for asynchronous operations
- Debounce search operations
- Cache team lists for performance
- Never log authentication tokens
- Validate all user inputs
- All UI messages and labels should be in English