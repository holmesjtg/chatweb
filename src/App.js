import React, { useState } from 'react';
import styled from 'styled-components';
import ConvaiChat from './components/ConvaiChat';
import ConfigPanel from './components/ConfigPanel';

const AppContainer = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
`;

const Header = styled.header`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
`;

const Title = styled.h1`
  color: white;
  font-size: 1.5rem;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
  font-size: 0.9rem;
`;

const StatusDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.$connected ? '#4ade80' : '#ef4444'};
  animation: ${props => props.$connected ? 'none' : 'pulse 2s infinite'};
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  overflow: hidden;
`;

function App() {
  const [config, setConfig] = useState({
    apiKey: '',
    characterId: '',
    avatarUrl: ''
  });
  const [isConfigured, setIsConfigured] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const handleConfigSave = (newConfig) => {
    setConfig(newConfig);
    setIsConfigured(true);
  };

  if (!isConfigured) {
    return (
      <AppContainer>
        <Header>
          <Title>Convai Chat Demo</Title>
        </Header>
        <ConfigPanel onSave={handleConfigSave} />
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      <Header>
        <Title>Convai Chat Demo</Title>
        <StatusIndicator>
          <StatusDot $connected={isConnected} />
          {isConnected ? 'Connected' : 'Disconnected'}
        </StatusIndicator>
      </Header>
      <MainContent>
        <ConvaiChat 
          config={config}
          onConnectionChange={setIsConnected}
        />
      </MainContent>
    </AppContainer>
  );
}

export default App; 