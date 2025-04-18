const fs = require('fs-extra');
const { OpenAI } = require('openai');
const config = require('./config');
const path = require('path');
const { splitMediaFile, cleanupFiles } = require('./mediaSplitter');

// Import ora with dynamic import
let spinner;

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
    
    // Import ora dynamically
    const { default: ora } = await import('ora');
    spinner = ora('Preparing media file for transcription...').start();
    
    try {
        // Maximum duration allowed by the model in seconds (25 minutes)
        const MAX_DURATION_SECONDS = 1500;
        // Use a slightly lower value for our chunks to be safe
        const CHUNK_DURATION_SECONDS = 1400;
        
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
        
        // Ensure the directory exists
        await fs.ensureDir(path.dirname(outputPath));
        await fs.writeFile(outputPath, transcription);
        
        spinner = ora('Finalizing transcription...').start();
        spinner.succeed(`Full transcription saved to ${outputPath}`);
        
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