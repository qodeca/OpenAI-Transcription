/**
 * Shared constants for OpenTTS transcription system
 * 
 * This file centralizes configuration values to ensure consistency
 * across all modules and prevent the timing bugs that can cause
 * content loss during transcription.
 */

// Transcription chunk settings
const TRANSCRIPTION = {
    // Maximum chunk duration in seconds (9 minutes)
    // Reduced from 15 minutes to stay safely below GPT-4o-transcribe's 10-11 minute truncation threshold
    CHUNK_DURATION_SECONDS: 540,
    
    // Overlap between chunks in seconds to prevent content loss at boundaries
    // This helps ensure no speech is lost when chunks are split
    CHUNK_OVERLAP_SECONDS: 15,
    
    // Maximum duration allowed by OpenAI's transcription model (25 minutes)
    MAX_DURATION_SECONDS: 1500,
    
    // Retry settings for failed chunks
    MAX_RETRIES: 3,
    RETRY_DELAY_BASE_MS: 1000, // Base delay for exponential backoff
    
    // Validation thresholds
    MIN_WORDS_PER_MINUTE: 50, // Minimum for slow speech
    AVERAGE_WORDS_PER_MINUTE: 150, // Normal speaking rate
    MIN_CHARS_PER_MINUTE: 300, // Character density threshold
    
    // Quality warning thresholds
    MAX_EMPTY_LINE_RATIO: 0.3, // 30% empty lines triggers warning
    MIN_VALIDATION_DURATION_SECONDS: 300 // Only validate chunks longer than 5 minutes
};

// OpenAI API settings
const API = {
    MODEL: 'gpt-4-turbo-preview', // Transcription model to use
    RESPONSE_FORMAT: 'text', // Default response format
    TIMEOUT_MS: 300000 // 5 minute timeout for API calls
};

// Anti-truncation prompts
const PROMPTS = {
    STANDARD_ANTI_TRUNCATION: 
        "Transcribe the complete audio from start to finish. Do NOT truncate, omit, summarize, or stop early. Include EVERY spoken word until the absolute end of the audio file. Continue transcribing even during pauses or silence.",
    
    AGGRESSIVE_ANTI_TRUNCATION: 
        "CRITICAL: You MUST transcribe EVERY SINGLE WORD in this audio file from the very beginning to the very end. Do NOT stop transcribing until you have processed the ENTIRE audio file. If you detect silence, continue listening. If you think you're done, YOU'RE NOT - keep transcribing. Include all words, sounds, utterances, and speech until the file completely ends. This is a test of your ability to transcribe COMPLETE audio without truncation."
};

// Supported models
const MODELS = {
    GPT4O_TRANSCRIBE: 'gpt-4o-transcribe',
    WHISPER_1: 'whisper-1'
};

// Logging levels
const LOGGING = {
    LEVELS: {
        ERROR: 'error',
        WARN: 'warn', 
        INFO: 'info',
        DEBUG: 'debug'
    },
    // Enable detailed chunk-level logging for debugging
    DETAILED_CHUNK_LOGGING: true
};

module.exports = {
    TRANSCRIPTION,
    API,
    LOGGING,
    PROMPTS,
    MODELS
};