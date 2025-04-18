# Speech-to-Text Application

This project is a simple Node.js application that converts audio files into text using the GPT-4o-transcribe model. It reads an audio file (in MP3 format) and outputs the transcription.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Environment Variables](#environment-variables)
- [Contributing](#contributing)
- [License](#license)

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```
   cd speech-to-text-app
   ```

3. Install the dependencies:
   ```
   npm install
   ```

## Usage

1. Place your audio file (e.g., `audio.mp3`) in the desired location (e.g., Desktop).
2. Update the `.env` file with your OpenAI API key.
3. Run the application:
   ```
   node src/index.js
   ```

The transcription will be printed to the console.

## Environment Variables

The application requires the following environment variable:

- `OPENAI_API_KEY`: Your OpenAI API key for accessing the GPT-4o-transcribe model.

You can create a `.env` file in the root directory with the following content:

```
OPENAI_API_KEY=your_api_key_here
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.