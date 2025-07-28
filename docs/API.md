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

The `transcribe` module interfaces with OpenAI's transcription models (GPT-4o-transcribe and whisper-1).

```javascript
const { transcribeAudio } = require('opentts/src/transcribe');
```

#### transcribeAudio(filePath, outputPath, options)

Transcribes audio or video files to text using OpenAI's API with automatic truncation recovery.

**Parameters:**
- `filePath` (string): Path to audio/video file
- `outputPath` (string): Path where transcription will be saved
- `options` (object): Optional settings
  - `saveChunks` (boolean): Save audio chunks for debugging. Default: false

**Returns:** Promise<string> - The transcribed text

**Features:**
- Automatic model fallback (GPT-4o-transcribe → whisper-1) on truncation detection
- Anti-truncation prompts for better completeness
- Special handling for final chunks using whisper-1 to prevent truncation

**Example:**
```javascript
const transcription = await transcribeAudio('/path/to/audio.mp3', '/path/to/transcript.txt', {
  saveChunks: true  // Keep chunks for debugging
});
```

### mediaSplitter

The `mediaSplitter` module handles media file processing and chunking.

```javascript
const { 
  splitMediaFile, 
  getMediaType, 
  getMediaDuration,
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

Splits large media files into chunks for processing with overlap to prevent content loss.

**Parameters:**
- `inputFile` (string): Path to input media file
- `maxDurationSeconds` (number): Maximum chunk duration. Default: 900 (15 minutes)

**Returns:** Promise<Object>
- `chunkFiles` (string[]): Array of chunk file paths
- `filesToCleanup` (string[]): Temporary files to clean up

**Features:**
- 15-second overlap between chunks
- Special audio enhancement for final chunk
- Prevents API limit errors with precise duration control

#### getMediaDuration(filePath)

Gets the duration of a media file in seconds.

**Parameters:**
- `filePath` (string): Path to media file

**Returns:** Promise<number> - Duration in seconds

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
- `TRANSCRIBE_MODEL` (string): Primary transcription model. Default: 'gpt-4o-transcribe'
- `FALLBACK_MODEL` (string): Fallback model for truncation recovery. Default: 'whisper-1'
- `USE_FALLBACK_ON_TRUNCATION` (boolean): Enable automatic fallback. Default: true

### constants

The `constants` module provides shared configuration values across the application.

```javascript
const { TRANSCRIPTION, PROMPTS, MODELS, API, LOGGING } = require('opentts/src/constants');
```

**TRANSCRIPTION Constants:**
- `CHUNK_DURATION_SECONDS`: 900 (15 minutes)
- `CHUNK_OVERLAP_SECONDS`: 15
- `MAX_DURATION_SECONDS`: 1500 (API limit)
- `MAX_RETRIES`: 3
- `RETRY_DELAY_BASE_MS`: 1000
- `MIN_WORDS_PER_MINUTE`: 50
- `MIN_CHARS_PER_MINUTE`: 300
- `MAX_EMPTY_LINE_RATIO`: 0.3
- `MIN_VALIDATION_DURATION_SECONDS`: 300

**PROMPTS:**
- `STANDARD_ANTI_TRUNCATION`: Standard prompt to prevent truncation
- `AGGRESSIVE_ANTI_TRUNCATION`: More aggressive prompt for recovery attempts

**MODELS:**
- `GPT4O_TRANSCRIBE`: 'gpt-4o-transcribe'
- `WHISPER_1`: 'whisper-1'

## Command Modules

### commands/transcribe

Handles the transcribe CLI command.

```javascript
const transcribeCommand = require('opentts/src/commands/transcribe');
```

**CLI Options:**
- `--save-chunks`: Preserve audio chunks for debugging

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
- Truncation detection and recovery failures

## Environment Variables

Required environment variables:
- `OPENAI_API_KEY`: Your OpenAI API key (required for transcription)

Optional environment variables:
- `NODE_ENV`: Set to 'test' for testing mode
- `TRANSCRIBE_MODEL`: Override default transcription model (default: 'gpt-4o-transcribe')
- `FALLBACK_MODEL`: Override fallback model (default: 'whisper-1')
- `USE_FALLBACK_ON_TRUNCATION`: Disable automatic fallback (default: 'true')

## Usage Examples

### Programmatic Usage

```javascript
const { transcribeAudio } = require('opentts/src/transcribe');
const { extractAudio } = require('opentts/src/audioExtractor');

async function processVideo(videoPath) {
  // Extract audio first
  const audioPath = './temp-audio.mp3';
  await extractAudio(videoPath, audioPath);
  
  // Then transcribe with chunk saving for debugging
  const transcriptPath = './transcript.txt';
  await transcribeAudio(audioPath, transcriptPath, {
    saveChunks: true
  });
  
  console.log('Processing complete!');
}
```

### Custom Integration

```javascript
const { getMediaType, splitMediaFile } = require('opentts/src/mediaSplitter');
const { TRANSCRIPTION } = require('opentts/src/constants');

async function processLargeFile(filePath) {
  // Check if file is supported
  const { isSupported, mediaType } = getMediaType(filePath);
  if (!isSupported) {
    throw new Error('Unsupported file format');
  }
  
  // Split into chunks with custom duration
  const { chunkFiles, filesToCleanup } = await splitMediaFile(
    filePath, 
    TRANSCRIPTION.CHUNK_DURATION_SECONDS
  );
  
  // Process each chunk...
  
  // Clean up
  await cleanupFiles(filesToCleanup);
}
```

### Handling Truncation Issues

```javascript
const config = require('opentts/src/config');

// Force whisper-1 for critical transcriptions
process.env.TRANSCRIBE_MODEL = 'whisper-1';

// Or disable fallback if you prefer GPT-4o only
process.env.USE_FALLBACK_ON_TRUNCATION = 'false';
```