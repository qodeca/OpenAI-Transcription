const path = require('path');
const os = require('os');

// Set up mocks before requiring the module
jest.mock('fs-extra');
jest.mock('ora');

const fs = require('fs-extra');
const { extractAudio } = require('../../src/audioExtractor');

// Mock the mediaSplitter module
jest.mock('../../src/mediaSplitter', () => ({
  extractAudioFromVideo: jest.fn(),
  getMediaType: jest.fn(),
  convertAudioFormat: jest.fn()
}));

const { extractAudioFromVideo, getMediaType, convertAudioFormat } = require('../../src/mediaSplitter');

describe('audioExtractor.js', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set up default mock behaviors
    fs.ensureDir.mockResolvedValue();
    fs.copy.mockResolvedValue();
    fs.stat.mockResolvedValue({ size: 1024 * 1024 * 10 }); // 10 MB
  });

  describe('extractAudio', () => {
    test('should extract audio from video file successfully', async () => {
      const inputPath = '/path/to/video.mp4';
      const outputPath = '/path/to/audio.mp3';
      
      getMediaType.mockReturnValue({ mediaType: 'video' });
      extractAudioFromVideo.mockResolvedValue();
      
      await extractAudio(inputPath, outputPath);
      
      expect(fs.ensureDir).toHaveBeenCalledWith('/path/to');
      expect(extractAudioFromVideo).toHaveBeenCalledWith(
        inputPath,
        outputPath,
        {
          format: 'mp3',
          bitrate: undefined,
          quality: undefined
        }
      );
      expect(fs.stat).toHaveBeenCalledWith(outputPath);
    });

    test('should extract audio with custom options', async () => {
      const inputPath = '/path/to/video.mp4';
      const outputPath = '/path/to/audio.mp3';
      const options = {
        format: 'wav',
        bitrate: '320k',
        quality: '0'
      };
      
      getMediaType.mockReturnValue({ mediaType: 'video' });
      extractAudioFromVideo.mockResolvedValue();
      
      await extractAudio(inputPath, outputPath, options);
      
      // The function adjusts the output path to match the format
      expect(extractAudioFromVideo).toHaveBeenCalledWith(
        inputPath,
        '/path/to/audio.wav',  // Output path adjusted to match format
        options
      );
    });

    test('should convert audio format when input is audio file', async () => {
      const inputPath = '/path/to/audio.wav';
      const outputPath = '/path/to/audio.mp3';
      
      getMediaType.mockReturnValue({ mediaType: 'audio' });
      convertAudioFormat.mockResolvedValue();
      
      await extractAudio(inputPath, outputPath);
      
      expect(convertAudioFormat).toHaveBeenCalledWith(
        inputPath,
        outputPath,
        {
          format: 'mp3',
          bitrate: undefined,
          quality: undefined
        }
      );
      expect(fs.copy).not.toHaveBeenCalled();
    });

    test('should copy file when same format and no quality options', async () => {
      const inputPath = '/path/to/audio.mp3';
      const outputPath = '/path/to/output.mp3';
      
      getMediaType.mockReturnValue({ mediaType: 'audio' });
      
      await extractAudio(inputPath, outputPath);
      
      expect(fs.copy).toHaveBeenCalledWith(inputPath, outputPath);
      expect(convertAudioFormat).not.toHaveBeenCalled();
    });

    test('should convert when bitrate is specified even for same format', async () => {
      const inputPath = '/path/to/audio.mp3';
      const outputPath = '/path/to/output.mp3';
      const options = { bitrate: '320k' };
      
      getMediaType.mockReturnValue({ mediaType: 'audio' });
      convertAudioFormat.mockResolvedValue();
      
      await extractAudio(inputPath, outputPath, options);
      
      expect(convertAudioFormat).toHaveBeenCalledWith(
        inputPath,
        outputPath,
        {
          format: 'mp3',
          bitrate: '320k',
          quality: undefined
        }
      );
      expect(fs.copy).not.toHaveBeenCalled();
    });

    test('should auto-detect format from output filename', async () => {
      const inputPath = '/path/to/video.mp4';
      const outputPath = '/path/to/audio.wav';
      
      getMediaType.mockReturnValue({ mediaType: 'video' });
      extractAudioFromVideo.mockResolvedValue();
      
      await extractAudio(inputPath, outputPath);
      
      expect(extractAudioFromVideo).toHaveBeenCalledWith(
        inputPath,
        outputPath,
        {
          format: 'wav',
          bitrate: undefined,
          quality: undefined
        }
      );
    });

    test('should adjust output filename when format mismatch', async () => {
      const inputPath = '/path/to/video.mp4';
      const outputPath = '/path/to/audio.txt';
      const options = { format: 'mp3' };
      
      getMediaType.mockReturnValue({ mediaType: 'video' });
      extractAudioFromVideo.mockResolvedValue();
      
      await extractAudio(inputPath, outputPath, options);
      
      expect(extractAudioFromVideo).toHaveBeenCalledWith(
        inputPath,
        '/path/to/audio.mp3',
        options
      );
    });

    test('should handle extraction errors', async () => {
      const inputPath = '/path/to/video.mp4';
      const outputPath = '/path/to/audio.mp3';
      
      getMediaType.mockReturnValue({ mediaType: 'video' });
      extractAudioFromVideo.mockRejectedValue(new Error('FFmpeg error'));
      
      await expect(extractAudio(inputPath, outputPath))
        .rejects.toThrow('FFmpeg error');
    });

    test('should ensure output directory exists', async () => {
      const inputPath = '/path/to/video.mp4';
      const outputPath = '/deep/nested/path/audio.mp3';
      
      getMediaType.mockReturnValue({ mediaType: 'video' });
      extractAudioFromVideo.mockResolvedValue();
      
      await extractAudio(inputPath, outputPath);
      
      expect(fs.ensureDir).toHaveBeenCalledWith('/deep/nested/path');
    });
  });
});