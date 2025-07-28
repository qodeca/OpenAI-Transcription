#!/usr/bin/env node

require('dotenv').config();
const { program } = require('commander');
const { version } = require('../package.json');

// Configure main program
program
    .name('opentts')
    .version(version)
    .description('OpenTTS - Open Text-to-Speech & Transcription Suite');

// Add transcribe command
program
    .command('transcribe')
    .description('Convert audio or video files to text transcription using OpenAI GPT-4o-transcribe model')
    .requiredOption('-i, --input <path>', 'Path to the input audio or video file')
    .requiredOption('-o, --output <path>', 'Path where the transcription will be saved')
    .action(require('./commands/transcribe'));

// Add extract command
program
    .command('extract')
    .description('Extract audio from video files or convert between audio formats')
    .requiredOption('-i, --input <path>', 'Path to the input video or audio file')
    .requiredOption('-o, --output <path>', 'Path where the audio file will be saved')
    .option('-f, --format <format>', 'Output audio format (mp3|wav|m4a|aac)', 'mp3')
    .option('-b, --bitrate <rate>', 'Audio bitrate (e.g., 128k, 320k)', '192k')
    .option('-q, --quality <level>', 'Quality level (0-9, 0=best)', '2')
    .action(require('./commands/extract'));

// Handle legacy usage (backward compatibility)
if (process.argv.length > 2 && !['transcribe', 'extract'].includes(process.argv[2])) {
    // Check if old-style arguments are provided
    const hasOldStyleArgs = process.argv.some(arg => arg === '-i' || arg === '--input');
    
    if (hasOldStyleArgs) {
        console.log('\n⚠️  Warning: You are using the legacy command format.');
        console.log('This format is deprecated and will be removed in a future version.');
        console.log('\nPlease use the new command format:');
        console.log('  node src/index.js transcribe -i <input> -o <output>');
        console.log('\nAutomatically running transcribe command for backward compatibility...\n');
        
        // Insert 'transcribe' command for backward compatibility
        process.argv.splice(2, 0, 'transcribe');
    }
}

// Parse arguments
program.parse(process.argv);