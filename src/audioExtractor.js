const path = require('path');
const fs = require('fs-extra');
const { extractAudioFromVideo, getMediaType, convertAudioFormat } = require('./mediaSplitter');

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
 * Extract audio from video file or convert between audio formats
 * @param {string} inputPath - Path to the input media file
 * @param {string} outputPath - Path where the audio file will be saved
 * @param {Object} options - Extraction options
 * @param {string} options.format - Output audio format (mp3, wav, m4a, aac)
 * @param {string} options.bitrate - Audio bitrate (e.g., 128k, 320k)
 * @param {string} options.quality - Quality level (0-9, 0=best)
 * @returns {Promise<void>}
 */
async function extractAudio(inputPath, outputPath, options = {}) {
    // Initialize ora if not already done
    if (!ora) {
        await initializeOra();
    }
    
    spinner = ora('Preparing media file for audio extraction...').start();
    
    try {
        const { mediaType } = getMediaType(inputPath);
        
        // Ensure output directory exists
        const outputDir = path.dirname(outputPath);
        await fs.ensureDir(outputDir);
        
        // Auto-detect format from output filename if not specified
        let format = options.format;
        if (!format) {
            const ext = path.extname(outputPath).toLowerCase().slice(1);
            if (['mp3', 'wav', 'm4a', 'aac'].includes(ext)) {
                format = ext;
            } else {
                format = 'mp3'; // default
            }
        }
        
        // Ensure output path has correct extension
        const outputExt = path.extname(outputPath).toLowerCase().slice(1);
        if (outputExt !== format) {
            outputPath = outputPath.replace(/\.[^.]+$/, `.${format}`);
            console.log(`Output filename adjusted to match format: ${path.basename(outputPath)}`);
        }
        
        if (mediaType === 'video') {
            spinner.text = 'Extracting audio from video file...';
            
            // Extract audio from video with specified format and options
            await extractAudioFromVideo(inputPath, outputPath, {
                format,
                bitrate: options.bitrate,
                quality: options.quality
            });
            
            spinner.succeed('Successfully extracted audio from video');
        } else {
            // Audio file - check if conversion needed
            const inputExt = path.extname(inputPath).toLowerCase().slice(1);
            
            if (inputExt === format && !options.bitrate && !options.quality) {
                // Same format and no quality options - simple copy
                spinner.text = 'Copying audio file...';
                await fs.copy(inputPath, outputPath);
                spinner.succeed('Successfully copied audio file');
            } else {
                // Convert audio format or apply quality settings
                spinner.text = `Converting audio to ${format.toUpperCase()} format...`;
                
                await convertAudioFormat(inputPath, outputPath, {
                    format,
                    bitrate: options.bitrate,
                    quality: options.quality
                });
                
                spinner.succeed(`Successfully converted audio to ${format.toUpperCase()}`);
            }
        }
        
        // Show output file size
        const outputStats = await fs.stat(outputPath);
        console.log(`Output file size: ${(outputStats.size / (1024 * 1024)).toFixed(2)} MB`);
        
    } catch (error) {
        spinner.fail('Audio extraction failed');
        throw error;
    }
}

module.exports = {
    extractAudio
};