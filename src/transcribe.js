const fs = require('fs-extra');
const { OpenAI } = require('openai');
const config = require('./config');
const path = require('path');
const { splitMediaFile, cleanupFiles, getMediaDuration } = require('./mediaSplitter');
const { TRANSCRIPTION, API, LOGGING, PROMPTS, MODELS } = require('./constants');

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
 * @param {Object} options - Additional options
 * @param {boolean} options.saveChunks - Whether to save chunks for debugging
 * @returns {Promise<string>} - Transcription text
 */
async function transcribeAudio(filePath, outputPath, options = {}) {
    const openai = new OpenAI({
        apiKey: config.OPENAI_API_KEY
    });
    
    // Initialize ora if not already done
    if (!ora) {
        await initializeOra();
    }
    
    spinner = ora('Preparing media file for transcription...').start();
    
    try {
        // Use consistent chunk duration from constants
        const CHUNK_DURATION_SECONDS = TRANSCRIPTION.CHUNK_DURATION_SECONDS;
        const MAX_DURATION_SECONDS = TRANSCRIPTION.MAX_DURATION_SECONDS;
        
        let allFilesToCleanup = [];
        let transcriptionParts = [];
        let chunkResults = []; // Track success/failure of each chunk
        
        // Split the file into chunks based on duration, handling both audio and video
        spinner.text = `Analyzing media file duration...`;
        const { chunkFiles, filesToCleanup } = await splitMediaFile(filePath, CHUNK_DURATION_SECONDS);
        
        // Add any temp files from media processing to the cleanup list
        if (filesToCleanup && filesToCleanup.length) {
            allFilesToCleanup = [...allFilesToCleanup, ...filesToCleanup];
        }
        
        spinner.succeed(`Split media into ${chunkFiles.length} chunks for processing`);
        
        // Enhanced logging for debugging
        if (LOGGING.DETAILED_CHUNK_LOGGING) {
            console.log('\n🔍 Detailed Chunk Information:');
            for (let i = 0; i < chunkFiles.length; i++) {
                const chunkDuration = await getMediaDuration(chunkFiles[i]);
                const chunkStats = await fs.stat(chunkFiles[i]);
                console.log(`  Chunk ${i+1}: ${Math.floor(chunkDuration/60)}:${String(Math.floor(chunkDuration%60)).padStart(2, '0')} (${(chunkStats.size/(1024*1024)).toFixed(2)} MB)`);
            }
            console.log('');
        }
        
        // Process each chunk with proper error handling
        for (let i = 0; i < chunkFiles.length; i++) {
            const chunkPath = chunkFiles[i];
            const chunkStats = await fs.stat(chunkPath);
            const chunkSizeMB = (chunkStats.size / (1024 * 1024)).toFixed(2);
            
            spinner = ora(`Transcribing chunk ${i+1}/${chunkFiles.length} (${chunkSizeMB} MB)...`).start();
            
            spinner.text = `Transcribing chunk ${i+1}/${chunkFiles.length} (${chunkSizeMB} MB)...`;
            
            try {
                // Use the new recovery function with automatic fallback
                const result = await transcribeChunkWithRecovery(openai, chunkPath, i, chunkFiles.length);
                
                // Record successful transcription
                transcriptionParts.push(result.transcription);
                chunkResults.push({ 
                    index: i, 
                    success: true, 
                    content: result.transcription, 
                    duration: result.duration,
                    wordCount: result.wordCount,
                    model: result.model,
                    truncated: result.truncated
                });
                
                if (result.truncated) {
                    spinner.warn(`Chunk ${i+1}/${chunkFiles.length} transcribed with potential truncation (${result.wordCount} words)`);
                } else {
                    spinner.succeed(`Successfully transcribed chunk ${i+1}/${chunkFiles.length} (${result.wordCount} words)`);
                }
                
            } catch (error) {
                // Complete failure after all recovery attempts
                spinner.fail(`Failed to transcribe chunk ${i+1}: ${error.message}`);
                console.error(`\n🚨 CRITICAL ERROR: Chunk ${i+1} failed completely.`);
                console.error('This will result in missing content in your transcription.');
                
                // Clean up and fail the entire process
                await cleanupFiles(allFilesToCleanup);
                await cleanupFiles(chunkFiles);
                
                throw new Error(`Chunk ${i+1} transcription failed: ${error.message}. Cannot continue with incomplete transcription.`);
            }
        }
        
        // Verify all chunks were processed successfully
        if (chunkResults.length !== chunkFiles.length) {
            throw new Error(`Critical error: Only ${chunkResults.length}/${chunkFiles.length} chunks were processed successfully.`);
        }
        
        console.log(`\n✅ All ${chunkFiles.length} chunks transcribed successfully!`);
        
        // Enhanced logging: Processing summary
        if (LOGGING.DETAILED_CHUNK_LOGGING) {
            console.log('\n📊 Processing Summary:');
            let totalRetries = 0;
            chunkResults.forEach((result, index) => {
                const successAttempt = result.attempts || 1;
                if (successAttempt > 1) totalRetries += (successAttempt - 1);
                console.log(`  Chunk ${index+1}: ${result.content.split(/\s+/).length} words, ${Math.floor(result.duration/60)}:${String(Math.floor(result.duration%60)).padStart(2, '0')} duration`);
            });
            if (totalRetries > 0) {
                console.log(`  Total retries needed: ${totalRetries}`);
            }
        }
        
        // Comprehensive validation of chunk completeness
        const chunkValidation = validateChunkCompleteness(chunkResults, chunkFiles);
        if (!chunkValidation.isComplete) {
            console.warn('\n⚠️  Chunk Validation Warnings:');
            chunkValidation.warnings.forEach(warning => console.warn(`   - ${warning}`));
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
        
        // Clean up all temporary files (unless saveChunks is enabled)
        if (options.saveChunks) {
            console.log('\n💾 Chunks saved for debugging:');
            chunkFiles.forEach((chunkFile, index) => {
                console.log(`   Chunk ${index + 1}: ${chunkFile}`);
            });
            if (allFilesToCleanup.length > 0) {
                console.log('\n💾 Additional files saved:');
                allFilesToCleanup.forEach(file => {
                    console.log(`   ${file}`);
                });
            }
            console.log('\n⚠️  Remember to manually clean up these files when done debugging!');
        } else {
            await cleanupFiles(allFilesToCleanup);
        }
        
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
    
    // Calculate expected content based on duration (only for chunks longer than minimum)
    if (duration > TRANSCRIPTION.MIN_VALIDATION_DURATION_SECONDS) {
        const expectedWords = Math.floor((duration / 60) * TRANSCRIPTION.MIN_WORDS_PER_MINUTE);
        const actualWords = trimmedText.split(/\s+/).filter(word => word.length > 0).length;
        
        if (actualWords < expectedWords) {
            return {
                isValid: false,
                reason: 'Suspiciously short',
                details: `Expected at least ${expectedWords} words for ${Math.floor(duration/60)}min audio, got ${actualWords} words`
            };
        }
        
        // Check character density
        const expectedChars = Math.floor((duration / 60) * TRANSCRIPTION.MIN_CHARS_PER_MINUTE);
        
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
    if (emptyRatio > TRANSCRIPTION.MAX_EMPTY_LINE_RATIO) {
        warnings.push(`High empty line ratio: ${(emptyRatio * 100).toFixed(1)}% of lines are empty`);
    }
    
    // Check for duplicate content
    const uniqueLines = new Set(lines.filter(line => line.trim().length > 0));
    if (uniqueLines.size < totalLines - emptyLines) {
        warnings.push('Duplicate content detected in transcription');
    }
    
    // Overall length check
    const totalWords = transcription.split(/\s+/).filter(word => word.length > 0).length;
    const expectedMinWords = Math.floor((totalDuration / 60) * TRANSCRIPTION.MIN_WORDS_PER_MINUTE);
    
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
 * Detect if a transcription appears to be truncated
 * @param {string} transcription - The transcribed text
 * @param {number} audioDurationSeconds - Duration of the audio in seconds
 * @returns {Object} - Detection result with confidence score
 */
function detectTruncation(transcription, audioDurationSeconds) {
    const text = transcription.trim();
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
    const wordsPerMinute = (wordCount / audioDurationSeconds) * 60;
    
    // Indicators of truncation
    const endsWithPunctuation = /[.!?:;]$/.test(text);
    const lastWord = text.split(/\s+/).pop() || '';
    const endsWithCompleteWord = /^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+$/.test(lastWord);
    const hasReasonableWordDensity = wordsPerMinute >= TRANSCRIPTION.MIN_WORDS_PER_MINUTE;
    
    // Check for mid-word cutoff (common truncation indicator)
    const likelyMidWordCutoff = lastWord.length > 2 && !endsWithPunctuation && 
                                !/[.!?:;,]/.test(text.slice(-10)); // No punctuation in last 10 chars
    
    // Calculate truncation confidence score (0-1)
    const truncationScore = 
        (!endsWithPunctuation ? 0.3 : 0) +
        (!endsWithCompleteWord ? 0.2 : 0) +
        (!hasReasonableWordDensity ? 0.3 : 0) +
        (likelyMidWordCutoff ? 0.2 : 0);
    
    return {
        likely: truncationScore > 0.5,
        score: truncationScore,
        confidence: (truncationScore * 100).toFixed(1) + '%',
        wordsPerMinute: Math.round(wordsPerMinute),
        wordCount,
        endsWithPunctuation,
        lastWord,
        reasons: [
            !endsWithPunctuation && 'No ending punctuation',
            !endsWithCompleteWord && 'Ends with incomplete word',
            !hasReasonableWordDensity && `Low word density (${Math.round(wordsPerMinute)} wpm)`,
            likelyMidWordCutoff && 'Likely cut off mid-word'
        ].filter(Boolean)
    };
}

/**
 * Validate that all chunks were processed completely and cover the expected duration
 * @param {Array} chunkResults - Array of chunk processing results
 * @param {Array} chunkFiles - Array of chunk file paths
 * @returns {Object} - Validation result with completeness info
 */
function validateChunkCompleteness(chunkResults, chunkFiles) {
    const warnings = [];
    
    // Check that all chunks have content
    let totalTranscribedDuration = 0;
    let emptyChunks = 0;
    let shortChunks = 0;
    
    chunkResults.forEach((result, index) => {
        totalTranscribedDuration += result.duration;
        
        if (!result.content || result.content.trim().length === 0) {
            emptyChunks++;
            warnings.push(`Chunk ${index + 1} has no transcribed content`);
        } else if (result.content.trim().length < 50) {
            shortChunks++;
            warnings.push(`Chunk ${index + 1} has suspiciously short content (${result.content.trim().length} characters)`);
        }
    });
    
    // Check for content continuity issues
    if (chunkResults.length > 1) {
        for (let i = 1; i < chunkResults.length; i++) {
            const prevChunk = chunkResults[i - 1].content.trim();
            const currentChunk = chunkResults[i].content.trim();
            
            // Check if chunks seem completely unrelated (simple heuristic)
            if (prevChunk.length > 100 && currentChunk.length > 100) {
                const prevWords = prevChunk.split(/\s+/).slice(-5).join(' ').toLowerCase();
                const currentWords = currentChunk.split(/\s+/).slice(0, 5).join(' ').toLowerCase();
                
                // Very basic continuity check - in real speech, there's usually some connection
                if (prevWords.length > 0 && currentWords.length > 0) {
                    // This is a placeholder for more sophisticated continuity checking
                    // For now, just log the boundary for debugging
                    console.log(`\n🔍 Chunk ${i} boundary preview:`);
                    console.log(`  Previous chunk ends: "...${prevWords}"`);
                    console.log(`  Current chunk starts: "${currentWords}..."`);
                }
            }
        }
    }
    
    // Summary validation
    if (emptyChunks > 0) {
        warnings.push(`${emptyChunks} chunks have no content - possible transcription failures`);
    }
    
    if (shortChunks > 0) {
        warnings.push(`${shortChunks} chunks have unusually short content - possible incomplete transcription`);
    }
    
    return {
        isComplete: warnings.length === 0,
        warnings: warnings,
        stats: {
            totalChunks: chunkResults.length,
            emptyChunks: emptyChunks,
            shortChunks: shortChunks,
            totalTranscribedDuration: Math.floor(totalTranscribedDuration),
            averageChunkDuration: Math.floor(totalTranscribedDuration / chunkResults.length)
        }
    };
}

/**
 * Transcribe a single audio chunk
 * @param {OpenAI} openai - OpenAI client
 * @param {string} filePath - Path to the audio chunk
 * @returns {Promise<string>} - Transcription text
 */
async function transcribeChunk(openai, filePath, options = {}) {
    const { model = config.TRANSCRIBE_MODEL, prompt = PROMPTS.STANDARD_ANTI_TRUNCATION, attemptNumber = 1 } = options;
    
    // Set up the file stream
    const fileStream = fs.createReadStream(filePath);
    const fileExtension = path.extname(filePath).toLowerCase();
    
    // Prepare transcription parameters
    const transcriptionParams = {
        file: fileStream,
        model: model,
        response_format: API.RESPONSE_FORMAT,
        file_name: `audio${fileExtension}`,  // Explicitly set the filename with extension
        timeout: API.TIMEOUT_MS
    };
    
    // Add model-specific parameters
    if (model === MODELS.GPT4O_TRANSCRIBE) {
        transcriptionParams.prompt = prompt;
        transcriptionParams.temperature = 0.2;  // Lower temperature for more deterministic output
        transcriptionParams.language = "pl";    // Polish - helps with accuracy
    } else if (model === MODELS.WHISPER_1) {
        // Whisper-1 has different parameter requirements
        // Prompt is optional and temperature works differently
        if (attemptNumber === 1) {
            transcriptionParams.temperature = 0;
        }
    }
    
    // Attempt transcription
    const transcription = await openai.audio.transcriptions.create(transcriptionParams);
    
    return transcription.text || transcription;
}

/**
 * Transcribe a chunk with automatic fallback on truncation detection
 * @param {OpenAI} openai - OpenAI client
 * @param {string} filePath - Path to the audio chunk
 * @param {number} chunkIndex - Index of the current chunk
 * @param {number} totalChunks - Total number of chunks
 * @returns {Promise<Object>} - Transcription result with metadata
 */
async function transcribeChunkWithRecovery(openai, filePath, chunkIndex, totalChunks) {
    const chunkDuration = await getMediaDuration(filePath);
    const chunkStats = await fs.stat(filePath);
    const chunkSizeMB = (chunkStats.size / (1024 * 1024)).toFixed(2);
    
    console.log(`\n🎯 Processing chunk ${chunkIndex + 1}/${totalChunks} (${chunkSizeMB} MB, ${Math.floor(chunkDuration/60)}:${String(Math.floor(chunkDuration%60)).padStart(2, '0')})`);
    
    // For the final chunk, start with whisper-1 to avoid truncation issues
    const isFinalChunk = chunkIndex === totalChunks - 1;
    
    if (isFinalChunk) {
        console.log('  📍 Final chunk detected - using whisper-1 model to ensure complete transcription');
    }
    
    // Define fallback attempts
    const attempts = isFinalChunk ? [
        // Final chunk: Start with whisper-1 which doesn't have truncation issues
        { 
            model: config.FALLBACK_MODEL, 
            prompt: null,
            name: 'Whisper-1 (primary for final chunk)'
        },
        { 
            model: config.TRANSCRIBE_MODEL, 
            prompt: PROMPTS.AGGRESSIVE_ANTI_TRUNCATION,
            name: 'GPT-4o fallback with aggressive anti-truncation'
        }
    ] : [
        // Non-final chunks: Use normal order
        { 
            model: config.TRANSCRIBE_MODEL, 
            prompt: PROMPTS.STANDARD_ANTI_TRUNCATION,
            name: 'GPT-4o with standard anti-truncation'
        },
        { 
            model: config.TRANSCRIBE_MODEL, 
            prompt: PROMPTS.AGGRESSIVE_ANTI_TRUNCATION,
            name: 'GPT-4o with aggressive anti-truncation'
        },
        { 
            model: config.FALLBACK_MODEL, 
            prompt: null,
            name: 'Whisper-1 fallback'
        }
    ];
    
    let lastError = null;
    let bestTranscription = null;
    let usedModel = null;
    
    for (let i = 0; i < attempts.length; i++) {
        const attempt = attempts[i];
        
        try {
            console.log(`  🔄 Attempt ${i + 1}: ${attempt.name}`);
            
            const transcription = await transcribeChunk(openai, filePath, {
                model: attempt.model,
                prompt: attempt.prompt,
                attemptNumber: i + 1
            });
            
            // Check for truncation
            const truncationCheck = detectTruncation(transcription, chunkDuration);
            
            if (!truncationCheck.likely) {
                console.log(`  ✅ Success: Complete transcription (${truncationCheck.wordCount} words, ${truncationCheck.wordsPerMinute} wpm)`);
                return {
                    transcription,
                    truncated: false,
                    model: attempt.model,
                    wordCount: truncationCheck.wordCount,
                    duration: chunkDuration
                };
            }
            
            // Transcription is likely truncated
            console.warn(`  ⚠️  Truncation detected (confidence: ${truncationCheck.confidence})`);
            truncationCheck.reasons.forEach(reason => console.warn(`     - ${reason}`));
            
            // Keep the best attempt so far
            if (!bestTranscription || truncationCheck.wordCount > bestTranscription.wordCount) {
                bestTranscription = {
                    transcription,
                    truncated: true,
                    model: attempt.model,
                    wordCount: truncationCheck.wordCount,
                    duration: chunkDuration,
                    truncationInfo: truncationCheck
                };
                usedModel = attempt.model;
            }
            
        } catch (error) {
            lastError = error;
            console.error(`  ❌ Failed: ${error.message}`);
        }
    }
    
    // If we get here, all attempts had issues
    if (bestTranscription) {
        console.warn(`\n⚠️  Using best available transcription from ${usedModel} (likely truncated)`);
        return bestTranscription;
    }
    
    // Complete failure
    throw new Error(`Failed to transcribe chunk ${chunkIndex + 1} after all attempts: ${lastError?.message}`);
}

module.exports = { transcribeAudio };