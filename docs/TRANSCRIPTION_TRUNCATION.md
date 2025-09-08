# Transcription Truncation: Known Issue and Solutions

## Overview

OpenAI's GPT-4o-transcribe model has a known issue where it may truncate transcriptions around the 10-11 minute mark, even when processing shorter audio chunks. This document explains the issue and how OpenTTS handles it.

## The Problem

- **Symptom**: Transcriptions unexpectedly end mid-sentence or mid-word
- **Occurrence**: Affects chunks around 10-11 minutes in length
- **Root Cause**: Internal limitation in OpenAI's GPT-4o-transcribe model
- **Impact**: Missing content at the end of audio segments

## How OpenTTS Solves This

### 1. Automatic Truncation Detection

OpenTTS detects potential truncation by analyzing:
- Ending punctuation patterns
- Word density (words per minute)
- Last word completeness
- Character count expectations

### 2. Multi-Model Fallback Strategy

When truncation is detected, OpenTTS automatically:
1. Retries with anti-truncation prompts
2. Falls back to whisper-1 model (which doesn't have this issue)
3. Uses whisper-1 by default for final chunks

### 3. Chunk Optimization

- Reduced chunk size from 23 to 15 minutes
- 15-second overlap between chunks prevents boundary loss
- Special audio enhancement for final chunks

## CLI Options

### Debug Truncation Issues

Save audio chunks for analysis:
```bash
opentts transcribe -i audio.mp3 -o transcript.txt --save-chunks
```

### Force Specific Model

Use environment variables to control model selection:
```bash
# Force whisper-1 for all chunks (most reliable)
TRANSCRIBE_MODEL=whisper-1 opentts transcribe -i audio.mp3 -o transcript.txt

# Disable automatic fallback
USE_FALLBACK_ON_TRUNCATION=false opentts transcribe -i audio.mp3 -o transcript.txt
```

## Troubleshooting

### Symptoms of Truncation

1. **Missing Final Content**
   - Check if transcription ends abruptly
   - Compare with expected duration
   - Look for incomplete sentences

2. **Word Density Issues**
   - Normal speech: 100-150 words/minute
   - If significantly lower, truncation may have occurred

### Manual Verification

```bash
# Check chunk durations
ffprobe -i audio.mp3 2>&1 | grep Duration

# Count words in transcription
wc -w transcript.txt

# Expected words = duration_in_minutes * 100 (minimum)
```

### Best Practices

1. **For Critical Transcriptions**
   ```bash
   # Use whisper-1 as primary model
   TRANSCRIBE_MODEL=whisper-1 opentts transcribe -i important.mp3 -o transcript.txt
   ```

2. **For Debugging**
   ```bash
   # Save chunks and check each one
   opentts transcribe -i audio.mp3 -o transcript.txt --save-chunks
   
   # Manually verify last chunk
   ffplay chunk-2.mp3  # Listen to verify content
   ```

3. **For Long Files**
   - Let OpenTTS handle chunking automatically
   - Final chunk always uses whisper-1 for completeness
   - Check transcription statistics in output

## Technical Details

### Model Characteristics

**GPT-4o-transcribe**:
- Pros: Newer model, better formatting
- Cons: Truncation bug at ~10-11 minutes
- Best for: Short clips under 10 minutes

**whisper-1**:
- Pros: No truncation issues, reliable
- Cons: Older model, different formatting
- Best for: Long recordings, final chunks

### Configuration

The truncation recovery system is configured in `src/constants.js`:
```javascript
TRANSCRIPTION: {
  CHUNK_DURATION_SECONDS: 900,      // 15 minutes
  CHUNK_OVERLAP_SECONDS: 15,        // Overlap to prevent loss
  MIN_WORDS_PER_MINUTE: 50,         // Truncation detection threshold
  MIN_CHARS_PER_MINUTE: 300,        // Character density check
}
```

## Future Improvements

- Monitoring OpenAI for model fixes
- Considering whisper-1 as default for all transcriptions
- Adding user-configurable model preferences
- Implementing real-time truncation detection

## Related Issues

- GitHub Issue: [#17 - Network resilience improvements](https://github.com/qodeca/opentts/issues/17)
- OpenAI Community: Multiple reports of GPT-4o-transcribe truncation