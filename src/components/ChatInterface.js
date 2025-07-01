import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.5);
  }
`;

const Message = styled.div`
  display: flex;
  flex-direction: column;
  align-items: ${props => props.type === 'user' ? 'flex-end' : 'flex-start'};
  animation: slideIn 0.3s ease-out;
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const MessageBubble = styled.div`
  max-width: 80%;
  padding: 0.75rem 1rem;
  border-radius: 18px;
  margin-bottom: 0.25rem;
  position: relative;
  word-wrap: break-word;
  
  background: ${props => props.type === 'user' ? 
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 
    'rgba(255, 255, 255, 0.1)'};
  
  color: white;
  border: 1px solid ${props => props.type === 'user' ? 
    'rgba(255, 255, 255, 0.2)' : 
    'rgba(255, 255, 255, 0.1)'};
  
  backdrop-filter: blur(10px);
  
  ${props => props.type === 'user' ? `
    border-bottom-right-radius: 6px;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  ` : `
    border-bottom-left-radius: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  `}
`;

const MessageTime = styled.span`
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.6);
  margin: ${props => props.type === 'user' ? '0 0.5rem 0 0' : '0 0 0 0.5rem'};
`;

const ControlsContainer = styled.div`
  padding: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
`;

const MicrophoneButton = styled.button`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: none;
  background: ${props => 
    !props.$isReady ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)' :
    props.$isListening ? 
    'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 
    'linear-gradient(135deg, #10b981 0%, #059669 100%)'};
  color: white;
  font-size: 2rem;
  cursor: ${props => props.$isReady ? 'pointer' : 'not-allowed'};
  opacity: ${props => props.$isReady ? 1 : 0.6};
  transition: all 0.3s ease;
  margin: 0 auto 1rem;
  display: block;
  position: relative;
  overflow: hidden;
  
  &:hover {
    transform: ${props => props.$isReady ? 'scale(1.05)' : 'none'};
    box-shadow: ${props => props.$isReady ? '0 8px 25px rgba(0, 0, 0, 0.3)' : 'none'};
  }
  
  &:active {
    transform: ${props => props.$isReady ? 'scale(0.95)' : 'none'};
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${props => props.$isListening ? 
      'radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%)' : 
      'none'};
    animation: ${props => props.$isListening ? 'pulse 1.5s ease-in-out infinite' : 'none'};
  }
  
  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
      opacity: 0.7;
    }
    50% {
      transform: scale(1.2);
      opacity: 1;
    }
  }
`;

const TextInputContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const TextInput = styled.input`
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 25px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 0.9rem;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  &:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.6);
    background: rgba(255, 255, 255, 0.15);
  }
`;

const SendButton = styled.button`
  width: 45px;
  height: 45px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.05);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const ControlsLabel = styled.div`
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
`;

const StatusBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  gap: 0.5rem;
`;

const StatusIcon = styled.span`
  font-size: 1rem;
  animation: ${props => props.$animated ? 'bounce 2s infinite' : 'none'};
  
  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% {
      transform: translateY(0);
    }
    40% {
      transform: translateY(-5px);
    }
    60% {
      transform: translateY(-3px);
    }
  }
`;

function ChatInterface({ 
  messages, 
  isListening, 
  isReady,
  onStartListening, 
  onStopListening, 
  onSendText, 
  characterState 
}) {
  const [textInput, setTextInput] = useState('');
  const messagesEndRef = useRef(null);
  const textInputRef = useRef(null);
  const [isKeyPressed, setIsKeyPressed] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only respond to T key if text input is not focused and key isn't already pressed and system is ready
      if (e.key.toLowerCase() === 't' && 
          document.activeElement !== textInputRef.current && 
          !isKeyPressed && 
          !isListening &&
          isReady) {
        e.preventDefault();
        setIsKeyPressed(true);
        onStartListening();
      }
    };

    const handleKeyUp = (e) => {
      // Stop listening when T key is released - also check if we're actually listening
      if (e.key.toLowerCase() === 't' && isKeyPressed && isListening && isReady) {
        e.preventDefault();
        setIsKeyPressed(false);
        onStopListening();
      } else if (e.key.toLowerCase() === 't' && isKeyPressed) {
        // Reset key state even if conditions aren't met
        setIsKeyPressed(false);
      }
    };

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [isKeyPressed, isListening, isReady, onStartListening, onStopListening]);

  const handleMicClick = () => {
    if (!isReady) {
      console.log('System not ready yet');
      return;
    }
    
    if (isListening) {
      onStopListening();
    } else {
      onStartListening();
    }
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (textInput.trim()) {
      onSendText(textInput.trim());
      setTextInput('');
      textInputRef.current?.focus();
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusMessage = () => {
    if (!isReady) {
      return 'Initializing... Please wait';
    }
    if (isListening) {
      return isKeyPressed ? 'Listening for your voice... (T key)' : 'Listening for your voice...';
    }
    if (characterState.isPlaying) {
      return 'Character is speaking...';
    }
    return 'Ready to chat (Press T to talk)';
  };

  const getStatusIcon = () => {
    if (!isReady) {
      return '⏳';
    }
    if (isListening) {
      return '🎤';
    }
    if (characterState.isPlaying) {
      return '🗣️';
    }
    return '💬';
  };

  return (
    <ChatContainer>
      <StatusBar>
        <StatusIcon $animated={isListening || characterState.isPlaying}>
          {getStatusIcon()}
        </StatusIcon>
        {getStatusMessage()}
      </StatusBar>
      
      <MessagesContainer>
        {messages.map((message) => (
          <Message key={message.id} type={message.type}>
            <MessageBubble type={message.type}>
              {message.text}
            </MessageBubble>
            <MessageTime type={message.type}>
              {formatTime(message.timestamp)}
            </MessageTime>
          </Message>
        ))}
        <div ref={messagesEndRef} />
      </MessagesContainer>
      
      <ControlsContainer>
        <ControlsLabel>
          {!isReady ? 'Initializing... Please wait' : 
           isListening ? 'Release to send' : 'Press and hold to talk (or hold T key)'}
        </ControlsLabel>
        
        <MicrophoneButton
          $isListening={isListening}
          $isReady={isReady}
          onMouseDown={handleMicClick}
          onMouseUp={isListening ? handleMicClick : undefined}
          onTouchStart={handleMicClick}
          onTouchEnd={isListening ? handleMicClick : undefined}
        >
          {isListening ? '🛑' : '🎤'}
        </MicrophoneButton>
        
        <form onSubmit={handleTextSubmit}>
          <TextInputContainer>
            <TextInput
              ref={textInputRef}
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type a message..."
              disabled={isListening}
            />
            <SendButton 
              type="submit" 
              disabled={!textInput.trim() || isListening}
            >
              ➤
            </SendButton>
          </TextInputContainer>
        </form>
      </ControlsContainer>
    </ChatContainer>
  );
}

export default ChatInterface; 