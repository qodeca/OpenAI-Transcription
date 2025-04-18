const fs = require('fs-extra');
const { OpenAI } = require('openai');
const config = require('./config');
const path = require('path');
const { splitAudioFile, cleanupFiles } = require('./audioSplitter');

// Import ora with dynamic import
let spinner;

/**
 * Transcribe an audio file with OpenAI's API
 * @param {string} filePath - Path to the audio file
 * @param {string} outputPath - Path where the transcription will be saved
 * @returns {Promise<string>} - Transcription text
 */
async function transcribeAudio(filePath, outputPath) {
    const openai = new OpenAI({
        apiKey: config.OPENAI_API_KEY
    });
    
    // Import ora dynamically
    const { default: ora } = await import('ora');
    spinner = ora('Preparing audio file for transcription...').start();
    
    try {
        // Get file duration using ffmpeg
        const ffmpeg = require('fluent-ffmpeg');
        
        // Maximum duration allowed by the model in seconds (25 minutes)
        const MAX_DURATION_SECONDS = 1500;
        // Use a slightly lower value for our chunks to be safe
        const CHUNK_DURATION_SECONDS = 1400;
        
        let chunkFiles = [];
        let transcriptionParts = [];
        
        // Split the file into chunks based on duration
        spinner.text = `Analyzing audio file duration...`;
        chunkFiles = await splitAudioFile(filePath, CHUNK_DURATION_SECONDS);
        spinner.succeed(`Split audio into ${chunkFiles.length} chunks for processing`);
        
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
        
        // Save combined transcription to the specified output path
        const transcription = transcriptionParts.join('\n\n');
        
        // Ensure the directory exists
        await fs.ensureDir(path.dirname(outputPath));
        await fs.writeFile(outputPath, transcription);
        
        spinner = ora('Finalizing transcription...').start();
        spinner.succeed(`Full transcription saved to ${outputPath}`);
        
        // Clean up temporary files
        await cleanupFiles(chunkFiles);
        
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
        console.error('1. Ensure the audio file is in a supported format (mp3, mp4, mpeg, mpga, m4a, wav, or webm)');
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