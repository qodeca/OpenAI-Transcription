# Changelog

All notable changes to the OpenTTS project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2024-01-28

### Added
- New `extract` command for audio extraction from video files
- Audio format conversion support (MP3, WAV, M4A, AAC)
- Configurable audio quality settings (bitrate, quality level)
- Command-based CLI structure with subcommands
- Comprehensive unit tests for audio extraction features (~93% coverage)
- Backward compatibility with legacy command format

### Changed
- Project renamed from "openai-transcription" to "OpenTTS"
- Refactored CLI to use subcommands (`transcribe` and `extract`)
- Enhanced `mediaSplitter.js` with audio conversion capabilities
- Updated documentation to reflect new features and branding

### Technical Details
- New modules: `audioExtractor.js`, `commands/transcribe.js`, `commands/extract.js`
- Enhanced FFmpeg integration for audio processing
- Improved error handling and user feedback

## [1.0.0] - Initial Release

### Features
- Audio and video file transcription using OpenAI's GPT-4o-transcribe model
- Support for multiple audio formats (MP3, WAV, M4A, MPGA, MPEG)
- Support for multiple video formats (MP4, MOV, AVI, MKV, WebM, FLV, WMV)
- Intelligent file chunking for large files (25-minute segments)
- Progress tracking with spinner animations
- Automatic cleanup of temporary files
- Comprehensive test suite with ~97% coverage

### Technical Stack
- Node.js 16+
- FFmpeg for media processing
- OpenAI API for transcription
- Commander.js for CLI
- Jest for testing