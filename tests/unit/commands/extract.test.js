const path = require('path');

// Set up mocks before requiring the module
jest.mock('fs-extra');
jest.mock('../../../src/audioExtractor');
jest.mock('../../../src/mediaSplitter');

const fs = require('fs-extra');
const extractCommand = require('../../../src/commands/extract');
const { extractAudio } = require('../../../src/audioExtractor');
const { getMediaType } = require('../../../src/mediaSplitter');

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});

describe('extract command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
    
    // Set up default mock behaviors
    fs.exists.mockResolvedValue(true);
    fs.stat.mockResolvedValue({ size: 1024 * 1024 * 10 }); // 10 MB
    getMediaType.mockReturnValue({
      isSupported: true,
      mediaType: 'video',
      extension: '.mp4'
    });
    extractAudio.mockResolvedValue();
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  afterAll(() => {
    mockExit.mockRestore();
  });

  test('should extract audio from video successfully', async () => {
    const options = {
      input: 'video.mp4',
      output: 'audio.mp3',
      format: 'mp3',
      bitrate: '192k',
      quality: '2'
    };

    await extractCommand(options);

    expect(fs.exists).toHaveBeenCalledWith(path.resolve('video.mp4'));
    expect(getMediaType).toHaveBeenCalledWith(path.resolve('video.mp4'));
    expect(extractAudio).toHaveBeenCalledWith(
      path.resolve('video.mp4'),
      path.resolve('audio.mp3'),
      {
        format: 'mp3',
        bitrate: '192k',
        quality: '2'
      }
    );
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Audio extraction completed successfully!'));
    expect(process.exit).not.toHaveBeenCalled();
  });

  test('should handle absolute paths', async () => {
    const options = {
      input: '/absolute/path/video.mp4',
      output: '/absolute/path/audio.mp3',
      format: 'mp3',
      bitrate: '192k',
      quality: '2'
    };

    await extractCommand(options);

    expect(extractAudio).toHaveBeenCalledWith(
      '/absolute/path/video.mp4',
      '/absolute/path/audio.mp3',
      expect.any(Object)
    );
  });

  test('should error when input file does not exist', async () => {
    fs.exists.mockResolvedValue(false);
    
    const options = {
      input: 'nonexistent.mp4',
      output: 'audio.mp3',
      format: 'mp3',
      bitrate: '192k',
      quality: '2'
    };

    await extractCommand(options);

    expect(console.error).toHaveBeenCalledWith(
      'Error during audio extraction process:',
      expect.stringContaining('File not found')
    );
    expect(process.exit).toHaveBeenCalledWith(1);
    expect(extractAudio).not.toHaveBeenCalled();
  });

  test('should error when file format is not supported', async () => {
    getMediaType.mockReturnValue({
      isSupported: false,
      mediaType: 'unknown',
      extension: '.txt'
    });
    
    const options = {
      input: 'document.txt',
      output: 'audio.mp3',
      format: 'mp3',
      bitrate: '192k',
      quality: '2'
    };

    await extractCommand(options);

    expect(console.error).toHaveBeenCalledWith(
      'Error during audio extraction process:',
      expect.stringContaining('Unsupported file format')
    );
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  test('should error when file is empty', async () => {
    fs.stat.mockResolvedValue({ size: 0 });
    
    const options = {
      input: 'empty.mp4',
      output: 'audio.mp3',
      format: 'mp3',
      bitrate: '192k',
      quality: '2'
    };

    await extractCommand(options);

    expect(console.error).toHaveBeenCalledWith(
      'Error during audio extraction process:',
      expect.stringContaining('file exists but is empty')
    );
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  test('should validate output format', async () => {
    const options = {
      input: 'video.mp4',
      output: 'audio.xyz',
      format: 'xyz',
      bitrate: '192k',
      quality: '2'
    };

    await extractCommand(options);

    expect(console.error).toHaveBeenCalledWith(
      'Error during audio extraction process:',
      expect.stringContaining('Invalid output format: xyz')
    );
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  test('should show file info in console output', async () => {
    const options = {
      input: 'video.mp4',
      output: 'audio.mp3',
      format: 'mp3',
      bitrate: '192k',
      quality: '2'
    };

    await extractCommand(options);

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('Found video file: video.mp4 (10.00 MB)')
    );
  });

  test('should handle extraction errors', async () => {
    extractAudio.mockRejectedValue(new Error('FFmpeg failed'));
    
    const options = {
      input: 'video.mp4',
      output: 'audio.mp3',
      format: 'mp3',
      bitrate: '192k',
      quality: '2'
    };

    await extractCommand(options);

    expect(console.error).toHaveBeenCalledWith(
      'Error during audio extraction process:',
      'FFmpeg failed'
    );
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  test('should support all valid output formats', async () => {
    const validFormats = ['mp3', 'wav', 'm4a', 'aac'];
    
    for (const format of validFormats) {
      jest.clearAllMocks();
      
      const options = {
        input: 'video.mp4',
        output: `audio.${format}`,
        format,
        bitrate: '192k',
        quality: '2'
      };

      await extractCommand(options);

      expect(process.exit).not.toHaveBeenCalled();
      expect(extractAudio).toHaveBeenCalled();
    }
  });
});