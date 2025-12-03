# 🖐️ Gesture Notes App

A touch-free gesture-controlled web application that allows you to create notes, draw, and record voice memos using hand gestures detected through your webcam.

## Features

- **Hand Tracking**: Real-time hand detection using MediaPipe Hands via TensorFlow.js
- **Gesture Control**: 
  - **Pinch** (thumb + index finger together) = Click action
  - **Fist** (closed hand) = Draw/drag action
  - **Open hand** = Move cursor
- **Drawing Canvas**: Draw freely on the screen using fist gesture in Draw Mode
- **Sticky Notes**: Create, edit, and drag notes around the screen
- **Voice Recording**: Record and playback voice notes attached to each sticky note
- **Touch-Free Interface**: Control everything with hand gestures

## Tech Stack

- React 18 + TypeScript
- Vite (build tool)
- TensorFlow.js Hand Pose Detection
- MediaPipe Hands
- Web APIs (MediaRecorder, getUserMedia)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

The app will start at `http://localhost:3000`

### 3. Allow Camera and Microphone Permissions

When prompted by your browser, allow access to:
- **Camera** (required for hand tracking)
- **Microphone** (required for voice notes)

## How to Use

### Getting Started

1. Open the app in your browser
2. Allow camera permissions
3. Wait for "Hand Detected" status in the toolbar
4. Position your hand in front of the camera

### Gestures

- **Open Hand**: Move your index finger to control the cursor (blue circle)
- **Pinch** (thumb + index together): Click action (cursor turns green)
- **Fist** (closed hand): Draw/drag action in Draw Mode (cursor turns red)

### Features

#### Pointer Mode (Default)
- Use pinch gesture to interact with UI elements
- Click buttons and interact with notes

#### Draw Mode
- Click "Draw Mode" button or use pinch gesture on it
- Make a fist and move your hand to draw on the canvas
- Click "Clear Canvas" to erase drawings

#### Creating Notes
- Click "New Note" button (or pinch gesture on it)
- A yellow sticky note appears
- Type text using your keyboard
- Drag notes by clicking and holding the note header

#### Voice Notes
- Each note has a voice recorder
- Click "Record Voice Note" to start recording
- Click "Stop Recording" when done
- Play back using the audio player
- Download voice notes using the Download button

## Project Structure

```
src/
├── components/
│   ├── VideoFeed.tsx           # Webcam stream component
│   ├── GestureCursorLayer.tsx  # Virtual cursor overlay
│   ├── DrawingCanvas.tsx       # Canvas for drawing
│   ├── NoteBoard.tsx           # Manages all notes
│   ├── NoteCard.tsx            # Individual sticky note
│   └── VoiceNoteRecorder.tsx   # Audio recording component
├── hooks/
│   └── useHandTracking.ts      # Hand detection hook
├── lib/
│   └── gestureDetector.ts      # Gesture recognition logic
├── styles/
│   └── App.css                 # Global styles
├── App.tsx                     # Main app component
└── main.tsx                    # Entry point
```

## Troubleshooting

### Camera not working
- Check browser permissions
- Ensure no other app is using the camera
- Try refreshing the page

### Hand not detected
- Ensure good lighting
- Keep hand within camera frame
- Try moving hand closer/farther from camera

### Gestures not responding
- Make clear, deliberate gestures
- Wait for model to fully load (check status indicator)
- Ensure only one hand is visible

### Voice recording not working
- Allow microphone permissions
- Check system audio settings
- Try using a different browser (Chrome/Edge recommended)

## Browser Compatibility

Best performance on:
- Chrome 90+
- Edge 90+
- Firefox 88+

## Performance Tips

- Close other tabs to free up resources
- Ensure good lighting for better hand detection
- Use a modern browser with WebGL support

## Build for Production

```bash
npm run build
```

Output will be in the `dist/` folder.

## License

MIT
