# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Running the Application
- Run: `node src/index.js -i <input-file> -o <output-file>`
- Or via npm: `npm start -- -i <input-file> -o <output-file>`

### Environment Setup
- Create a `.env` file with: `OPENAI_API_KEY=your_api_key_here`
- Install dependencies: `npm install`

### Testing

**IMPORTANT: Always run tests before committing changes!**

```bash
# Run all tests before each commit
npm test

# Run specific test suites
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only
npm run test:coverage    # Tests with coverage report
npm run test:watch       # Watch mode for development
```

The project uses Jest for automated testing with comprehensive coverage:
- Unit tests for all core modules (config, mediaSplitter, transcribe)
- Integration tests for CLI functionality
- Current coverage: ~97% across all metrics
- Test files located in `tests/` directory
- All testing tasks now tracked as GitHub issues (#2-#14)

## Architecture Overview

### Core Components

1. **Entry Point** (`src/index.js`)
   - CLI setup using Commander.js
   - Input validation for file paths and formats
   - Orchestrates the transcription process

2. **Media Processing** (`src/mediaSplitter.js`)
   - Extracts audio from video files using FFmpeg
   - Splits audio into ~25-minute chunks (OpenAI's limit)
   - Handles temporary file creation and cleanup

3. **Transcription** (`src/transcribe.js`)
   - Interfaces with OpenAI's GPT-4o-transcribe model
   - Processes audio chunks sequentially
   - Combines chunk transcriptions into final output
   - Special handling for test environment (NODE_ENV=test)

4. **Configuration** (`src/config.js`)
   - Manages environment variables
   - Provides API configuration

### Key Technical Details

- **Chunk Duration**: ~23 minutes (1400 seconds) per chunk (safely under OpenAI's 25-minute limit)
- **Supported Formats**: 
  - Audio: MP3, WAV, M4A, MPGA, MPEG
  - Video: MP4, MOV, AVI, MKV, WebM, FLV, WMV
- **Temporary Files**: Created in system temp directory, cleaned up after processing
- **Error Handling**: Comprehensive error messages with suggestions for resolution

### Important Considerations

1. **API Key**: Required environment variable `OPENAI_API_KEY`
2. **File Size Handling**: Large files are automatically chunked
3. **Memory Management**: Processes files in chunks to avoid memory issues
4. **Network Resilience**: Basic error handling for API failures (see GitHub issue #17 for planned improvements)

## Development Best Practices

### Pre-Commit Checklist

Before committing any changes, ensure:

1. **Run all tests**: `npm test` - All tests must pass
2. **Check test coverage**: `npm run test:coverage` - Maintain >95% coverage
3. **Verify no console errors**: Test the application manually with sample files
4. **Update tests**: Add/update tests for any new functionality
5. **Update documentation**: Keep README.md and code comments current

### Git Commit Guidelines

- Use conventional commit format: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`
- Write clear, descriptive commit messages
- Reference issue numbers when applicable
- Keep commits focused and atomic

## Development Workflow

### GitHub Integration
- GitHub CLI (`gh`) is configured for creating PRs and issues
- All development happens in feature branches
- Pull requests require passing tests before merge
- Issues track all development tasks and bugs

### Current Project Status
- ✅ Comprehensive test suite implemented (~97% coverage)
- ✅ All backlog tasks migrated to GitHub issues
- 🚧 Active development on issues #2-#14 (end-to-end testing)

### Issue Tracking
All development tasks are now tracked as GitHub issues:
- Issues #2-#8: Core testing scenarios from original backlog
- Issues #9-#13: Additional edge cases and quality testing
- Issue #14: End-to-end testing framework
- Issue #17: Network resilience improvements (referenced above)

### Branch Strategy
- `main`: Production-ready code
- `feature/*`: New features and enhancements
- All changes go through pull requests

## Important Notes

### Testing Philosophy
- Unit tests use mocks for external dependencies (FFmpeg, OpenAI API)
- Integration tests verify CLI behavior
- End-to-end tests (planned) will use real media files and services
- All tests must pass before commits

### Code Quality Standards
- Maintain >95% test coverage
- Follow existing code patterns and conventions
- No console.log statements in production code
- Clear error messages with actionable solutions