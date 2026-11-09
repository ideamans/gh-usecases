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

## Publishing to npm

Pushing a `v*` tag runs `.github/workflows/publish.yml`, which tests, builds and **publishes to npm directly**
(no staged approval). It authenticates with npm Trusted Publishing (GitHub Actions OIDC); no `NPM_TOKEN` secret is used,
and provenance is attached automatically.

```bash
# after bumping "version" in package.json and pushing the commit
git tag vX.Y.Z && git push origin vX.Y.Z
```

`yarn release:patch|minor|major` bumps the version and pushes the tag. The job also creates the GitHub Release. See RELEASE.md.

- The job fails if the tag and the version in package.json differ, and does nothing if that version is already on npm.
- A prerelease (`1.2.0-beta.0`) is published under its identifier as the dist-tag (`beta`), not `latest`.
- Do not `npm publish` from a local machine (no tokens are kept).
- To re-run without moving the tag, start "Publish to npm" with workflow_dispatch (it publishes the version in package.json on the chosen branch).
- A PR that changes `publish.yml` runs the build and `npm pack --dry-run` without publishing.
- Prerequisite: on npmjs.com, `gh-usecases` lists GitHub Actions / `ideamans/gh-usecases` / `publish.yml` with the **publish** permission as its
  Trusted Publisher. With only the stage-publish permission, `npm publish` fails with `E403 OIDC permission denied`.
