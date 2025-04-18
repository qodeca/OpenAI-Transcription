const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

// Audio file extensions
const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.mpga', '.mpeg', '.mp4', '.webm'];
// Video file extensions
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.wmv'];

/**
 * Check if file is a supported media file
 * @param {string} filePath - Path to the file
 * @returns {Object} - Object with isSupported and mediaType properties
 */
function getMediaType(filePath) {
    const extension = path.extname(filePath).toLowerCase();
    
    if (AUDIO_EXTENSIONS.includes(extension)) {
        return { isSupported: true, mediaType: 'audio', extension };
    }
    
    if (VIDEO_EXTENSIONS.includes(extension)) {
        return { isSupported: true, mediaType: 'video', extension };
    }
    
    return { isSupported: false, mediaType: 'unknown', extension };
}

/**
 * Extract audio from video file
 * @param {string} videoPath - Path to the video file
 * @returns {Promise<string>} - Path to the extracted audio file
 */
async function extractAudioFromVideo(videoPath) {
    const tempDir = path.join(os.tmpdir(), 'extracted-audio-' + Date.now());
    await fs.ensureDir(tempDir);
    
    const audioPath = path.join(tempDir, 'extracted-audio.mp3');
    
    return new Promise((resolve, reject) => {
        ffmpeg(videoPath)
            .output(audioPath)
            .noVideo()
            .audioCodec('libmp3lame')
            .on('end', () => {
                console.log(`Extracted audio from video file: ${path.basename(videoPath)}`);
                resolve(audioPath);
            })
            .on('error', (err) => {
                console.error('Error extracting audio from video:', err);
                reject(err);
            })
            .run();
    });
}

/**
 * Split a media file (audio or video) into smaller chunks based on maximum duration
 * @param {string} inputFile - Path to the input media file
 * @param {number} maxDurationSeconds - Maximum duration of each chunk in seconds (default: 1400)
 * @returns {Promise<Object>} - Object containing chunked files and temp files to clean up
 */
async function splitMediaFile(inputFile, maxDurationSeconds = 1400) {
    // Check media type
    const { isSupported, mediaType, extension } = getMediaType(inputFile);
    
    if (!isSupported) {
        throw new Error(`Unsupported file format: ${extension}. Supported formats: ${[...AUDIO_EXTENSIONS, ...VIDEO_EXTENSIONS].join(', ')}`);
    }
    
    // For video files, extract audio first
    let audioFile = inputFile;
    let filesToCleanup = [];
    
    if (mediaType === 'video') {
        console.log(`Processing video file: ${path.basename(inputFile)}`);
        audioFile = await extractAudioFromVideo(inputFile);
        filesToCleanup.push(audioFile);
    }
    
    // Now process the audio file (either original or extracted from video)
    
    // Create temp directory for chunks
    const tempDir = path.join(os.tmpdir(), 'media-chunks-' + Date.now());
    await fs.ensureDir(tempDir);
    
    // Get media duration
    const duration = await getMediaDuration(audioFile);
    
    // Calculate number of chunks based on duration
    const numChunks = Math.ceil(duration / maxDurationSeconds);
    
    const fileSizeInBytes = (await fs.stat(audioFile)).size;
    console.log(`Splitting ${path.basename(audioFile)} (${(fileSizeInBytes / (1024 * 1024)).toFixed(2)} MB, ${Math.floor(duration / 60)} minutes) into ${numChunks} chunks of max ${Math.floor(maxDurationSeconds / 60)} minutes each...`);
    
    // Array to store chunk file paths
    const chunkFiles = [];
    
    // Split audio into chunks based on duration
    for (let i = 0; i < numChunks; i++) {
        const startTime = i * maxDurationSeconds;
        const chunkDuration = Math.min(maxDurationSeconds, duration - startTime);
        const outputFile = path.join(tempDir, `chunk-${i}.mp3`);
        
        await new Promise((resolve, reject) => {
            ffmpeg(audioFile)
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
    
    // Return both the chunk files and any temp files that need cleaning up
    return { 
        chunkFiles,
        filesToCleanup
    };
}

/**
 * Get duration of a media file in seconds
 * @param {string} filePath - Path to the media file
 * @returns {Promise<number>} - Duration in seconds
 */
function getMediaDuration(filePath) {
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
 * Cleanup temporary files and directories
 * @param {string[]} filePaths - Array of file paths to clean up
 */
async function cleanupFiles(filePaths) {
    if (!filePaths || filePaths.length === 0) return;
    
    for (const filePath of filePaths) {
        if (await fs.exists(filePath)) {
            const stats = await fs.stat(filePath);
            
            if (stats.isDirectory()) {
                await fs.remove(filePath);
                console.log(`Cleaned up temporary directory: ${filePath}`);
            } else {
                // For single files, also try to clean up their parent temp directory if it exists
                const directory = path.dirname(filePath);
                if (directory.includes('temp') || directory.includes('tmp')) {
                    await fs.remove(directory);
                    console.log(`Cleaned up temporary directory: ${directory}`);
                } else {
                    await fs.remove(filePath);
                    console.log(`Cleaned up temporary file: ${filePath}`);
                }
            }
        }
    }
}

module.exports = {
    splitMediaFile,
    getMediaType,
    extractAudioFromVideo,
    cleanupFiles
};