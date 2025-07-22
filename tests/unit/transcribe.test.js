const path = require('path');

// Set up mocks before requiring the module
jest.mock('fs-extra');
jest.mock('openai');
jest.mock('../../src/mediaSplitter');

const fs = require('fs-extra');
const { OpenAI } = require('openai');
const { splitMediaFile, cleanupFiles, getMediaDuration } = require('../../src/mediaSplitter');
const { transcribeAudio } = require('../../src/transcribe');

// Mock config
jest.mock('../../src/config', () => ({
  OPENAI_API_KEY: 'test-api-key',
  TRANSCRIBE_MODEL: 'gpt-4o-transcribe'
}));

describe('transcribe.js', () => {
  let mockOpenAIInstance;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset OpenAI mock to default success state
    OpenAI._setFailure(false);
    
    // Create and track the mock instance
    mockOpenAIInstance = {
      audio: {
        transcriptions: {
          create: jest.fn().mockResolvedValue({
            text: 'This is a mock transcription of the audio file. ' +
                  'It contains multiple sentences to simulate a real transcription. ' +
                  'The text needs to be long enough to pass validation checks. ' +
                  'Each chunk typically contains several minutes of spoken content. ' +
                  'This ensures the validation logic recognizes it as valid transcription. ' +
                  'We need at least 50 words per minute for the validation to pass. ' +
                  'So for a 23-minute chunk, we need quite a bit of text here. ' +
                  'This mock transcription simulates what a real API response would return. ' +
                  'It includes various topics and sentences to make it realistic. ' +
                  'The validation checks for minimum word count and character density. ' +
                  'This text should now be long enough to satisfy those requirements. ' +
                  'Real transcriptions would have much more varied and natural content. ' +
                  'But for testing purposes, this repetitive text should suffice.'
          })
        }
      }
    };
    
    // Make OpenAI constructor return our tracked instance
    OpenAI.mockImplementation(() => mockOpenAIInstance);
    
    // Default mock implementations
    fs.createReadStream.mockReturnValue('mock-file-stream');
    fs.ensureDir.mockResolvedValue();
    fs.writeFile.mockResolvedValue();
    fs.stat.mockResolvedValue({ size: 1024 * 1024 * 10 }); // 10MB
    fs.statSync.mockReturnValue({ size: 1024 * 1024 * 10 }); // 10MB
    
    // Default splitMediaFile mock
    splitMediaFile.mockResolvedValue({
      chunkFiles: ['/tmp/chunk-0.mp3', '/tmp/chunk-1.mp3'],
      filesToCleanup: []
    });
    
    cleanupFiles.mockResolvedValue();
    
    // Mock getMediaDuration
    getMediaDuration.mockResolvedValue(180); // 3 minutes - short enough to skip validation
  });

  describe('transcribeAudio', () => {
    test('should transcribe audio file successfully', async () => {
      const inputPath = '/path/to/audio.mp3';
      const outputPath = '/path/to/output.txt';
      
      const result = await transcribeAudio(inputPath, outputPath);
      
      // Verify file splitting
      expect(splitMediaFile).toHaveBeenCalledWith(inputPath, 1390);
      
      // Verify OpenAI was initialized
      expect(OpenAI).toHaveBeenCalledWith({ apiKey: 'test-api-key' });
      
      // Verify transcription calls
      expect(mockOpenAIInstance.audio.transcriptions.create).toHaveBeenCalledTimes(2); // 2 chunks
      
      // Verify output was written
      expect(fs.ensureDir).toHaveBeenCalledWith('/path/to');
      expect(fs.writeFile).toHaveBeenCalledWith(
        outputPath,
        expect.stringContaining('This is a mock transcription')
      );
      
      // Verify cleanup
      expect(cleanupFiles).toHaveBeenCalledWith([
        '/tmp/chunk-0.mp3',
        '/tmp/chunk-1.mp3'
      ]);
      
      // Spinner is mocked in test environment, so we don't need to verify it
    });

    test('should handle video files by extracting audio first', async () => {
      const inputPath = '/path/to/video.mp4';
      const outputPath = '/path/to/output.txt';
      
      // Mock video processing with extracted audio
      splitMediaFile.mockResolvedValue({
        chunkFiles: ['/tmp/chunk-0.mp3'],
        filesToCleanup: ['/tmp/extracted-audio.mp3']
      });
      
      await transcribeAudio(inputPath, outputPath);
      
      expect(splitMediaFile).toHaveBeenCalledWith(inputPath, 1390);
      expect(cleanupFiles).toHaveBeenCalledWith([
        '/tmp/extracted-audio.mp3',
        '/tmp/chunk-0.mp3'
      ]);
    });

    test('should handle single chunk files', async () => {
      const inputPath = '/path/to/short-audio.mp3';
      const outputPath = '/path/to/output.txt';
      
      // Mock single chunk
      splitMediaFile.mockResolvedValue({
        chunkFiles: ['/tmp/chunk-0.mp3'],
        filesToCleanup: []
      });
      
      await transcribeAudio(inputPath, outputPath);
      
      expect(mockOpenAIInstance.audio.transcriptions.create).toHaveBeenCalledTimes(1);
    });

    test('should handle transcription errors in chunks', async () => {
      const inputPath = '/path/to/audio.mp3';
      const outputPath = '/path/to/output.txt';
      
      // Make all chunks fail
      splitMediaFile.mockResolvedValue({
        chunkFiles: ['/tmp/chunk-0.mp3'],
        filesToCleanup: []
      });
      
      // Make OpenAI fail
      mockOpenAIInstance.audio.transcriptions.create.mockRejectedValue(new Error('OpenAI API error'));
      
      // Should complete but with empty transcription
      await transcribeAudio(inputPath, outputPath);
      
      // Verify empty transcription was written (since all chunks failed)
      expect(fs.writeFile).toHaveBeenCalledWith(outputPath, '');
    });

    test('should continue processing if one chunk fails', async () => {
      const inputPath = '/path/to/audio.mp3';
      const outputPath = '/path/to/output.txt';
      
      // Mock 3 chunks
      splitMediaFile.mockResolvedValue({
        chunkFiles: ['/tmp/chunk-0.mp3', '/tmp/chunk-1.mp3', '/tmp/chunk-2.mp3'],
        filesToCleanup: []
      });
      
      // Make the second chunk fail
      mockOpenAIInstance.audio.transcriptions.create
        .mockResolvedValueOnce({ text: 'First chunk transcription' })
        .mockRejectedValueOnce(new Error('API error'))
        .mockResolvedValueOnce({ text: 'Third chunk transcription' });
      
      await transcribeAudio(inputPath, outputPath);
      
      // Should still write output with successful chunks
      expect(fs.writeFile).toHaveBeenCalledWith(
        outputPath,
        'First chunk transcription\n\nThird chunk transcription'
      );
    });

    test('should handle file splitting errors', async () => {
      const inputPath = '/path/to/audio.mp3';
      const outputPath = '/path/to/output.txt';
      
      splitMediaFile.mockRejectedValue(new Error('Splitting failed'));
      
      await expect(transcribeAudio(inputPath, outputPath)).rejects.toThrow('Splitting failed');
      
      // Spinner is mocked in test environment
    });

    test('should create output directory if it does not exist', async () => {
      const inputPath = '/path/to/audio.mp3';
      const outputPath = '/new/directory/output.txt';
      
      await transcribeAudio(inputPath, outputPath);
      
      expect(fs.ensureDir).toHaveBeenCalledWith('/new/directory');
    });

    test('should properly format multiple chunk transcriptions', async () => {
      const inputPath = '/path/to/audio.mp3';
      const outputPath = '/path/to/output.txt';
      
      // Mock 3 chunks with different transcriptions
      splitMediaFile.mockResolvedValue({
        chunkFiles: ['/tmp/chunk-0.mp3', '/tmp/chunk-1.mp3', '/tmp/chunk-2.mp3'],
        filesToCleanup: []
      });
      
      mockOpenAIInstance.audio.transcriptions.create
        .mockResolvedValueOnce({ text: 'First part of the transcription' })
        .mockResolvedValueOnce({ text: 'Second part of the transcription' })
        .mockResolvedValueOnce({ text: 'Third part of the transcription' });
      
      await transcribeAudio(inputPath, outputPath);
      
      expect(fs.writeFile).toHaveBeenCalledWith(
        outputPath,
        'First part of the transcription\n\nSecond part of the transcription\n\nThird part of the transcription'
      );
    });

    test('should pass correct parameters to OpenAI API', async () => {
      const inputPath = '/path/to/audio.mp3';
      const outputPath = '/path/to/output.txt';
      
      splitMediaFile.mockResolvedValue({
        chunkFiles: ['/tmp/chunk-0.mp3'],
        filesToCleanup: []
      });
      
      await transcribeAudio(inputPath, outputPath);
      
      expect(mockOpenAIInstance.audio.transcriptions.create).toHaveBeenCalledWith({
        file: 'mock-file-stream',
        model: 'gpt-4o-transcribe',
        response_format: 'text',
        file_name: 'audio.mp3'
      });
    });

    test('should handle transcription response without text property', async () => {
      const inputPath = '/path/to/audio.mp3';
      const outputPath = '/path/to/output.txt';
      
      splitMediaFile.mockResolvedValue({
        chunkFiles: ['/tmp/chunk-0.mp3'],
        filesToCleanup: []
      });
      
      // Mock response that returns string directly
      mockOpenAIInstance.audio.transcriptions.create.mockResolvedValue('Direct transcription text');
      
      await transcribeAudio(inputPath, outputPath);
      
      expect(fs.writeFile).toHaveBeenCalledWith(
        outputPath,
        'Direct transcription text'
      );
    });
  });
});