const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

/**
 * Split a large audio file into smaller chunks based on maximum duration
 * @param {string} inputFile - Path to the input audio file
 * @param {number} maxDurationSeconds - Maximum duration of each chunk in seconds (default: 1400)
 * @returns {Promise<string[]>} - Array of paths to the chunked files
 */
async function splitAudioFile(inputFile, maxDurationSeconds = 1400) {
    // Create temp directory for chunks
    const tempDir = path.join(os.tmpdir(), 'audio-chunks-' + Date.now());
    await fs.ensureDir(tempDir);
    
    // Get audio duration
    const duration = await getAudioDuration(inputFile);
    
    // Calculate number of chunks based on duration
    const numChunks = Math.ceil(duration / maxDurationSeconds);
    
    const fileSizeInBytes = (await fs.stat(inputFile)).size;
    console.log(`Splitting ${path.basename(inputFile)} (${(fileSizeInBytes / (1024 * 1024)).toFixed(2)} MB, ${Math.floor(duration / 60)} minutes) into ${numChunks} chunks of max ${Math.floor(maxDurationSeconds / 60)} minutes each...`);
    
    // Array to store chunk file paths
    const chunkFiles = [];
    
    // Split audio into chunks based on duration
    for (let i = 0; i < numChunks; i++) {
        const startTime = i * maxDurationSeconds;
        const chunkDuration = Math.min(maxDurationSeconds, duration - startTime);
        const outputFile = path.join(tempDir, `chunk-${i}.mp3`);
        
        await new Promise((resolve, reject) => {
            ffmpeg(inputFile)
                .setStartTime(startTime)
                .setDuration(chunkDuration)
                .output(outputFile)
                .on('end', () => {
                    chunkFiles.push(outputFile);
                    resolve();
                })
                .on('error', reject)
                .run();
        });
        
        const chunkSize = (await fs.stat(outputFile)).size / (1024 * 1024);
        console.log(`Created chunk ${i+1}/${numChunks}: ${path.basename(outputFile)} (${chunkSize.toFixed(2)} MB, ${Math.floor(chunkDuration / 60)} minutes)`);
    }
    
    return chunkFiles;
}

/**
 * Get duration of an audio file in seconds
 * @param {string} filePath - Path to the audio file
 * @returns {Promise<number>} - Duration in seconds
 */
function getAudioDuration(filePath) {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) {
                reject(err);
                return;
            }
            
            resolve(metadata.format.duration);
        });
    });
}

/**
 * Cleanup temporary files
 * @param {string[]} filePaths - Array of file paths to clean up
 */
async function cleanupFiles(filePaths) {
    if (!filePaths || filePaths.length === 0) return;
    
    // Extract the directory from the first file
    const directory = path.dirname(filePaths[0]);
    
    try {
        await fs.remove(directory);
        console.log(`Cleaned up temporary files in ${directory}`);
    } catch (error) {
        console.error('Error cleaning up temporary files:', error);
    }
}

module.exports = {
    splitAudioFile,
    cleanupFiles
};