// Mock for OpenAI
const OpenAIMock = jest.fn().mockImplementation((config) => {
  return {
    apiKey: config.apiKey,
    audio: {
      transcriptions: {
        create: jest.fn(async (params) => {
          if (OpenAIMock._shouldFail) {
            throw new Error('OpenAI API error');
          }
          return {
            text: 'This is a mock transcription of the audio file.'
          };
        })
      }
    }
  };
});

OpenAIMock._shouldFail = false;
OpenAIMock._setFailure = (shouldFail) => {
  OpenAIMock._shouldFail = shouldFail;
};

module.exports = { OpenAI: OpenAIMock };