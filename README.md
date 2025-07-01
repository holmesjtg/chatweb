# Convai Chat Demo

A beautiful React application that integrates with Convai's Web SDK to create interactive conversations with AI characters. Features support for 3D avatars, voice chat, and real-time character animations.

## Features

- 🎙️ **Voice Chat**: Real-time voice conversations with AI characters
- 💬 **Text Chat**: Type messages when voice isn't available
- 🤖 **3D Avatar Support**: Load and display GLB 3D avatars with animations
- 🎭 **Facial Expressions**: Dynamic facial expressions during conversations
- 🎨 **Beautiful UI**: Modern, glassmorphic design with smooth animations
- 📱 **Responsive**: Works on desktop and mobile devices

## Prerequisites

Before you begin, ensure you have:

1. **Node.js** (version 14 or higher)
2. **A Convai account** with API access
3. **Your Convai API Key** (get it from [Convai Dashboard](https://convai.com))
4. **A Character ID** from your Convai character
5. **Optional**: A GLB 3D avatar file hosted online

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm start
   ```

3. **Open your browser** and navigate to `http://localhost:3000`

4. **Configure the app**:
   - Enter your Convai API Key
   - Enter your Character ID
   - Optionally, provide a URL to your GLB avatar file

5. **Start chatting**! Click the microphone button to talk or type messages.

## Getting Your Convai Credentials

### API Key
1. Go to [Convai Dashboard](https://convai.com)
2. Sign in or create an account
3. Navigate to the API section
4. Copy your API key

### Character ID
1. In the Convai Dashboard, go to "Characters"
2. Create a new character or select an existing one
3. Copy the Character ID from the character details

### GLB Avatar (Optional)
- Host your GLB file on a publicly accessible URL
- Ensure the file includes animations named "idle", "talk", or "speak" for best results
- The avatar should be optimized for web viewing

## Project Structure

```
src/
├── components/
│   ├── ConvaiChat.js      # Main chat component with Convai integration
│   ├── Avatar3D.js        # 3D avatar display using Three.js
│   ├── ChatInterface.js   # Chat UI with messages and controls
│   └── ConfigPanel.js     # Configuration form for API keys
├── App.js                 # Main application component
└── index.js              # React entry point
```

## How It Works

1. **Initialization**: The app connects to Convai using your API key and character ID
2. **Voice Input**: Click and hold the microphone button to speak
3. **Processing**: Your voice is sent to Convai for processing
4. **Response**: The character responds with voice, text, and facial expressions
5. **3D Avatar**: If provided, the GLB avatar animates based on character state

## Customization

### Adding New Animations
Edit `src/components/Avatar3D.js` to add support for different animations:

```javascript
// Look for animations by name
const customAnimation = animations.find(clip => 
  clip.name.toLowerCase().includes('your-animation-name')
);
```

### Styling
The app uses styled-components. Modify the styled components in each file to customize the appearance.

### Character Behavior
Modify the character's personality and behavior in the Convai Dashboard, not in the code.

## Troubleshooting

### Microphone Issues
- Ensure your browser has microphone permissions
- Check that your microphone is working in other applications
- Try refreshing the page and granting permissions again

### Connection Issues
- Verify your API key is correct
- Check that your character ID exists
- Ensure you have a stable internet connection

### 3D Avatar Issues
- Make sure your GLB file is publicly accessible
- Verify the file is a valid GLB format
- Check browser console for any loading errors

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

Note: Microphone access requires HTTPS in production.

## Technologies Used

- React 18
- Convai Web SDK
- Three.js & React Three Fiber
- Styled Components
- WebGL for 3D rendering

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues with:
- **This demo app**: Create an issue in this repository
- **Convai API**: Check the [Convai Documentation](https://docs.convai.com)
- **3D Avatars**: Refer to Three.js and GLB format documentation

## License

This project is licensed under the MIT License - see the LICENSE file for details.
