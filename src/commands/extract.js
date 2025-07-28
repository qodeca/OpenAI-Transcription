const fs = require('fs-extra');
const path = require('path');
const { extractAudio } = require('../audioExtractor');
const { getMediaType } = require('../mediaSplitter');

async function extractCommand(options) {
    try {
        // Use paths from command line arguments
        const inputFilePath = options.input;
        const outputFilePath = options.output;
        const format = options.format;
        const bitrate = options.bitrate;
        const quality = options.quality;
        
        // Resolve relative paths if provided
        const resolvedInputPath = path.isAbsolute(inputFilePath) 
            ? inputFilePath 
            : path.resolve(process.cwd(), inputFilePath);
            
        const resolvedOutputPath = path.isAbsolute(outputFilePath) 
            ? outputFilePath 
            : path.resolve(process.cwd(), outputFilePath);
        
        console.log(`Looking for media file at: ${resolvedInputPath}`);
        
        if (!await fs.exists(resolvedInputPath)) {
            throw new Error(`File not found at: ${resolvedInputPath}`);
        }
        
        // Check if the file format is supported
        const { isSupported, mediaType, extension } = getMediaType(resolvedInputPath);
        
        if (!isSupported) {
            throw new Error(`Unsupported file format: ${extension}. Please provide an audio or video file in a supported format.`);
        }
        
        const stats = await fs.stat(resolvedInputPath);
        console.log(`Found ${mediaType} file: ${path.basename(resolvedInputPath)} (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`);
        
        // Check if the file is empty
        if (stats.size === 0) {
            throw new Error(`${mediaType} file exists but is empty (0 bytes)`);
        }
        
        // Validate output format
        const validFormats = ['mp3', 'wav', 'm4a', 'aac'];
        if (!validFormats.includes(format)) {
            throw new Error(`Invalid output format: ${format}. Supported formats: ${validFormats.join(', ')}`);
        }
        
        // Extract or convert audio
        await extractAudio(resolvedInputPath, resolvedOutputPath, {
            format,
            bitrate,
            quality
        });
        
        console.log('\nAudio extraction completed successfully!');
        console.log(`Audio file has been saved to: ${resolvedOutputPath}`);
    } catch (error) {
        console.error('Error during audio extraction process:', error.message);
        process.exit(1);
    }
}

module.exports = extractCommand;