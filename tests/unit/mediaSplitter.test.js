const path = require('path');
const os = require('os');

// Set up mocks before requiring the module
jest.mock('fluent-ffmpeg');
jest.mock('ffmpeg-static');
jest.mock('fs-extra');

const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs-extra');
const {
  splitMediaFile,
  getMediaType,
  extractAudioFromVideo,
  cleanupFiles
} = require('../../src/mediaSplitter');

describe('mediaSplitter.js', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset ffmpeg mock to default success state
    ffmpeg._setSuccess(true);
  });

  describe('getMediaType', () => {
    test('should identify audio files correctly', () => {
      const audioFiles = [
        'test.mp3',
        'audio.wav',
        'song.m4a',
        'voice.mpga',
        'recording.mpeg'
      ];

      audioFiles.forEach(file => {
        const result = getMediaType(file);
        expect(result.isSupported).toBe(true);
        expect(result.mediaType).toBe('audio');
        expect(result.extension).toBe(path.extname(file).toLowerCase());
      });
    });

    test('should identify video files correctly', () => {
      const videoFiles = [
        'movie.mp4',
        'video.mov',
        'clip.avi',
        'film.mkv',
        'stream.webm',
        'old.flv',
        'windows.wmv'
      ];

      videoFiles.forEach(file => {
        const result = getMediaType(file);
        expect(result.isSupported).toBe(true);
        expect(result.mediaType).toBe('video');
        expect(result.extension).toBe(path.extname(file).toLowerCase());
      });
    });

    test('should identify unsupported files correctly', () => {
      const unsupportedFiles = [
        'document.pdf',
        'text.txt',
        'image.jpg',
        'data.json',
        'script.js'
      ];

      unsupportedFiles.forEach(file => {
        const result = getMediaType(file);
        expect(result.isSupported).toBe(false);
        expect(result.mediaType).toBe('unknown');
        expect(result.extension).toBe(path.extname(file).toLowerCase());
      });
    });

    test('should handle files with uppercase extensions', () => {
      const result = getMediaType('AUDIO.MP3');
      expect(result.isSupported).toBe(true);
      expect(result.mediaType).toBe('audio');
      expect(result.extension).toBe('.mp3');
    });
  });

  describe('extractAudioFromVideo', () => {
    test('should extract audio from video successfully', async () => {
      const videoPath = '/path/to/video.mp4';
      const result = await extractAudioFromVideo(videoPath);

      expect(fs.ensureDir).toHaveBeenCalled();
      expect(ffmpeg).toHaveBeenCalledWith(videoPath);
      expect(ffmpeg.noVideo).toHaveBeenCalled();
      expect(ffmpeg.audioCodec).toHaveBeenCalledWith('libmp3lame');
      expect(result).toMatch(/extracted-audio.mp3$/);
    });

    test('should handle extraction errors', async () => {
      ffmpeg._setSuccess(false);
      const videoPath = '/path/to/video.mp4';

      await expect(extractAudioFromVideo(videoPath)).rejects.toThrow('FFmpeg error');
    });
  });

  describe('splitMediaFile', () => {
    test('should split audio file into chunks', async () => {
      const audioFile = '/path/to/audio.mp3';
      const result = await splitMediaFile(audioFile, 1400);

      expect(fs.ensureDir).toHaveBeenCalled();
      expect(ffmpeg.ffprobe).toHaveBeenCalledWith(audioFile, expect.any(Function));
      expect(result.chunkFiles).toHaveLength(3); // 3600s / 1400s = 3 chunks
      expect(result.filesToCleanup).toEqual([]);
    });

    test('should extract audio from video before splitting', async () => {
      const videoFile = '/path/to/video.mp4';
      const result = await splitMediaFile(videoFile, 1400);

      expect(ffmpeg).toHaveBeenCalledWith(videoFile); // For extraction
      expect(ffmpeg.noVideo).toHaveBeenCalled();
      expect(result.chunkFiles).toHaveLength(3);
      expect(result.filesToCleanup).toHaveLength(1); // Extracted audio file
    });

    test('should throw error for unsupported file format', async () => {
      const unsupportedFile = '/path/to/document.pdf';
      
      await expect(splitMediaFile(unsupportedFile)).rejects.toThrow('Unsupported file format: .pdf');
    });

    test('should handle single chunk when file is shorter than max duration', async () => {
      // Mock shorter duration
      ffmpeg.ffprobe.mockImplementationOnce((filePath, callback) => {
        callback(null, { format: { duration: 600 } }); // 10 minutes
      });

      const audioFile = '/path/to/short-audio.mp3';
      const result = await splitMediaFile(audioFile, 1400);

      expect(result.chunkFiles).toHaveLength(1);
    });

    test('should calculate correct chunk parameters', async () => {
      // Mock specific duration for precise testing
      ffmpeg.ffprobe.mockImplementationOnce((filePath, callback) => {
        callback(null, { format: { duration: 3000 } }); // 50 minutes
      });

      const audioFile = '/path/to/audio.mp3';
      await splitMediaFile(audioFile, 1400); // 23.33 minutes per chunk

      // Should create 3 chunks: 0-1400s, 1400-2800s, 2800-3000s
      expect(ffmpeg.setStartTime).toHaveBeenCalledWith(0);
      expect(ffmpeg.setStartTime).toHaveBeenCalledWith(1400);
      expect(ffmpeg.setStartTime).toHaveBeenCalledWith(2800);

      expect(ffmpeg.setDuration).toHaveBeenCalledWith(1400);
      expect(ffmpeg.setDuration).toHaveBeenCalledWith(1400);
      expect(ffmpeg.setDuration).toHaveBeenCalledWith(200); // Last chunk is only 200s
    });
  });

  describe('cleanupFiles', () => {
    test('should cleanup files successfully', async () => {
      const files = ['/tmp/file1.mp3', '/tmp/file2.mp3'];
      await cleanupFiles(files);

      expect(fs.exists).toHaveBeenCalledTimes(2);
      expect(fs.remove).toHaveBeenCalledTimes(2);
    });

    test('should cleanup directories', async () => {
      fs.stat.mockResolvedValueOnce({
        size: 0,
        isDirectory: () => true
      });

      const dirs = ['/tmp/media-chunks-123'];
      await cleanupFiles(dirs);

      expect(fs.remove).toHaveBeenCalledWith(dirs[0]);
    });

    test('should cleanup parent temp directory for single files', async () => {
      const file = '/tmp/media-chunks-123/chunk-0.mp3';
      await cleanupFiles([file]);

      expect(fs.remove).toHaveBeenCalledWith('/tmp/media-chunks-123');
    });

    test('should handle non-existent files gracefully', async () => {
      fs.exists.mockResolvedValueOnce(false);

      const files = ['/tmp/non-existent.mp3'];
      await cleanupFiles(files);

      expect(fs.remove).not.toHaveBeenCalled();
    });

    test('should handle empty file array', async () => {
      await cleanupFiles([]);
      await cleanupFiles(null);
      await cleanupFiles(undefined);

      expect(fs.exists).not.toHaveBeenCalled();
      expect(fs.remove).not.toHaveBeenCalled();
    });

    test('should not cleanup non-temp directories', async () => {
      const file = '/home/user/documents/file.mp3';
      await cleanupFiles([file]);

      expect(fs.remove).toHaveBeenCalledWith(file);
      expect(fs.remove).not.toHaveBeenCalledWith('/home/user/documents');
    });
  });
});