const fs = require('fs-extra');
const { OpenAI } = require('openai');
const config = require('./config');
const path = require('path');
const { splitMediaFile, cleanupFiles, getMediaDuration } = require('./mediaSplitter');

// Import ora with dynamic import or use mock in test environment
let spinner;
let ora;

// Initialize ora based on environment
async function initializeOra() {
    if (process.env.NODE_ENV === 'test') {
        // In test environment, use a simple mock
        ora = () => ({
            start: () => ({ succeed: () => {}, fail: () => {}, text: '' }),
            succeed: () => {},
            fail: () => {},
            text: ''
        });
    } else {
        // In production, use dynamic import
        const oraModule = await import('ora');
        ora = oraModule.default;
    }
}

/**
 * Transcribe an audio or video file with OpenAI's API
 * @param {string} filePath - Path to the audio or video file
 * @param {string} outputPath - Path where the transcription will be saved
 * @returns {Promise<string>} - Transcription text
 */
async function transcribeAudio(filePath, outputPath) {
    const openai = new OpenAI({
        apiKey: config.OPENAI_API_KEY
    });
    
    // Initialize ora if not already done
    if (!ora) {
        await initializeOra();
    }
    
    spinner = ora('Preparing media file for transcription...').start();
    
    try {
        // Maximum duration allowed by the model in seconds (25 minutes)
        const MAX_DURATION_SECONDS = 1500;
        // Use a slightly lower value for our chunks to be safe (with 10s buffer for FFmpeg precision)
        const CHUNK_DURATION_SECONDS = 1390;
        
        let allFilesToCleanup = [];
        let transcriptionParts = [];
        
        // Split the file into chunks based on duration, handling both audio and video
        spinner.text = `Analyzing media file duration...`;
        const { chunkFiles, filesToCleanup } = await splitMediaFile(filePath, CHUNK_DURATION_SECONDS);
        
        // Add any temp files from media processing to the cleanup list
        if (filesToCleanup && filesToCleanup.length) {
            allFilesToCleanup = [...allFilesToCleanup, ...filesToCleanup];
        }
        
        spinner.succeed(`Split media into ${chunkFiles.length} chunks for processing`);
        
        // Process each chunk
        for (let i = 0; i < chunkFiles.length; i++) {
            const chunkPath = chunkFiles[i];
            const chunkStats = await fs.stat(chunkPath);
            const chunkSizeMB = (chunkStats.size / (1024 * 1024)).toFixed(2);
            
            spinner = ora(`Transcribing chunk ${i+1}/${chunkFiles.length} (${chunkSizeMB} MB)...`).start();
            
            try {
                // Transcribe this chunk
                const chunkTranscription = await transcribeChunk(openai, chunkPath);
                
                // Validate chunk transcription
                const chunkDuration = await getMediaDuration(chunkPath);
                const validationResult = validateTranscription(chunkTranscription, chunkDuration, i+1, chunkFiles.length);
                
                if (!validationResult.isValid) {
                    spinner.warn(`Chunk ${i+1}/${chunkFiles.length} may be incomplete: ${validationResult.reason}`);
                    console.warn(`Warning: ${validationResult.details}`);
                }
                
                transcriptionParts.push(chunkTranscription);
                spinner.succeed(`Successfully transcribed chunk ${i+1}/${chunkFiles.length}`);
            } catch (error) {
                spinner.fail(`Failed to transcribe chunk ${i+1}: ${error.message}`);
                console.error('Chunk error details:', error);
            }
        }
        
        // Add chunk files to cleanup list
        allFilesToCleanup = [...allFilesToCleanup, ...chunkFiles];
        
        // Save combined transcription to the specified output path
        const transcription = transcriptionParts.join('\n\n');
        
        // Validate complete transcription
        const totalDuration = await getMediaDuration(filePath);
        const finalValidation = validateCompleteTranscription(transcription, totalDuration);
        
        // Ensure the directory exists
        await fs.ensureDir(path.dirname(outputPath));
        await fs.writeFile(outputPath, transcription);
        
        spinner = ora('Finalizing transcription...').start();
        spinner.succeed(`Full transcription saved to ${outputPath}`);
        
        // Display validation warnings if any
        if (!finalValidation.isComplete) {
            console.warn('\n⚠️  Transcription Quality Warnings:');
            finalValidation.warnings.forEach(warning => {
                console.warn(`   - ${warning}`);
            });
            console.warn('\n📊 Transcription Statistics:');
            console.warn(`   - Total words: ${finalValidation.stats.totalWords}`);
            console.warn(`   - Duration: ${finalValidation.stats.durationMinutes} minutes`);
            console.warn(`   - Empty lines: ${finalValidation.stats.emptyLines}/${finalValidation.stats.totalLines}`);
            console.warn('\n💡 Tip: Check the audio quality or try re-running the transcription');
        }
        
        // Clean up all temporary files
        await cleanupFiles(allFilesToCleanup);
        
        return transcription;
    } catch (error) {
        if (spinner) {
            spinner.fail(`Error during transcription: ${error.message}`);
        }
        
        // Enhanced error information
        console.error('Error details:', error);
        console.error('File information:');
        console.error(`- Path: ${filePath}`);
        console.error(`- Size: ${(fs.statSync(filePath).size / (1024 * 1024)).toFixed(2)} MB`);
        console.error(`- Extension: ${path.extname(filePath)}`);
        
        // Suggestion for next steps
        console.error('\nPossible solutions:');
        console.error('1. Ensure the file is in a supported format (audio: mp3, wav, m4a, mpga, mp4, webm or video: mp4, mov, avi, mkv, webm, flv, wmv)');
        console.error('2. Check if the file is not corrupted by playing it in a media player');
        console.error('3. Verify that your OpenAI API key has access to the GPT-4o-transcribe model');
        
        throw error;
    }
}

/**
 * Validate transcription quality and completeness
 * @param {string} transcription - The transcribed text
 * @param {number} duration - Duration of the audio in seconds
 * @param {number} chunkNumber - Current chunk number
 * @param {number} totalChunks - Total number of chunks
 * @returns {Object} - Validation result with isValid, reason, and details
 */
function validateTranscription(transcription, duration, chunkNumber, totalChunks) {
    const text = transcription || '';
    const trimmedText = text.trim();
    
    // Check if completely empty
    if (trimmedText.length === 0) {
        return {
            isValid: false,
            reason: 'Empty transcription',
            details: `Chunk ${chunkNumber}/${totalChunks} returned no text content`
        };
    }
    
    // Check if only ellipsis or dots
    if (trimmedText === '...' || trimmedText === '…') {
        return {
            isValid: false,
            reason: 'Only ellipsis',
            details: `Chunk ${chunkNumber}/${totalChunks} contains only ellipsis`
        };
    }
    
    // Calculate expected content based on duration (only for chunks longer than 5 minutes)
    if (duration > 300) { // Only validate chunks longer than 5 minutes
        const WORDS_PER_MINUTE = 150; // Average speaking rate
        const MIN_WORDS_PER_MINUTE = 50; // Minimum for slow speech
        const expectedWords = Math.floor((duration / 60) * MIN_WORDS_PER_MINUTE);
        const actualWords = trimmedText.split(/\s+/).filter(word => word.length > 0).length;
        
        if (actualWords < expectedWords) {
            return {
                isValid: false,
                reason: 'Suspiciously short',
                details: `Expected at least ${expectedWords} words for ${Math.floor(duration/60)}min audio, got ${actualWords} words`
            };
        }
        
        // Check character density
        const MIN_CHARS_PER_MINUTE = 300;
        const expectedChars = Math.floor((duration / 60) * MIN_CHARS_PER_MINUTE);
        
        if (trimmedText.length < expectedChars) {
            return {
                isValid: false,
                reason: 'Low character count',
                details: `Expected at least ${expectedChars} characters, got ${trimmedText.length}`
            };
        }
    }
    
    return {
        isValid: true,
        reason: 'Valid',
        details: `Chunk ${chunkNumber}/${totalChunks} appears complete`
    };
}

/**
 * Validate the complete transcription
 * @param {string} transcription - The complete transcribed text
 * @param {number} totalDuration - Total duration of the original audio
 * @returns {Object} - Overall validation summary
 */
function validateCompleteTranscription(transcription, totalDuration) {
    const lines = transcription.split('\n');
    const emptyLines = lines.filter(line => line.trim() === '').length;
    const totalLines = lines.length;
    const emptyRatio = emptyLines / totalLines;
    
    const warnings = [];
    
    // Check for high ratio of empty lines
    if (emptyRatio > 0.3) {
        warnings.push(`High empty line ratio: ${(emptyRatio * 100).toFixed(1)}% of lines are empty`);
    }
    
    // Check for duplicate content
    const uniqueLines = new Set(lines.filter(line => line.trim().length > 0));
    if (uniqueLines.size < totalLines - emptyLines) {
        warnings.push('Duplicate content detected in transcription');
    }
    
    // Overall length check
    const totalWords = transcription.split(/\s+/).filter(word => word.length > 0).length;
    const expectedMinWords = Math.floor((totalDuration / 60) * 50); // 50 words per minute minimum
    
    if (totalWords < expectedMinWords) {
        warnings.push(`Transcription may be incomplete: ${totalWords} words for ${Math.floor(totalDuration/60)}min audio`);
    }
    
    return {
        isComplete: warnings.length === 0,
        warnings: warnings,
        stats: {
            totalLines: totalLines,
            emptyLines: emptyLines,
            totalWords: totalWords,
            totalCharacters: transcription.length,
            durationMinutes: Math.floor(totalDuration / 60)
        }
    };
}

/**
 * Transcribe a single audio chunk
 * @param {OpenAI} openai - OpenAI client
 * @param {string} filePath - Path to the audio chunk
 * @returns {Promise<string>} - Transcription text
 */
async function transcribeChunk(openai, filePath) {
    // Set up the file stream
    const fileStream = fs.createReadStream(filePath);
    const fileExtension = path.extname(filePath).toLowerCase();
    
    // Attempt transcription with explicit file_name
    const transcription = await openai.audio.transcriptions.create({
        file: fileStream,
        model: config.TRANSCRIBE_MODEL,
        response_format: "text",
        file_name: `audio${fileExtension}`  // Explicitly set the filename with extension
    });
    
    return transcription.text || transcription;
}

module.exports = { transcribeAudio };