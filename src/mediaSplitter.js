const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { TRANSCRIPTION } = require('./constants');

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

// Audio file extensions
const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.mpga', '.mpeg'];
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
 * @param {string} [outputPath] - Optional custom output path
 * @param {Object} [options] - Optional extraction options
 * @param {string} [options.format] - Output format (mp3, wav, m4a, aac)
 * @param {string} [options.bitrate] - Audio bitrate (e.g., 128k, 320k)
 * @param {string} [options.quality] - Quality level (0-9, 0=best)
 * @returns {Promise<string>} - Path to the extracted audio file
 */
async function extractAudioFromVideo(videoPath, outputPath = null, options = {}) {
    let audioPath;
    
    if (outputPath) {
        // Use custom output path
        audioPath = outputPath;
        const outputDir = path.dirname(audioPath);
        await fs.ensureDir(outputDir);
    } else {
        // Use temp directory (backward compatibility)
        const tempDir = path.join(os.tmpdir(), 'extracted-audio-' + Date.now());
        await fs.ensureDir(tempDir);
        audioPath = path.join(tempDir, 'extracted-audio.mp3');
    }
    
    const format = options.format || 'mp3';
    const audioCodecMap = {
        'mp3': 'libmp3lame',
        'wav': 'pcm_s16le',
        'm4a': 'aac',
        'aac': 'aac'
    };
    
    return new Promise((resolve, reject) => {
        const command = ffmpeg(videoPath)
            .output(audioPath)
            .noVideo()
            .audioCodec(audioCodecMap[format] || 'libmp3lame');
        
        // Apply bitrate if specified
        if (options.bitrate) {
            command.audioBitrate(options.bitrate);
        }
        
        // Apply quality if specified (for codecs that support it)
        if (options.quality && format === 'mp3') {
            command.audioQuality(parseInt(options.quality));
        }
        
        command
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
async function splitMediaFile(inputFile, maxDurationSeconds = TRANSCRIPTION.CHUNK_DURATION_SECONDS) {
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
    
    // Split audio into overlapping chunks to prevent content loss at boundaries
    const overlapSeconds = TRANSCRIPTION.CHUNK_OVERLAP_SECONDS;
    
    for (let i = 0; i < numChunks; i++) {
        // Calculate start time with overlap (except for first chunk)
        let startTime;
        if (i === 0) {
            startTime = 0; // First chunk starts at beginning
        } else {
            startTime = Math.max(0, (i * maxDurationSeconds) - overlapSeconds);
        }
        
        // Calculate chunk duration, ensuring we NEVER exceed the API limit
        const remainingDuration = duration - startTime;
        let chunkDuration;
        
        if (i === numChunks - 1) {
            // FINAL CHUNK: Always extend to the true end of the file + small buffer to capture all content
            // Add 10 seconds buffer to ensure we don't miss any content due to precision issues
            chunkDuration = remainingDuration + 10;
            console.log(`  🎯 Final chunk: extending to end of file + 10s buffer (${Math.floor(chunkDuration/60)}:${String(Math.floor(chunkDuration%60)).padStart(2, '0')})`);
        } else if (i === 0) {
            // First chunk: use full duration but respect API limit
            chunkDuration = Math.min(maxDurationSeconds, remainingDuration);
        } else {
            // Middle chunks: can have overlap but total duration must stay under limit
            chunkDuration = Math.min(maxDurationSeconds, remainingDuration);
        }
        
        // Skip if chunk would be too short to be meaningful
        if (chunkDuration < 5) {
            console.log(`Skipping chunk ${i+1}: too short (${chunkDuration}s)`);
            continue;
        }
        
        // Safety check: ensure we never exceed API limits
        if (chunkDuration > TRANSCRIPTION.MAX_DURATION_SECONDS) {
            console.warn(`⚠️  Warning: Chunk ${i+1} duration (${chunkDuration}s) exceeds API limit (${TRANSCRIPTION.MAX_DURATION_SECONDS}s)`);
            chunkDuration = TRANSCRIPTION.MAX_DURATION_SECONDS;
        }
        
        const outputFile = path.join(tempDir, `chunk-${i}.mp3`);
        
        await new Promise((resolve, reject) => {
            const ffmpegCommand = ffmpeg(audioFile)
                .setStartTime(startTime)
                .output(outputFile)
                .audioCodec('libmp3lame')
                .audioBitrate('192k');
            
            // For final chunk, don't set duration and add audio enhancement
            if (i === numChunks - 1) {
                console.log(`  🔄 Final chunk: no duration limit, extracting to absolute end with audio enhancement`);
                // Audio enhancement for final chunk to improve transcription accuracy
                ffmpegCommand.audioFilters([
                    'loudnorm=I=-16:TP=-1.5:LRA=11', // Loudness normalization
                    'highpass=f=80',                   // Remove low-frequency noise
                    'lowpass=f=8000'                   // Remove high-frequency noise
                ]);
                // Don't set duration for final chunk - let FFmpeg extract to the very end
            } else {
                ffmpegCommand.setDuration(chunkDuration);
                // Standard audio processing for non-final chunks
                ffmpegCommand.audioFilters('loudnorm=I=-16:TP=-1.5:LRA=11');
            }
            
            ffmpegCommand
                .on('end', () => {
                    chunkFiles.push(outputFile);
                    resolve();
                })
                .on('error', reject)
                .run();
        });
        
        const chunkSize = (await fs.stat(outputFile)).size / (1024 * 1024);
        const actualDuration = Math.min(chunkDuration, remainingDuration);
        
        console.log(`Created chunk ${i+1}/${numChunks}: ${path.basename(outputFile)} ` +
                   `(${chunkSize.toFixed(2)} MB, ${Math.floor(actualDuration / 60)}:${String(Math.floor(actualDuration % 60)).padStart(2, '0')})`);
        
        if (i > 0) {
            const actualOverlap = Math.min(overlapSeconds, startTime > 0 ? (i * maxDurationSeconds) - startTime : 0);
            if (actualOverlap > 0) {
                console.log(`  → Overlap: ${actualOverlap}s with previous chunk to prevent content loss`);
            }
        }
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
 * Convert audio file to different format or apply quality settings
 * @param {string} inputPath - Path to the input audio file
 * @param {string} outputPath - Path where the converted audio will be saved
 * @param {Object} [options] - Optional conversion options
 * @param {string} [options.format] - Output format (mp3, wav, m4a, aac)
 * @param {string} [options.bitrate] - Audio bitrate (e.g., 128k, 320k)
 * @param {string} [options.quality] - Quality level (0-9, 0=best)
 * @returns {Promise<void>}
 */
async function convertAudioFormat(inputPath, outputPath, options = {}) {
    const outputDir = path.dirname(outputPath);
    await fs.ensureDir(outputDir);
    
    const format = options.format || 'mp3';
    const audioCodecMap = {
        'mp3': 'libmp3lame',
        'wav': 'pcm_s16le',
        'm4a': 'aac',
        'aac': 'aac'
    };
    
    return new Promise((resolve, reject) => {
        const command = ffmpeg(inputPath)
            .output(outputPath)
            .audioCodec(audioCodecMap[format] || 'libmp3lame');
        
        // Apply bitrate if specified
        if (options.bitrate) {
            command.audioBitrate(options.bitrate);
        }
        
        // Apply quality if specified (for codecs that support it)
        if (options.quality && format === 'mp3') {
            command.audioQuality(parseInt(options.quality));
        }
        
        command
            .on('end', () => {
                console.log(`Converted audio to ${format.toUpperCase()} format`);
                resolve();
            })
            .on('error', (err) => {
                console.error('Error converting audio:', err);
                reject(err);
            })
            .run();
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
    convertAudioFormat,
    cleanupFiles,
    getMediaDuration
};