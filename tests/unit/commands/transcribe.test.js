const path = require('path');

// Set up mocks before requiring the module
jest.mock('fs-extra');
jest.mock('../../../src/transcribe');
jest.mock('../../../src/mediaSplitter');

const fs = require('fs-extra');
const transcribeCommand = require('../../../src/commands/transcribe');
const { transcribeAudio } = require('../../../src/transcribe');
const { getMediaType } = require('../../../src/mediaSplitter');

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});

describe('transcribe command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
    
    // Set up default mock behaviors
    fs.exists.mockResolvedValue(true);
    fs.stat.mockResolvedValue({ size: 1024 * 1024 * 10 }); // 10 MB
    getMediaType.mockReturnValue({
      isSupported: true,
      mediaType: 'audio',
      extension: '.mp3'
    });
    transcribeAudio.mockResolvedValue('Transcribed text content');
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  afterAll(() => {
    mockExit.mockRestore();
  });

  test('should transcribe audio file successfully', async () => {
    const options = {
      input: 'audio.mp3',
      output: 'transcript.txt'
    };

    await transcribeCommand(options);

    expect(fs.exists).toHaveBeenCalledWith(path.resolve('audio.mp3'));
    expect(getMediaType).toHaveBeenCalledWith(path.resolve('audio.mp3'));
    expect(transcribeAudio).toHaveBeenCalledWith(
      path.resolve('audio.mp3'),
      path.resolve('transcript.txt')
    );
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Transcription completed successfully!'));
    expect(process.exit).not.toHaveBeenCalled();
  });

  test('should transcribe video file successfully', async () => {
    getMediaType.mockReturnValue({
      isSupported: true,
      mediaType: 'video',
      extension: '.mp4'
    });
    
    const options = {
      input: 'video.mp4',
      output: 'transcript.txt'
    };

    await transcribeCommand(options);

    expect(transcribeAudio).toHaveBeenCalledWith(
      path.resolve('video.mp4'),
      path.resolve('transcript.txt')
    );
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Found video file'));
  });

  test('should handle absolute paths', async () => {
    const options = {
      input: '/absolute/path/audio.mp3',
      output: '/absolute/path/transcript.txt'
    };

    await transcribeCommand(options);

    expect(transcribeAudio).toHaveBeenCalledWith(
      '/absolute/path/audio.mp3',
      '/absolute/path/transcript.txt'
    );
  });

  test('should error when input file does not exist', async () => {
    fs.exists.mockResolvedValue(false);
    
    const options = {
      input: 'nonexistent.mp3',
      output: 'transcript.txt'
    };

    await transcribeCommand(options);

    expect(console.error).toHaveBeenCalledWith(
      'Error during transcription process:',
      expect.stringContaining('File not found')
    );
    expect(process.exit).toHaveBeenCalledWith(1);
    expect(transcribeAudio).not.toHaveBeenCalled();
  });

  test('should error when file format is not supported', async () => {
    getMediaType.mockReturnValue({
      isSupported: false,
      mediaType: 'unknown',
      extension: '.txt'
    });
    
    const options = {
      input: 'document.txt',
      output: 'transcript.txt'
    };

    await transcribeCommand(options);

    expect(console.error).toHaveBeenCalledWith(
      'Error during transcription process:',
      expect.stringContaining('Unsupported file format')
    );
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  test('should error when file is empty', async () => {
    fs.stat.mockResolvedValue({ size: 0 });
    
    const options = {
      input: 'empty.mp3',
      output: 'transcript.txt'
    };

    await transcribeCommand(options);

    expect(console.error).toHaveBeenCalledWith(
      'Error during transcription process:',
      expect.stringContaining('file exists but is empty')
    );
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  test('should show file info in console output', async () => {
    const options = {
      input: 'audio.mp3',
      output: 'transcript.txt'
    };

    await transcribeCommand(options);

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('Found audio file: audio.mp3 (10.00 MB)')
    );
  });

  test('should handle transcription errors', async () => {
    transcribeAudio.mockRejectedValue(new Error('API error'));
    
    const options = {
      input: 'audio.mp3',
      output: 'transcript.txt'
    };

    await transcribeCommand(options);

    expect(console.error).toHaveBeenCalledWith(
      'Error during transcription process:',
      'API error'
    );
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  test('should show output path on success', async () => {
    const options = {
      input: 'audio.mp3',
      output: 'transcript.txt'
    };

    await transcribeCommand(options);

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining(`Full transcription has been saved to: ${path.resolve('transcript.txt')}`)
    );
  });
});