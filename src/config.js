module.exports = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    TRANSCRIBE_MODEL: process.env.TRANSCRIBE_MODEL || 'gpt-4o-transcribe',
    FALLBACK_MODEL: process.env.FALLBACK_MODEL || 'whisper-1',
    API_ENDPOINT: 'https://api.openai.com/v1/audio/transcriptions',
    USE_FALLBACK_ON_TRUNCATION: process.env.USE_FALLBACK_ON_TRUNCATION !== 'false' // Default true
};