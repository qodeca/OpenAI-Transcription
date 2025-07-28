# CLAUDE.md - OpenTTS Project Guidelines

This file provides guidance to Claude Code (claude.ai/code) when working with the OpenTTS (Open Text-to-Speech & Transcription Suite) codebase.

## Common Development Commands

### Running the Application

#### Transcription
- Run: `node src/index.js transcribe -i <input-file> -o <output-file>`
- With debugging: `node src/index.js transcribe -i <input-file> -o <output-file> --save-chunks`
- Or via npm: `npm start -- transcribe -i <input-file> -o <output-file>`

#### Audio Extraction
- Run: `node src/index.js extract -i <input-file> -o <output-file>`
- With options: `node src/index.js extract -i video.mp4 -o audio.mp3 --bitrate 320k`

#### Legacy Format (Deprecated)
- Old format: `node src/index.js -i <input-file> -o <output-file>`
- This shows a deprecation warning and runs transcribe command

### Environment Setup
- Create a `.env` file with: `OPENAI_API_KEY=your_api_key_here`
- Install dependencies: `npm install`
- For global CLI access: `npm link` (use `npm unlink -g opentts` to remove)

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

## Project Overview

**OpenTTS** is a comprehensive command-line tool that provides:
- **Transcription**: Convert audio/video files to text using OpenAI's models (GPT-4o-transcribe and whisper-1)
- **Audio Extraction**: Extract and convert audio from video files with quality control
- **Format Support**: Handles multiple audio/video formats with intelligent chunking
- **Truncation Recovery**: Automatic fallback to whisper-1 when GPT-4o-transcribe truncates

## Architecture Overview

### Core Components

1. **Entry Point** (`src/index.js`)
   - CLI setup using Commander.js with subcommands
   - Supports `transcribe` and `extract` commands
   - Backward compatibility with legacy format
   - Routes to appropriate command handlers

2. **Command Modules** (`src/commands/`)
   - `transcribe.js`: Handles transcription command logic
   - `extract.js`: Handles audio extraction command logic
   - Both modules validate inputs and call appropriate services

3. **Media Processing** (`src/mediaSplitter.js`)
   - Extracts audio from video files using FFmpeg
   - Splits audio into 15-minute chunks with 15-second overlap
   - Converts between audio formats
   - Handles temporary file creation and cleanup
   - Special processing for final chunks

4. **Audio Extraction** (`src/audioExtractor.js`)
   - Core logic for audio extraction feature
   - Supports video-to-audio extraction
   - Audio format conversion with quality settings
   - Progress feedback with ora spinner

5. **Transcription** (`src/transcribe.js`)
   - Interfaces with OpenAI's transcription models
   - Implements truncation detection and recovery
   - Automatic model fallback (GPT-4o → whisper-1)
   - Processes audio chunks with overlap
   - Special handling for final chunks using whisper-1

6. **Configuration** (`src/config.js`)
   - Manages environment variables
   - Provides API and model configuration
   - Supports model selection and fallback settings

7. **Constants** (`src/constants.js`) **[NEW]**
   - Centralized configuration values
   - Transcription parameters and thresholds
   - Anti-truncation prompts
   - Model definitions

### Key Technical Details

- **Chunk Duration**: 15 minutes (900 seconds) per chunk - reduced from 23 minutes to prevent truncation
- **Chunk Overlap**: 15 seconds between chunks to prevent content loss
- **Supported Formats**: 
  - Audio Input/Output: MP3, WAV, M4A, MPGA, MPEG
  - Video Input: MP4, MOV, AVI, MKV, WebM, FLV, WMV
  - Audio Extraction Output: MP3, WAV, M4A, AAC
- **Audio Quality Options**:
  - Bitrate: Configurable (e.g., 128k, 192k, 320k)
  - Quality: 0-9 scale (0=best quality)
- **Temporary Files**: Created in system temp directory, cleaned up after processing
- **Error Handling**: Comprehensive error messages with suggestions for resolution
- **Truncation Recovery**: Automatic detection and model fallback for complete transcriptions

### Important Considerations

1. **API Key**: Required environment variable `OPENAI_API_KEY` (only for transcription)
2. **File Size Handling**: Large files are automatically chunked with overlap
3. **Memory Management**: Processes files in chunks to avoid memory issues
4. **Network Resilience**: Retry mechanism with exponential backoff
5. **Command Structure**: New subcommand structure with backward compatibility
6. **Truncation Issue**: GPT-4o-transcribe may truncate at ~10-11 minutes - handled automatically

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
- ✅ Audio extraction feature implemented
- ✅ Command-based CLI structure with subcommands
- ✅ Transcription truncation fix implemented with model fallback
- 🚧 Active development on issues #2-#14 (end-to-end testing)

### Issue Tracking
All development tasks are now tracked as GitHub issues:
- Issues #2-#8: Core testing scenarios from original backlog
- Issues #9-#13: Additional edge cases and quality testing
- Issue #14: End-to-end testing framework
- Issue #17: Network resilience improvements

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

### Project Name
- Internal name: `opentts`
- Display name: `OpenTTS` (Open Text-to-Speech & Transcription Suite)
- CLI command: `opentts`

### Code Quality Standards
- Maintain >95% test coverage
- Follow existing code patterns and conventions
- No console.log statements in production code
- Clear error messages with actionable solutions

## Documentation References

- **API Documentation**: See `docs/API.md` for detailed module documentation
- **Transcription Truncation**: See `docs/TRANSCRIPTION_TRUNCATION.md` for issue details and solutions