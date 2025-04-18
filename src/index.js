require('dotenv').config();
const fs = require('fs-extra');
const path = require('path');
const { program } = require('commander');
const { transcribeAudio } = require('./transcribe');
const { version } = require('../package.json');

// Configure command line options
program
    .version(version)
    .description('Convert audio or video files to text transcription using OpenAI GPT-4o-transcribe model')
    .requiredOption('-i, --input <path>', 'Path to the input audio or video file (required)')
    .requiredOption('-o, --output <path>', 'Path where the transcription will be saved (required)')
    .parse(process.argv);

const options = program.opts();

async function main() {
    try {
        // Use paths from command line arguments
        const inputFilePath = options.input;
        const outputFilePath = options.output;
        
        // Resolve relative paths if provided
        const resolvedInputPath = path.isAbsolute(inputFilePath) 
            ? inputFilePath 
            : path.resolve(process.cwd(), inputFilePath);
            
        const resolvedOutputPath = path.isAbsolute(outputFilePath) 
            ? outputFilePath 
            : path.resolve(process.cwd(), outputFilePath);
        
        console.log(`Looking for media file at: ${resolvedInputPath}`);
        
        if (!await fs.exists(resolvedInputPath)) {
            throw new Error(`Media file not found at: ${resolvedInputPath}`);
        }
        
        const stats = await fs.stat(resolvedInputPath);
        console.log(`Found media file: ${path.basename(resolvedInputPath)} (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`);
        
        // Check if the file is empty
        if (stats.size === 0) {
            throw new Error('Media file exists but is empty (0 bytes)');
        }
        
        // Call the transcribeAudio function with the resolved paths
        const transcription = await transcribeAudio(resolvedInputPath, resolvedOutputPath);
        
        console.log('\nTranscription completed successfully!');
        console.log(`Full transcription has been saved to: ${resolvedOutputPath}`);
    } catch (error) {
        console.error('Error during transcription process:', error.message);
        process.exit(1);
    }
}

main();