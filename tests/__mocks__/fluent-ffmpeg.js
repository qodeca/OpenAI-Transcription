// Mock for fluent-ffmpeg
const ffmpegMock = jest.fn(() => ffmpegMock);

// Default mock behavior
ffmpegMock.setFfmpegPath = jest.fn();
ffmpegMock.ffprobe = jest.fn((filePath, callback) => {
  // Default successful response
  callback(null, {
    format: {
      duration: 3600 // 1 hour default
    }
  });
});

// Chainable methods
ffmpegMock.output = jest.fn(() => ffmpegMock);
ffmpegMock.noVideo = jest.fn(() => ffmpegMock);
ffmpegMock.audioCodec = jest.fn(() => ffmpegMock);
ffmpegMock.audioBitrate = jest.fn(() => ffmpegMock);
ffmpegMock.audioQuality = jest.fn(() => ffmpegMock);
ffmpegMock.setStartTime = jest.fn(() => ffmpegMock);
ffmpegMock.setDuration = jest.fn(() => ffmpegMock);
ffmpegMock.on = jest.fn((event, handler) => {
  if (event === 'end' && ffmpegMock._shouldSucceed !== false) {
    // Simulate async success
    process.nextTick(() => handler());
  } else if (event === 'error' && ffmpegMock._shouldSucceed === false) {
    // Simulate async error
    process.nextTick(() => handler(new Error('Simulated ffmpeg error')));
  }
  return ffmpegMock;
});
ffmpegMock.run = jest.fn(() => ffmpegMock);

// Add prototype methods for tests that check them
ffmpegMock.prototype = {
  output: ffmpegMock.output,
  noVideo: ffmpegMock.noVideo,
  audioCodec: ffmpegMock.audioCodec,
  audioBitrate: ffmpegMock.audioBitrate,
  audioQuality: ffmpegMock.audioQuality,
  setStartTime: ffmpegMock.setStartTime,
  setDuration: ffmpegMock.setDuration,
  on: ffmpegMock.on,
  run: ffmpegMock.run
};

// Helper to control mock behavior
ffmpegMock._setSuccess = (shouldSucceed) => {
  ffmpegMock._shouldSucceed = shouldSucceed;
};

module.exports = ffmpegMock;