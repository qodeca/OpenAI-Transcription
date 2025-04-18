# OpenAI-Transcription

A command-line Node.js application that converts audio and video files into accurate text transcriptions using OpenAI's GPT-4o-transcribe model. The tool efficiently handles files of various formats and sizes by splitting them into manageable chunks for processing.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Table of Contents

- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Usage](#usage)
  - [Command-Line Options](#command-line-options)
  - [Examples](#examples)
- [Supported File Formats](#supported-file-formats)
- [How It Works](#how-it-works)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Development](#development)
  - [Adding New Features](#adding-new-features)
  - [Testing](#testing)
  - [Backlog](#backlog)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Features

- Transcribes audio and video files using OpenAI's state-of-the-art GPT-4o-transcribe model
- Supports a wide range of audio and video formats
- Automatically extracts audio from video files
- Handles files of any size through intelligent chunking
- Provides real-time progress feedback with spinner animations
- Implements automatic cleanup of temporary files
- Creates output directories automatically if they don't exist

## Requirements

- Node.js (v16.0.0 or higher)
- An OpenAI API key with access to the GPT-4o-transcribe model
- FFmpeg (automatically installed as a dependency)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd OpenAI-Transcription
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with your OpenAI API key:
   ```bash
   echo "OPENAI_API_KEY=your_api_key_here" > .env
   ```

## Usage

The application runs from the command line with required input and output parameters.

### Command-Line Options

```bash
node src/index.js -i <input-file-path> -o <output-file-path>
```

Required options:
- `-i, --input <path>`: Path to the input audio or video file
- `-o, --output <path>`: Path where the transcription will be saved

Additional options:
- `--version`: Show the version number
- `-h, --help`: Display help information

### Examples

Transcribe an MP3 audio file:
```bash
node src/index.js -i test-media/audio-mp3.mp3 -o transcriptions/output.txt
```

Transcribe a video file:
```bash
node src/index.js -i test-media/movie-mp4.mp4 -o transcriptions/video-transcription.txt
```

Using absolute paths:
```bash
node src/index.js -i /Users/username/Music/interview.mp3 -o /Users/username/Documents/transcription.txt
```

## Supported File Formats

### Audio Formats
- MP3 (.mp3)
- WAV (.wav)
- M4A (.m4a)
- MPGA (.mpga)
- MPEG (.mpeg)
- MP4 (.mp4)
- WebM (.webm)

### Video Formats
- MP4 (.mp4)
- MOV (.mov)
- AVI (.avi)
- MKV (.mkv)
- WebM (.webm)
- FLV (.flv)
- WMV (.wmv)

## How It Works

1. **File Validation**: The application first checks if the input file exists and is in a supported format.

2. **Audio Extraction**: For video files, FFmpeg extracts the audio track into a temporary MP3 file.

3. **File Chunking**: The audio is divided into chunks of approximately 25 minutes each (the maximum duration supported by OpenAI's model).

4. **Transcription**: Each chunk is sent to OpenAI's GPT-4o-transcribe model for transcription.

5. **Consolidation**: The transcriptions from all chunks are combined into a single text file.

6. **Cleanup**: All temporary files created during processing are automatically removed.

## Environment Variables

The application requires the following environment variable:

- `OPENAI_API_KEY`: Your OpenAI API key with access to the GPT-4o-transcribe model

You can set this in a `.env` file or in your system environment.

## Project Structure

```
.
├── src/                      # Source code
│   ├── config.js             # Configuration and environment variables
│   ├── index.js              # Main application entry point
│   ├── mediaSplitter.js      # Audio/video processing utilities
│   └── transcribe.js         # OpenAI API integration for transcription
├── test-media/               # Sample media files for testing
│   ├── audio-mp3.mp3
│   └── movie-mp4.mp4
├── transcriptions/           # Default directory for output files
├── notes/                    # Project documentation and plans
│   ├── backlog.md            # Project backlog with upcoming tasks
│   └── future_tests.md       # Plans for future testing
├── .env                      # Environment variables (create this file)
├── package.json              # Project dependencies and scripts
└── README.md                 # Project documentation
```

## Development

### Adding New Features

When adding new features:

1. First check the `notes/backlog.md` file to see if your feature is already planned
2. Create a new branch for your feature
3. Write tests before implementing the feature
4. Follow the existing code style and patterns
5. Update documentation to reflect your changes
6. Submit a pull request with a clear description

### Testing

The project includes a comprehensive testing plan:

1. Basic functionality tests (file formats, arguments)
2. Edge case tests (file sizes, corrupt files, etc.)
3. API connection tests (error handling, network issues)

To implement automated tests, check the `notes/future_tests.md` file for guidance.

### Backlog

The project backlog is maintained in `notes/backlog.md`. It contains:

- A list of planned features and improvements
- Prioritized tasks with detailed descriptions
- Testing scenarios and validation criteria

If you want to contribute, picking a task from the backlog is a great place to start.

## Troubleshooting

### Common Issues

**Error: File not found**
- Make sure the file path is correct
- Try using an absolute path instead of a relative path

**Error: Unsupported file format**
- Check if your file format is listed in the Supported File Formats section
- Try converting your file to a supported format using a tool like FFmpeg

**API Key Issues**
- Verify that your OpenAI API key is correct
- Ensure your account has access to the GPT-4o-transcribe model
- Check your API usage limits and billing status

**Memory Issues with Large Files**
- The application should handle large files through chunking, but if you encounter memory issues, try processing a smaller portion of the file first

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request or create an Issue to report bugs or request features.

Steps to contribute:
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code follows the existing style and includes appropriate tests and documentation.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Made with ❤️ using OpenAI's GPT-4o-transcribe model