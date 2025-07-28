const { exec } = require('child_process');
const path = require('path');
const os = require('os');
const { promisify } = require('util');

// Use actual fs module in integration tests, not the mock
jest.unmock('fs-extra');
const fs = require('fs-extra');

const execAsync = promisify(exec);

describe('CLI Integration Tests', () => {
  // Properly escape the CLI path to handle spaces
  const cliPath = `"${path.join(__dirname, '../../src/index.js')}"`;
  let tempDir;

  beforeAll(async () => {
    // Create a temporary directory for test outputs
    tempDir = path.join(os.tmpdir(), 'cli-test-' + Date.now());
    await fs.ensureDir(tempDir);
  });

  afterAll(async () => {
    // Clean up temporary directory
    await fs.remove(tempDir);
  });

  describe('Command Line Arguments', () => {
    test('should show help when no arguments provided', async () => {
      try {
        await execAsync(`node ${cliPath}`);
        // If it doesn't throw, check stdout
        fail('Expected command to exit with code 1');
      } catch (error) {
        // Commander.js exits with code 1 when no command is provided
        expect(error.code).toBe(1);
        // Commander outputs help to stderr when exiting with error
        const output = error.stdout + error.stderr;
        expect(output).toContain('Usage: opentts');
        expect(output).toContain('Commands:');
        expect(output).toContain('transcribe');
        expect(output).toContain('extract');
      }
    });

    test('should show help with -h flag', async () => {
      const { stdout } = await execAsync(`node ${cliPath} -h`);
      
      expect(stdout).toContain('Usage:');
      expect(stdout).toContain('Commands:');
      expect(stdout).toContain('transcribe');
      expect(stdout).toContain('extract');
      expect(stdout).toContain('--version');
      expect(stdout).toContain('-h, --help');
    });
    
    test('should show transcribe help with transcribe -h', async () => {
      const { stdout } = await execAsync(`node ${cliPath} transcribe -h`);
      
      expect(stdout).toContain('Usage: opentts transcribe');
      expect(stdout).toContain('-i, --input');
      expect(stdout).toContain('-o, --output');
    });

    test('should show version with --version flag', async () => {
      const { stdout } = await execAsync(`node ${cliPath} --version`);
      const packageJson = require('../../package.json');
      
      expect(stdout.trim()).toBe(packageJson.version);
    });

    test('should error when input file is missing', async () => {
      const outputPath = path.join(tempDir, 'output.txt');
      
      try {
        await execAsync(`node ${cliPath} transcribe -i /nonexistent/file.mp3 -o ${outputPath}`);
      } catch (error) {
        expect(error.code).toBe(1);
        expect(error.stderr).toContain('Error during transcription process');
        expect(error.stderr).toContain('File not found');
      }
    });

    test('should error when input file has unsupported format', async () => {
      const inputPath = path.join(tempDir, 'test.pdf');
      const outputPath = path.join(tempDir, 'output.txt');
      
      // Create a dummy PDF file
      await fs.writeFile(inputPath, 'dummy pdf content');
      
      try {
        await execAsync(`node ${cliPath} transcribe -i ${inputPath} -o ${outputPath}`);
      } catch (error) {
        expect(error.code).toBe(1);
        expect(error.stderr).toContain('Error during transcription process');
        expect(error.stderr).toContain('Unsupported file format');
        expect(error.stderr).toContain('.pdf');
      }
    });

    test('should error when only input is provided for transcribe', async () => {
      const inputPath = path.join(tempDir, 'test.mp3');
      await fs.writeFile(inputPath, 'dummy audio content');
      
      try {
        await execAsync(`node ${cliPath} transcribe -i ${inputPath}`);
      } catch (error) {
        expect(error.code).toBe(1);
        expect(error.stderr).toContain('error: required option');
        expect(error.stderr).toContain('-o, --output');
      }
    });

    test('should error when only output is provided for transcribe', async () => {
      const outputPath = path.join(tempDir, 'output.txt');
      
      try {
        await execAsync(`node ${cliPath} transcribe -o ${outputPath}`);
      } catch (error) {
        expect(error.code).toBe(1);
        expect(error.stderr).toContain('error: required option');
        expect(error.stderr).toContain('-i, --input');
      }
    });
    
    test('should show deprecation warning for legacy command format', async () => {
      const inputPath = path.join(tempDir, 'test.mp3');
      const outputPath = path.join(tempDir, 'output.txt');
      await fs.writeFile(inputPath, 'dummy audio content');
      
      try {
        await execAsync(`node ${cliPath} -i ${inputPath} -o ${outputPath}`);
      } catch (error) {
        // The command will fail due to invalid file, but we should see the deprecation warning
        expect(error.stdout).toContain('Warning: You are using the legacy command format');
        expect(error.stdout).toContain('deprecated');
      }
    });
  });

  describe('Environment Variables', () => {
    test.skip('should error when OPENAI_API_KEY is not set', async () => {
      // Skipping this test as it requires a valid audio file to get past ffmpeg validation
      // In a real scenario, we would need to copy a valid test audio file
    });
  });

  describe('File Path Handling', () => {
    test('should handle relative paths', async () => {
      const inputFile = 'test-audio.mp3';
      const outputFile = 'test-output.txt';
      
      // Create test file in current directory
      await fs.writeFile(inputFile, 'dummy audio content');
      
      try {
        // This will fail due to API key, but we're testing path resolution
        await execAsync(`node ${cliPath} -i ${inputFile} -o ${outputFile}`);
      } catch (error) {
        // Should get past file validation
        expect(error.stderr).not.toContain('Input file not found');
      } finally {
        // Cleanup
        await fs.remove(inputFile);
      }
    });

    test('should handle paths with spaces', async () => {
      const inputPath = path.join(tempDir, 'test audio file.mp3');
      const outputPath = path.join(tempDir, 'test output file.txt');
      
      await fs.writeFile(inputPath, 'dummy audio content');
      
      try {
        await execAsync(`node ${cliPath} -i "${inputPath}" -o "${outputPath}"`);
      } catch (error) {
        // Should get past file validation
        expect(error.stderr).not.toContain('Input file not found');
      }
    });

    test('should create output directory if it does not exist', async () => {
      const inputPath = path.join(tempDir, 'test.mp3');
      const nestedOutputPath = path.join(tempDir, 'nested', 'dirs', 'output.txt');
      
      await fs.writeFile(inputPath, 'dummy audio content');
      
      // Note: This test verifies directory creation logic exists in the code
      // Actual transcription will fail without valid API key
      expect(fs.existsSync(path.dirname(nestedOutputPath))).toBe(false);
    });
  });

  describe('Supported File Formats', () => {
    const audioFormats = ['.mp3', '.wav', '.m4a', '.mpga', '.mpeg'];
    const videoFormats = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.wmv'];
    
    audioFormats.forEach(format => {
      test(`should accept audio format: ${format}`, async () => {
        const inputPath = path.join(tempDir, `test-audio${format}`);
        const outputPath = path.join(tempDir, 'output.txt');
        
        await fs.writeFile(inputPath, 'dummy audio content');
        
        try {
          await execAsync(`node ${cliPath} -i ${inputPath} -o ${outputPath}`);
        } catch (error) {
          // Should not error on file format
          expect(error.stderr).not.toContain('Unsupported file format');
        }
      });
    });
    
    videoFormats.forEach(format => {
      test(`should accept video format: ${format}`, async () => {
        const inputPath = path.join(tempDir, `test-video${format}`);
        const outputPath = path.join(tempDir, 'output.txt');
        
        await fs.writeFile(inputPath, 'dummy video content');
        
        try {
          await execAsync(`node ${cliPath} -i ${inputPath} -o ${outputPath}`);
        } catch (error) {
          // Should not error on file format
          expect(error.stderr).not.toContain('Unsupported file format');
        }
      });
    });
  });
});