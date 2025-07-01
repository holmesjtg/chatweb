import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { ConvaiClient } from 'convai-web-sdk';
import Avatar3D from './Avatar3D';
import ChatInterface from './ChatInterface';

const ChatContainer = styled.div`
  flex: 1;
  display: flex;
  height: 100%;
`;

const AvatarSection = styled.div`
  flex: 2;
  background: rgba(0, 0, 0, 0.2);
  position: relative;
  border-radius: 16px 0 0 16px;
  overflow: hidden;
`;

const ChatSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 0 16px 16px 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-left: none;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  backdrop-filter: blur(5px);
`;

const LoadingSpinner = styled.div`
  width: 50px;
  height: 50px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.div`
  color: white;
  margin-top: 1rem;
  font-size: 0.9rem;
`;

const ErrorMessage = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem;
  color: #fecaca;
  font-size: 0.9rem;
`;

function ConvaiChat({ config, onConnectionChange }) {
  const [convaiClient, setConvaiClient] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [characterState, setCharacterState] = useState({
    isPlaying: false,
    currentExpression: 'neutral',
    currentAnimation: 'idle'
  });

  const audioRef = useRef(null);
  const chatContainerRef = useRef(null);
  const audioChunksRef = useRef([]);
  const currentResponseIdRef = useRef(null);
  const audioTimeoutRef = useRef(null);
  const isRecordingSessionActiveRef = useRef(false);

  const addMessage = React.useCallback((type, text) => {
    const message = {
      id: Date.now(),
      type,
      text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
  }, []);

  const handleConvaiResponseCallback = React.useCallback((response) => {

    // Handle user query (live transcript)
    if (response.hasUserQuery()) {
      const transcript = response.getUserQuery();
      const isFinal = transcript.getIsFinal();
      if (isFinal) {
        // Update the listening/processing message with final transcript
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage && 
              (lastMessage.text === '🎤 Listening...' || lastMessage.text === '🤔 Processing...')) {
            lastMessage.text = transcript.getTextData();
          }
          return newMessages;
        });
      }
    }

    // Handle audio response
    if (response.hasAudioResponse()) {
      const audioResponse = response.getAudioResponse();
      
      // Handle text data - just call getTextData() directly
      const text = audioResponse.getTextData();
      if (text) {
        addMessage('character', text);
        // Start a new audio response session
        currentResponseIdRef.current = Date.now();
        
        // Clear any previous timeout and audio chunks
        if (audioTimeoutRef.current) {
          clearTimeout(audioTimeoutRef.current);
          audioTimeoutRef.current = null;
        }
        audioChunksRef.current = [];
      }

      // Handle audio data - collect chunks instead of playing immediately
      try {
        let audioData = null;
        if (typeof audioResponse.getAudioData === 'function') {
          audioData = audioResponse.getAudioData();
        } else if (typeof audioResponse.getAudioData_asU8 === 'function') {
          audioData = audioResponse.getAudioData_asU8();
        }
        
        if (audioData && audioData.length > 0) {
          audioChunksRef.current.push(audioData);
          
          // Clear any existing timeout
          if (audioTimeoutRef.current) {
            clearTimeout(audioTimeoutRef.current);
          }
          
          // Set a timeout to play audio if no more chunks arrive
          audioTimeoutRef.current = setTimeout(() => {
            if (audioChunksRef.current.length > 0) {
              playCompleteAudioResponse();
            }
          }, 300); // 300ms delay after the last chunk
        }
      } catch (err) {
        console.log('Audio data not available:', err);
      }

      // Check if this is the end of the audio response
      try {
        const sessionEnd = audioResponse.getSessionEnd && audioResponse.getSessionEnd();
        if (sessionEnd || (audioResponse.getEndOfResponse && audioResponse.getEndOfResponse())) {
          // Clear timeout and play immediately
          if (audioTimeoutRef.current) {
            clearTimeout(audioTimeoutRef.current);
          }
          playCompleteAudioResponse();
        }
      } catch (err) {
        console.log('Could not detect session end, using timeout fallback');
      }

      // Handle facial expressions - following official Convai documentation
      try {
        // Debug: Check what facial methods return
        const visemesData = audioResponse.getVisemesData();
        const hasVisemes = audioResponse.hasVisemesData();
        const blendshapesData = audioResponse.getBlendshapesData();
        const hasBlendshapes = audioResponse.hasBlendshapesData();
        
        console.log('hasVisemesData:', hasVisemes);
        console.log('visemesData:', visemesData);
        console.log('hasBlendshapesData:', hasBlendshapes);
        console.log('blendshapesData:', blendshapesData);
        
        if (audioResponse?.getVisemesData()?.array?.[0]) {
          // Viseme data from Convai SDK
          let faceData = audioResponse.getVisemesData().array[0];
          
          // faceData[0] implies sil value. Which is -2 if new chunk of audio is received.
          if (faceData[0] !== -2) {
            console.log('Applying visemes:', faceData);
            updateCharacterExpression(faceData);
          }
        } else if (audioResponse?.getBlendshapesData()?.array?.[0]) {
          // Try blendshapes as alternative
          let faceData = audioResponse.getBlendshapesData().array[0];
          if (faceData[0] !== -2) {
            console.log('Applying blendshapes:', faceData);
            updateCharacterExpression(faceData);
          }
        }
      } catch (err) {
        console.log('Visemes data not available:', err);
      }
    }
  }, [addMessage]);

  useEffect(() => {
    const initializeConvai = async () => {
      try {
        setIsInitializing(true);
        setError(null);

        // Initialize Convai client
        const client = new ConvaiClient({
          apiKey: config.apiKey,
          characterId: config.characterId,
          enableAudio: true,
          enableFacialData: true,
          faceModel: 3 // OVR lipsync - required for visemes
        });

        // Set up response callback
        client.setResponseCallback(handleConvaiResponseCallback);

        // Set up audio callbacks
        client.onAudioPlay(() => {
          setCharacterState(prev => ({ ...prev, isPlaying: true }));
        });

        client.onAudioStop(() => {
          setCharacterState(prev => ({ ...prev, isPlaying: false }));
        });

        setConvaiClient(client);
        onConnectionChange(true);
        setIsInitializing(false);
        
        // Give more time to ensure client is fully ready and test if it can start/stop
        setTimeout(async () => {
          try {
            // Test if client is ready by attempting a quick start/stop cycle
            await new Promise(resolve => setTimeout(resolve, 500));
            setIsReady(true);
          } catch (err) {
            console.error('Client readiness test failed:', err);
            setTimeout(() => setIsReady(true), 1000); // Fallback after additional delay
          }
        }, 2000);

        // Add welcome message
        setMessages([{
          id: Date.now(),
          type: 'character',
          text: 'Hello! I\'m ready to chat with you. Click the microphone button to start talking!',
          timestamp: new Date()
        }]);

      } catch (err) {
        console.error('Failed to initialize Convai:', err);
        setError(`Failed to initialize: ${err.message}`);
        setIsInitializing(false);
        onConnectionChange(false);
      }
    };

    initializeConvai();
    
    return () => {
      if (convaiClient) {
        // Clean up if needed
        setConvaiClient(null);
      }
      
      // Clear audio timeout
      if (audioTimeoutRef.current) {
        clearTimeout(audioTimeoutRef.current);
      }
      
      // Reset recording session state
      isRecordingSessionActiveRef.current = false;
      setIsReady(false);
    };
  }, [config.apiKey, config.characterId, handleConvaiResponseCallback, onConnectionChange]); // eslint-disable-line react-hooks/exhaustive-deps

  function playCompleteAudioResponse() {
    if (audioChunksRef.current.length === 0) {
      console.log('No audio chunks to play');
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    try {
      // Concatenate all audio chunks into a single Uint8Array
      const totalLength = audioChunksRef.current.reduce((sum, chunk) => sum + chunk.length, 0);
      const combinedAudio = new Uint8Array(totalLength);
      
      let offset = 0;
      for (const chunk of audioChunksRef.current) {
        combinedAudio.set(chunk, offset);
        offset += chunk.length;
      }

      // Create blob and play
      const audioBlob = new Blob([combinedAudio], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      audioRef.current.src = audioUrl;
      audioRef.current.play().catch(err => {
        console.error('Error playing audio:', err);
      });

      audioRef.current.onended = () => {
        URL.revokeObjectURL(audioUrl);
        // Clear chunks after playing
        audioChunksRef.current = [];
      };



    } catch (err) {
      console.error('Error processing audio chunks:', err);
      audioChunksRef.current = [];
    }
  }

  function updateCharacterExpression(faceData) {
    // Pass visemes data to avatar for morph target application
    setCharacterState(prev => ({
      ...prev,
      visemesData: faceData
    }));
  }

  const startListening = async () => {
    if (!convaiClient || !isReady || isRecordingSessionActiveRef.current) {
      console.log('Client not ready yet or recording already active');
      return;
    }

    try {
      setIsListening(true);
      addMessage('user', '🎤 Listening...');
      convaiClient.startAudioChunk();
      isRecordingSessionActiveRef.current = true;
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to start recording. Please check microphone permissions.');
      setIsListening(false);
      isRecordingSessionActiveRef.current = false;
    }
  };

  const stopListening = async () => {
    if (!convaiClient || !isReady || !isRecordingSessionActiveRef.current) {
      console.log('Client not ready or no active recording session');
      return;
    }

    try {
      setIsListening(false);
      convaiClient.endAudioChunk();
      isRecordingSessionActiveRef.current = false;
      
      // Update the last message to show processing
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage && lastMessage.text === '🎤 Listening...') {
          lastMessage.text = '🤔 Processing...';
        }
        return newMessages;
      });
    } catch (err) {
      console.error('Error stopping recording:', err);
      setError('Failed to process recording.');
      isRecordingSessionActiveRef.current = false;
    }
  };

  const sendTextMessage = async (text) => {
    if (!convaiClient || !text.trim()) return;

    try {
      addMessage('user', text);
      convaiClient.sendTextChunk(text);
    } catch (err) {
      console.error('Error sending text message:', err);
      setError('Failed to send message.');
    }
  };

  if (isInitializing) {
    return (
      <ChatContainer ref={chatContainerRef}>
        <LoadingOverlay>
          <div style={{ textAlign: 'center' }}>
            <LoadingSpinner />
            <LoadingText>Connecting to Convai...</LoadingText>
          </div>
        </LoadingOverlay>
      </ChatContainer>
    );
  }

  if (error) {
    return (
      <ChatContainer ref={chatContainerRef}>
        <ErrorMessage>
          <strong>Error:</strong> {error}
          <br />
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '0.5rem',
              padding: '0.5rem 1rem',
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              borderRadius: '4px',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </ErrorMessage>
      </ChatContainer>
    );
  }

  return (
    <ChatContainer ref={chatContainerRef}>
      <AvatarSection>
        <Avatar3D
          avatarUrl={config.avatarUrl}
          characterState={characterState}
        />
      </AvatarSection>
      <ChatSection>
        <ChatInterface
          messages={messages}
          isListening={isListening}
          isReady={isReady}
          onStartListening={startListening}
          onStopListening={stopListening}
          onSendText={sendTextMessage}
          characterState={characterState}
        />
      </ChatSection>
    </ChatContainer>
  );
}

export default ConvaiChat; 