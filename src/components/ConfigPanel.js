import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const ConfigContainer = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`;

const ConfigCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 2rem;
  max-width: 500px;
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
`;

const ConfigTitle = styled.h2`
  color: white;
  font-size: 1.5rem;
  margin-bottom: 1rem;
  text-align: center;
`;

const ConfigDescription = styled.p`
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  margin-bottom: 2rem;
  text-align: center;
  line-height: 1.5;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  color: white;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 0.9rem;
  transition: all 0.3s ease;

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  &:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.6);
    background: rgba(255, 255, 255, 0.15);
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const HelpText = styled.small`
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.8rem;
  display: block;
  margin-top: 0.25rem;
`;

const EnvNote = styled.div`
  background: rgba(102, 126, 234, 0.1);
  border: 1px solid rgba(102, 126, 234, 0.3);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.8rem;
  line-height: 1.4;
`;

function ConfigPanel({ onSave }) {
  const [config, setConfig] = useState({
    apiKey: '',
    characterId: ''
  });

  useEffect(() => {
    // Try to load from environment variables (if available)
    const envConfig = {
      apiKey: process.env.REACT_APP_CONVAI_API_KEY || '',
      characterId: process.env.REACT_APP_CONVAI_CHARACTER_ID || ''
    };
    
    // Only update if environment variables are actually set
    if (envConfig.apiKey || envConfig.characterId) {
      setConfig(envConfig);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (config.apiKey && config.characterId) {
      onSave({ ...config, avatarUrl: './assets/avatar.glb' });
    }
  };

  const handleChange = (field) => (e) => {
    setConfig(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const isValid = config.apiKey && config.characterId;
  const hasEnvVars = process.env.REACT_APP_CONVAI_API_KEY || process.env.REACT_APP_CONVAI_CHARACTER_ID;

  return (
    <ConfigContainer>
      <ConfigCard>
        <ConfigTitle>Configure Convai Settings</ConfigTitle>
        <ConfigDescription>
          Enter your Convai API key and character ID to start chatting with your AI character.
        </ConfigDescription>

        {!hasEnvVars && (
          <EnvNote>
            💡 <strong>Tip:</strong> For security, you can create a <code>.env</code> file in your project root with:
            <br />
            <code>REACT_APP_CONVAI_API_KEY=your_key_here</code>
            <br />
            <code>REACT_APP_CONVAI_CHARACTER_ID=your_id_here</code>
          </EnvNote>
        )}
        
        <form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>Convai API Key *</Label>
            <Input
              type="password"
              placeholder="Enter your Convai API key"
              value={config.apiKey}
              onChange={handleChange('apiKey')}
              required
            />
            <HelpText>Get your API key from the Convai dashboard</HelpText>
          </FormGroup>

          <FormGroup>
            <Label>Character ID *</Label>
            <Input
              type="text"
              placeholder="Enter your character ID"
              value={config.characterId}
              onChange={handleChange('characterId')}
              required
            />
            <HelpText>The ID of the character you want to chat with</HelpText>
          </FormGroup>

          <Button type="submit" disabled={!isValid}>
            Start Chatting
          </Button>
        </form>
      </ConfigCard>
    </ConfigContainer>
  );
}

export default ConfigPanel; 