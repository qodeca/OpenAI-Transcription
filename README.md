# OpenAI-Transcription

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org)
[![GitHub issues](https://img.shields.io/github/issues/qodeca/OpenAI-Transcription)](https://github.com/qodeca/OpenAI-Transcription/issues)
[![GitHub stars](https://img.shields.io/github/stars/qodeca/OpenAI-Transcription)](https://github.com/qodeca/OpenAI-Transcription/stargazers)

A powerful command-line tool that converts audio and video files into accurate text transcriptions using OpenAI's state-of-the-art GPT-4o-transcribe model. Handles files of any size with intelligent chunking and supports multiple formats.

## Quick Start

```bash
# Clone the repository
git clone https://github.com/qodeca/OpenAI-Transcription.git
cd OpenAI-Transcription

# Install dependencies
npm install

# Set your OpenAI API key
echo "OPENAI_API_KEY=your_api_key_here" > .env

# Transcribe an audio file
node src/index.js -i audio.mp3 -o transcript.txt
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

- 🎵 **Multi-Format Support**: Transcribe MP3, WAV, M4A, MPGA, MPEG audio files
- 🎬 **Video Processing**: Extract and transcribe audio from MP4, MOV, AVI, MKV, WebM, FLV, WMV
- 🔪 **Smart Chunking**: Automatically splits large files into 25-minute segments
- 🚀 **Efficient Processing**: Handles files of any size without memory issues
- 📊 **Progress Tracking**: Real-time feedback with spinner animations
- 🧹 **Auto Cleanup**: Temporary files removed after processing
- 📁 **Smart Output**: Creates output directories automatically

## Prerequisites

- **Node.js** v16.0.0 or higher ([Download](https://nodejs.org/))
- **OpenAI API Key** with access to GPT-4o-transcribe model ([Get API Key](https://platform.openai.com/api-keys))
- **FFmpeg** (automatically installed as a dependency)

## Installation

### From Source (Recommended)

```bash
# Clone the repository
git clone https://github.com/qodeca/OpenAI-Transcription.git
cd OpenAI-Transcription

# Install dependencies
npm install

# Set up your OpenAI API key
echo "OPENAI_API_KEY=your_api_key_here" > .env
```

### Global Installation (Coming Soon)

```bash
# Install globally via npm
npm install -g openai-transcription

# Set API key as environment variable
export OPENAI_API_KEY=your_api_key_here
```

## Usage

### Basic Examples

```bash
# Transcribe an audio file
node src/index.js -i podcast.mp3 -o transcript.txt

# Transcribe a video file (audio extracted automatically)
node src/index.js -i lecture.mp4 -o lecture-notes.txt

# Use with sample files
node src/index.js -i test-media/audio-mp3.mp3 -o transcriptions/output.txt
```

### Command-Line Options

```bash
node src/index.js [options]
```

| Option | Alias | Description | Required |
|--------|-------|-------------|----------|
| `--input` | `-i` | Path to input audio/video file | ✅ |
| `--output` | `-o` | Path for output transcription | ✅ |
| `--help` | `-h` | Display help information | ❌ |
| `--version` | | Show version number | ❌ |

### Advanced Usage

```bash
# Using absolute paths
node src/index.js -i /Users/john/recordings/meeting.mp3 -o /Users/john/transcripts/meeting.txt

# Process multiple files (using shell)
for file in *.mp3; do
  node src/index.js -i "$file" -o "${file%.mp3}.txt"
done
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

1. **File Validation**: The application first checks if the input file exists and is in a supported format.

2. **Audio Extraction**: For video files, FFmpeg extracts the audio track into a temporary MP3 file.

3. **File Chunking**: The audio is divided into chunks of approximately 25 minutes each (the maximum duration supported by OpenAI's model).

4. **Transcription**: Each chunk is sent to OpenAI's GPT-4o-transcribe model for transcription.

5. **Consolidation**: The transcriptions from all chunks are combined into a single text file.

6. **Cleanup**: All temporary files created during processing are automatically removed.


## Project Structure

```
OpenAI-Transcription/
├── src/                      # Source code
│   ├── config.js             # Configuration management
│   ├── index.js              # CLI entry point
│   ├── mediaSplitter.js      # Audio/video processing
│   └── transcribe.js         # OpenAI API integration
├── test-media/               # Sample files for testing
├── transcriptions/           # Default output directory
├── notes/                    # Development documentation
│   ├── backlog.md            # Feature roadmap
│   └── future_tests.md       # Testing plans
├── .env                      # API configuration (create this)
├── package.json              # Dependencies
├── LICENSE                   # MIT license
└── README.md                 # This file
```

## Development

### Running Locally

```bash
# Install dependencies
npm install

# Run with sample files
node src/index.js -i test-media/audio-mp3.mp3 -o test-output.txt

# Run with npm script
npm start -- -i test-media/audio-mp3.mp3 -o test-output.txt
```

### Project Roadmap

Check `notes/backlog.md` for planned features:

- ✅ Basic transcription functionality
- ✅ Video file support
- ✅ Large file chunking
- 🚧 Automated testing suite
- 📋 Batch processing
- 📋 Multiple output formats (SRT, VTT)
- 📋 Progress bar visualization
- 📋 Language detection

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
# Test with sample files
node src/index.js -i test-media/audio-mp3.mp3 -o test-output.txt
```

## Troubleshooting

### Common Issues

<details>
<summary><strong>Error: ENOENT - File not found</strong></summary>

```bash
# Check file exists
ls -la path/to/your/file.mp3

# Use absolute path
node src/index.js -i $(pwd)/file.mp3 -o $(pwd)/output.txt
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
```
</details>

### Getting Help

- 📖 Check the [documentation](https://github.com/qodeca/OpenAI-Transcription/wiki)
- 🐛 [Report issues](https://github.com/qodeca/OpenAI-Transcription/issues)
- 💬 [Start a discussion](https://github.com/qodeca/OpenAI-Transcription/discussions)

## Contributing

We welcome contributions! See our [Contributing Guide](CONTRIBUTING.md) for details.

### Quick Start for Contributors

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/OpenAI-Transcription.git
cd OpenAI-Transcription

# Create feature branch
git checkout -b feature/your-feature-name

# Install dependencies
npm install

# Make changes and test
node src/index.js -i test-media/audio-mp3.mp3 -o test.txt

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

- 🤖 Built with [OpenAI's GPT-4o-transcribe model](https://platform.openai.com/docs/models)
- 🎬 Audio processing powered by [FFmpeg](https://ffmpeg.org/)
- 🚀 CLI interface built with [Commander.js](https://github.com/tj/commander.js/)
- 💫 Loading animations by [ora](https://github.com/sindresorhus/ora)

---

<p align="center">
  Made with ❤️ by the OpenAI-Transcription community
</p>