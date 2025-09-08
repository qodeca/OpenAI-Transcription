# OpenTTS (Open Text-to-Speech & Transcription Suite)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org)
[![GitHub issues](https://img.shields.io/github/issues/qodeca/opentts)](https://github.com/qodeca/opentts/issues)
[![GitHub stars](https://img.shields.io/github/stars/qodeca/opentts)](https://github.com/qodeca/opentts/stargazers)

A powerful command-line tool that converts audio and video files into accurate text transcriptions using OpenAI's state-of-the-art models (GPT-4o-transcribe and whisper-1). Features automatic truncation recovery, audio extraction capabilities, and intelligent chunking. Handles files of any size and supports multiple formats.

## Quick Start

```bash
# Clone the repository
git clone https://github.com/qodeca/opentts.git
cd opentts

# Install dependencies
npm install

# Set your OpenAI API key (for transcription)
echo "OPENAI_API_KEY=your_api_key_here" > .env

# Transcribe an audio file
opentts transcribe -i audio.mp3 -o transcript.txt

# Extract audio from video file
opentts extract -i video.mp4 -o audio.mp3
```

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
  - [Basic Examples](#basic-examples)
  - [Command-Line Options](#command-line-options)
- [Supported File Formats](#supported-file-formats)
- [Configuration](#configuration)
- [How It Works](#how-it-works)
- [Project Structure](#project-structure)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)

## Features

### Transcription
- 🎵 **Multi-Format Support**: Transcribe MP3, WAV, M4A, MPGA, MPEG audio files
- 🎬 **Video Processing**: Extract and transcribe audio from MP4, MOV, AVI, MKV, WebM, FLV, WMV
- 🔪 **Smart Chunking**: Automatically splits large files into 15-minute segments with overlap
- 🚀 **Efficient Processing**: Handles files of any size without memory issues
- 📊 **Progress Tracking**: Real-time feedback with spinner animations
- 🔄 **Truncation Recovery**: Automatic fallback to whisper-1 when GPT-4o-transcribe truncates
- 🛡️ **Complete Transcriptions**: Special handling for final chunks to ensure no content is lost

### Audio Extraction
- 🎥 **Extract from Video**: Extract audio tracks from all supported video formats
- 🔄 **Format Conversion**: Convert between audio formats (MP3, WAV, M4A, AAC)
- 🎚️ **Quality Control**: Configurable bitrate and quality settings
- 📁 **Smart Output**: Auto-detect format from output filename
- 🧹 **Auto Cleanup**: Temporary files removed after processing

## Prerequisites

- **Node.js** v16.0.0 or higher ([Download](https://nodejs.org/))
- **OpenAI API Key** with access to GPT-4o-transcribe model ([Get API Key](https://platform.openai.com/api-keys)) - Required for transcription only
- **FFmpeg** (automatically installed as a dependency)

## Installation

### Global Installation (NPM)

```bash
# Install globally via npm
npm install -g opentts

# Set API key as environment variable
export OPENAI_API_KEY=your_api_key_here

# Verify installation
opentts --version
```

### From Source

```bash
# Clone the repository
git clone https://github.com/qodeca/opentts.git
cd opentts

# Install dependencies
npm install

# Set up your OpenAI API key
echo "OPENAI_API_KEY=your_api_key_here" > .env

# Link globally for development
npm link

# Now you can use opentts command globally
opentts --help
```

### Quick Start After Installation

```bash
# Transcribe an audio file
opentts transcribe -i podcast.mp3 -o transcript.txt

# Extract audio from video
opentts extract -i video.mp4 -o audio.mp3
```

## Usage

### Basic Examples

```bash
# Transcribe an audio file
opentts transcribe -i podcast.mp3 -o transcript.txt

# Transcribe a video file (audio extracted automatically)
opentts transcribe -i lecture.mp4 -o lecture-notes.txt

# Extract audio from video
opentts extract -i movie.mp4 -o soundtrack.mp3

# Convert audio format
opentts extract -i audio.wav -o audio.mp3
```

### Command-Line Interface

The tool now uses subcommands for different operations:

#### Transcribe Command

```bash
opentts transcribe [options]
```

| Option | Alias | Description | Required |
|--------|-------|-------------|----------|
| `--input` | `-i` | Path to input audio/video file | ✅ |
| `--output` | `-o` | Path for output transcription | ✅ |
| `--save-chunks` | | Save audio chunks for debugging | ❌ |
| `--help` | `-h` | Display help information | ❌ |

#### Extract Command

```bash
opentts extract [options]
```

| Option | Alias | Description | Required | Default |
|--------|-------|-------------|----------|---------|
| `--input` | `-i` | Path to input video/audio file | ✅ | - |
| `--output` | `-o` | Path for output audio file | ✅ | - |
| `--format` | `-f` | Output format (mp3\|wav\|m4a\|aac) | ❌ | mp3 |
| `--bitrate` | `-b` | Audio bitrate (e.g., 128k, 320k) | ❌ | 192k |
| `--quality` | `-q` | Quality level (0-9, 0=best) | ❌ | 2 |
| `--help` | `-h` | Display help information | ❌ | - |

### Advanced Usage

```bash
# Using absolute paths
opentts transcribe -i /Users/john/recordings/meeting.mp3 -o /Users/john/transcripts/meeting.txt

# Extract audio with custom quality
opentts extract -i video.mp4 -o audio.mp3 --bitrate 320k --quality 0

# Extract as different format (auto-detected from extension)
opentts extract -i video.mp4 -o audio.wav

# Process multiple files (using shell)
for file in *.mp4; do
  opentts transcribe -i "$file" -o "${file%.mp4}.txt"
done

# Extract audio from multiple videos
for file in *.mp4; do
  opentts extract -i "$file" -o "${file%.mp4}.mp3"
done
```

### Legacy Command Format

For backward compatibility, the old command format is still supported but will show a deprecation warning:

```bash
# Old format (deprecated)
opentts -i audio.mp3 -o transcript.txt

# This will show a warning and automatically run:
# opentts transcribe -i audio.mp3 -o transcript.txt
```

## Supported File Formats

### Audio Formats
- MP3 (.mp3)
- WAV (.wav)
- M4A (.m4a)
- MPGA (.mpga)
- MPEG (.mpeg)

### Video Formats
- MP4 (.mp4)
- MOV (.mov)
- AVI (.avi)
- MKV (.mkv)
- WebM (.webm)
- FLV (.flv)
- WMV (.wmv)

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
OPENAI_API_KEY=your_api_key_here
```

Or set as system environment variable:

```bash
# macOS/Linux
export OPENAI_API_KEY=your_api_key_here

# Windows (Command Prompt)
set OPENAI_API_KEY=your_api_key_here

# Windows (PowerShell)
$env:OPENAI_API_KEY="your_api_key_here"
```

## How It Works

### Transcription Process

1. **File Validation**: The application first checks if the input file exists and is in a supported format.

2. **Audio Extraction**: For video files, FFmpeg extracts the audio track into a temporary MP3 file.

3. **File Chunking**: The audio is divided into chunks of 15 minutes each with 15-second overlap to prevent content loss at boundaries.

4. **Transcription**: Each chunk is sent to OpenAI's GPT-4o-transcribe model with automatic fallback to whisper-1 if truncation is detected. Final chunks always use whisper-1 for completeness.

5. **Consolidation**: The transcriptions from all chunks are combined into a single text file.

6. **Cleanup**: All temporary files created during processing are automatically removed.

### Audio Extraction Process

1. **File Validation**: Checks if the input file exists and is in a supported format.

2. **Format Detection**: Automatically detects the desired output format from the file extension or uses the specified format.

3. **Audio Processing**: 
   - For video files: Extracts the audio track using FFmpeg
   - For audio files: Converts to the desired format or copies if same format

4. **Quality Settings**: Applies specified bitrate and quality settings during conversion.

5. **Output**: Saves the audio file to the specified location with progress feedback.


## Project Structure

```
opentts/
├── src/                      # Source code
│   ├── commands/             # CLI commands
│   │   ├── transcribe.js     # Transcription command
│   │   └── extract.js        # Audio extraction command
│   ├── audioExtractor.js     # Audio extraction logic
│   ├── config.js             # Configuration management
│   ├── index.js              # CLI entry point
│   ├── mediaSplitter.js      # Audio/video processing
│   └── transcribe.js         # OpenAI API integration
├── tests/                    # Test suite
│   ├── unit/                 # Unit tests
│   └── integration/          # Integration tests
├── test-media/               # Sample files for testing
├── transcriptions/           # Default output directory
├── temp/                     # Temporary files
├── .env                      # API configuration (create this)
├── package.json              # Dependencies
├── LICENSE                   # MIT license
├── README.md                 # This file
└── CLAUDE.md                 # AI assistant instructions
```

## Development

### Running Locally

```bash
# Install dependencies
npm install

# Run transcription with sample files
opentts transcribe -i test-media/audio-mp3.mp3 -o test-output.txt

# Extract audio from sample video
opentts extract -i test-media/video-mp4.mp4 -o test-audio.mp3

# Run with npm script
npm start -- transcribe -i test-media/audio-mp3.mp3 -o test-output.txt
```

### Project Roadmap

- ✅ Basic transcription functionality
- ✅ Video file support
- ✅ Large file chunking
- ✅ Audio extraction from video
- ✅ Audio format conversion
- ✅ Automated testing suite
- 📋 Batch processing
- 📋 Multiple output formats (SRT, VTT)
- 📋 Progress bar visualization
- 📋 Language detection
- 📋 Real-time transcription

### Testing

The project now includes a comprehensive automated test suite using Jest:

```bash
# Run all tests
npm test

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

**Test Structure:**
- `tests/unit/` - Unit tests for individual modules
  - `config.test.js` - Tests for configuration module
  - `mediaSplitter.test.js` - Tests for audio/video processing
  - `transcribe.test.js` - Tests for transcription logic
- `tests/integration/` - Integration tests
  - `cli.test.js` - Tests for command-line interface
- `tests/__mocks__/` - Mock implementations for external dependencies

**Manual Testing:**
```bash
# Test transcription
opentts transcribe -i test-media/audio-mp3.mp3 -o test-output.txt

# Test audio extraction
opentts extract -i test-media/video-mp4.mp4 -o test-audio.mp3
```

## Troubleshooting

### Common Issues

<details>
<summary><strong>Command not found: opentts</strong></summary>

If `opentts` command is not recognized after installation:

```bash
# If installed locally via npm link
npm link

# If installed globally via npm
npm install -g opentts

# Verify installation
which opentts

# Check npm global bin directory is in PATH
npm config get prefix
# Add to PATH if needed: export PATH=$PATH:$(npm config get prefix)/bin
```
</details>

<details>
<summary><strong>Permission denied when running opentts</strong></summary>

```bash
# Make the CLI executable
chmod +x /path/to/opentts/src/index.js

# Or reinstall with proper permissions
npm uninstall -g opentts
sudo npm install -g opentts
```
</details>

<details>
<summary><strong>Error: ENOENT - File not found</strong></summary>

```bash
# Check file exists
ls -la path/to/your/file.mp3

# Use absolute path
opentts transcribe -i $(pwd)/file.mp3 -o $(pwd)/output.txt
```
</details>

<details>
<summary><strong>Error: Unsupported file format</strong></summary>

- Verify format is supported (see [Supported File Formats](#supported-file-formats))
- Convert to supported format:
  ```bash
  # Convert any audio to MP3
  ffmpeg -i input.ogg -acodec mp3 output.mp3
  ```
</details>

<details>
<summary><strong>Error: Invalid API Key</strong></summary>

```bash
# Check your .env file
cat .env

# Verify API key works
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Set API key as environment variable
export OPENAI_API_KEY="your_api_key_here"
```
</details>

<details>
<summary><strong>FFmpeg not found</strong></summary>

```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt-get update && sudo apt-get install ffmpeg

# Windows - Download from https://ffmpeg.org/download.html

# Verify installation
ffmpeg -version
```
</details>

<details>
<summary><strong>Large file processing fails</strong></summary>

- OpenTTS automatically chunks files, but very large files may still cause issues
- Try reducing system load by closing other applications
- For video files, extract audio first:
  ```bash
  opentts extract -i large-video.mp4 -o audio.mp3
  opentts transcribe -i audio.mp3 -o transcript.txt
  ```
</details>

<details>
<summary><strong>Audio extraction produces silent or corrupted output</strong></summary>

- Verify source file has audio:
  ```bash
  ffprobe -i input-file.mp4 2>&1 | grep Audio
  ```
- Try different output format:
  ```bash
  opentts extract -i video.mp4 -o audio.wav
  ```
- Check available codecs:
  ```bash
  ffmpeg -codecs | grep -E "mp3|aac|pcm"
  ```
</details>

<details>
<summary><strong>Transcription seems incomplete or cut off</strong></summary>

OpenTTS automatically handles transcription truncation issues:
- Final chunks use whisper-1 model to ensure completeness
- Automatic fallback when truncation is detected
- Use `--save-chunks` to debug chunk processing:
  ```bash
  opentts transcribe -i audio.mp3 -o transcript.txt --save-chunks
  ```
- For critical transcriptions, force whisper-1:
  ```bash
  TRANSCRIBE_MODEL=whisper-1 opentts transcribe -i audio.mp3 -o transcript.txt
  ```
- See `docs/TRANSCRIPTION_TRUNCATION.md` for detailed information
</details>

### Getting Help

- 📖 Check the [documentation](https://github.com/qodeca/opentts/wiki)
- 🐛 [Report issues](https://github.com/qodeca/opentts/issues)
- 💬 [Start a discussion](https://github.com/qodeca/opentts/discussions)

## Contributing

We welcome contributions! See our [Contributing Guide](CONTRIBUTING.md) for details.

### Quick Start for Contributors

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/opentts.git
cd opentts

# Create feature branch
git checkout -b feature/your-feature-name

# Install dependencies
npm install

# Make changes and test
opentts transcribe -i test-media/audio-mp3.mp3 -o test.txt

# Commit and push
git add .
git commit -m "feat: add your feature"
git push origin feature/your-feature-name
```

### Contribution Guidelines

- 🔍 Check existing issues and PRs first
- 📝 Follow existing code style
- ✅ Test your changes thoroughly
- 📚 Update documentation if needed
- 🎯 One feature/fix per PR

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- 🤖 Built with [OpenAI's transcription models](https://platform.openai.com/docs/models) (GPT-4o-transcribe and whisper-1)
- 🎬 Audio processing powered by [FFmpeg](https://ffmpeg.org/)
- 🚀 CLI interface built with [Commander.js](https://github.com/tj/commander.js/)
- 💫 Loading animations by [ora](https://github.com/sindresorhus/ora)

---

<p align="center">
  Made with ❤️ by the OpenTTS community
</p>