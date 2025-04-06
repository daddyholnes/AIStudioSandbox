# Podplai-Live

A real-time podcast and livestreaming platform built with LiveKit, React, and Node.js.

## Features

- **Live Audio Streaming**: Host and join live audio sessions with real-time communication
- **Chat Functionality**: Text-based chat alongside audio streams
- **Episode Recording**: Record episodes for later distribution
- **User Authentication**: Secure login and user management
- **Podcast Library**: Browse and listen to recorded episodes
- **Mobile Responsive**: Access from any device

## Technology Stack

- **Frontend**: React, Tailwind CSS, LiveKit Client SDK
- **Backend**: Node.js, Express, LiveKit Server SDK
- **Real-time Communication**: WebSockets, LiveKit
- **Storage**: Server-side file storage for recordings

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- LiveKit API key and secret

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/podplai-live.git
cd podplai-live
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Create a `.env` file in the root directory with the following:
```
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
LIVEKIT_URL=your_livekit_url
```

4. Start the development server
```bash
npm run dev
```

## Usage

1. Create an account or log in
2. Create a new podcast room or join an existing one
3. Start broadcasting with your microphone
4. Invite listeners with a shareable link

## License

This project is licensed under the MIT License - see the LICENSE file for details.