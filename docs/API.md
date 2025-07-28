# OpenTTS API Documentation

This document describes the programmatic API for OpenTTS modules.

## Core Modules

### audioExtractor

The `audioExtractor` module handles audio extraction from video files and audio format conversion.

```javascript
const { extractAudio } = require('opentts/src/audioExtractor');
```

#### extractAudio(inputPath, outputPath, options)

Extracts audio from video files or converts audio between formats.

**Parameters:**
- `inputPath` (string): Path to input media file
- `outputPath` (string): Path for output audio file
- `options` (object): Optional settings
  - `format` (string): Output format ('mp3', 'wav', 'm4a', 'aac'). Default: 'mp3'
  - `bitrate` (string): Audio bitrate (e.g., '128k', '320k'). Default: '192k'
  - `quality` (string): Quality level (0-9, 0=best). Default: '2'

**Returns:** Promise<void>

**Example:**
```javascript
await extractAudio('/path/to/video.mp4', '/path/to/audio.mp3', {
  format: 'mp3',
  bitrate: '320k',
  quality: '0'
});
```

### transcribe

The `transcribe` module interfaces with OpenAI's GPT-4o-transcribe model.

```javascript
const { transcribeAudio } = require('opentts/src/transcribe');
```

#### transcribeAudio(filePath, outputPath)

Transcribes audio or video files to text using OpenAI's API.

**Parameters:**
- `filePath` (string): Path to audio/video file
- `outputPath` (string): Path where transcription will be saved

**Returns:** Promise<string> - The transcribed text

**Example:**
```javascript
const transcription = await transcribeAudio('/path/to/audio.mp3', '/path/to/transcript.txt');
```

### mediaSplitter

The `mediaSplitter` module handles media file processing and chunking.

```javascript
const { 
  splitMediaFile, 
  getMediaType, 
  extractAudioFromVideo,
  convertAudioFormat,
  cleanupFiles 
} = require('opentts/src/mediaSplitter');
```

#### getMediaType(filePath)

Determines if a file is a supported media type.

**Parameters:**
- `filePath` (string): Path to the file

**Returns:** Object
- `isSupported` (boolean): Whether the format is supported
- `mediaType` (string): 'audio', 'video', or 'unknown'
- `extension` (string): File extension

#### splitMediaFile(inputFile, maxDurationSeconds)

Splits large media files into chunks for processing.

**Parameters:**
- `inputFile` (string): Path to input media file
- `maxDurationSeconds` (number): Maximum chunk duration. Default: 1400 (23.3 minutes)

**Returns:** Promise<Object>
- `chunkFiles` (string[]): Array of chunk file paths
- `filesToCleanup` (string[]): Temporary files to clean up

#### extractAudioFromVideo(videoPath, outputPath, options)

Extracts audio track from video file.

**Parameters:**
- `videoPath` (string): Path to video file
- `outputPath` (string): Optional output path
- `options` (object): Format options (see extractAudio)

**Returns:** Promise<string> - Path to extracted audio file

#### convertAudioFormat(inputPath, outputPath, options)

Converts audio between different formats.

**Parameters:**
- `inputPath` (string): Path to input audio file
- `outputPath` (string): Path for output audio file
- `options` (object): Format options (see extractAudio)

**Returns:** Promise<void>

#### cleanupFiles(filePaths)

Removes temporary files and directories.

**Parameters:**
- `filePaths` (string[]): Array of file paths to clean up

**Returns:** Promise<void>

### config

The `config` module manages environment configuration.

```javascript
const config = require('opentts/src/config');
```

**Properties:**
- `OPENAI_API_KEY` (string): OpenAI API key from environment

## Command Modules

### commands/transcribe

Handles the transcribe CLI command.

```javascript
const transcribeCommand = require('opentts/src/commands/transcribe');
```

### commands/extract

Handles the extract CLI command.

```javascript
const extractCommand = require('opentts/src/commands/extract');
```

## Error Handling

All async functions throw errors that should be caught:

```javascript
try {
  await transcribeAudio(inputPath, outputPath);
} catch (error) {
  console.error('Transcription failed:', error.message);
}
```

Common error types:
- File not found
- Unsupported format
- API errors (for transcription)
- FFmpeg errors (for media processing)

## Environment Variables

Required environment variables:
- `OPENAI_API_KEY`: Your OpenAI API key (required for transcription)
- `NODE_ENV`: Set to 'test' for testing mode

## Usage Examples

### Programmatic Usage

```javascript
const { transcribeAudio } = require('opentts/src/transcribe');
const { extractAudio } = require('opentts/src/audioExtractor');

async function processVideo(videoPath) {
  // Extract audio first
  const audioPath = './temp-audio.mp3';
  await extractAudio(videoPath, audioPath);
  
  // Then transcribe
  const transcriptPath = './transcript.txt';
  await transcribeAudio(audioPath, transcriptPath);
  
  console.log('Processing complete!');
}
```

### Custom Integration

```javascript
const { getMediaType, splitMediaFile } = require('opentts/src/mediaSplitter');

async function processLargeFile(filePath) {
  // Check if file is supported
  const { isSupported, mediaType } = getMediaType(filePath);
  if (!isSupported) {
    throw new Error('Unsupported file format');
  }
  
  // Split into chunks if needed
  const { chunkFiles, filesToCleanup } = await splitMediaFile(filePath);
  
  // Process each chunk...
  
  // Clean up
  await cleanupFiles(filesToCleanup);
}
```