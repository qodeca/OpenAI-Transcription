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
- No automated test framework is currently configured
- Manual testing with files in `test-media/` directory
- See `notes/backlog.md` for comprehensive testing plan (Tasks 1-13)
- See `notes/future_tests.md` for additional testing proposals

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

4. **Configuration** (`src/config.js`)
   - Manages environment variables
   - Provides API configuration

### Key Technical Details

- **Chunk Duration**: 25 minutes (1500 seconds) per chunk
- **Supported Formats**: MP3, WAV, M4A, MPGA, MPEG, MP4, WebM (audio); MP4, MOV, AVI, MKV, WebM, FLV, WMV (video)
- **Temporary Files**: Created in system temp directory, cleaned up after processing
- **Error Handling**: Comprehensive error messages with suggestions for resolution

### Important Considerations

1. **API Key**: Required environment variable `OPENAI_API_KEY`
2. **File Size Handling**: Large files are automatically chunked
3. **Memory Management**: Processes files in chunks to avoid memory issues
4. **Network Resilience**: Basic error handling for API failures (see Task 17 in backlog for improvements)

## Development Priorities

The `notes/backlog.md` contains 29 prioritized tasks. Key areas include:
- Comprehensive testing implementation (Tasks 1-13)
- Error handling improvements (Tasks 17, 28)
- Performance optimization (Tasks 21-23)
- Code cleanup (Tasks 24-29)
- Feature additions (batch processing, UI, progress reporting)