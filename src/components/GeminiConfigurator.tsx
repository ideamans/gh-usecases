import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import { ConfigService } from '../services/config.js';
import { InteractionHistory } from '../services/interaction-history.js';

interface GeminiConfiguratorProps {
  onConfigured: () => void;
}

export const GeminiConfigurator: React.FC<GeminiConfiguratorProps> = ({ onConfigured }) => {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasExistingKey, setHasExistingKey] = useState(false);
  
  useEffect(() => {
    const checkExistingKey = async () => {
      try {
        const config = await ConfigService.load();
        setHasExistingKey(!!config?.geminiApiKey);
      } catch (err) {
        // Config not available
      }
    };
    checkExistingKey();
  }, []);

  const handleSubmit = async () => {
    if (!apiKey.trim() && !hasExistingKey) {
      setError('API key is required');
      return;
    }
    
    // If no key entered but there's an existing key, clear it
    if (!apiKey.trim() && hasExistingKey) {
      handleClear();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let config = await ConfigService.load();
      if (!config) {
        setError('Please select an account first before configuring Gemini API');
        setIsLoading(false);
        return;
      }
      config.geminiApiKey = apiKey.trim();
      await ConfigService.save(config);
      
      InteractionHistory.record('action', 'Gemini API Key', 'Configured');
      setSuccess(true);
      
      // Wait a moment to show success message
      setTimeout(() => {
        onConfigured();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let config = await ConfigService.load();
      if (!config) {
        setError('Please select an account first before configuring Gemini API');
        setIsLoading(false);
        return;
      }
      delete config.geminiApiKey;
      await ConfigService.save(config);
      
      InteractionHistory.record('action', 'Gemini API Key', 'Cleared');
      setSuccess(true);
      setApiKey('');
      
      // Wait a moment to show success message
      setTimeout(() => {
        onConfigured();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear configuration');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Box flexDirection="column">
        <Text color="green">✓ Gemini API key configuration saved successfully!</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold>Configure Gemini API Key</Text>
      </Box>
      
      <Box marginBottom={1}>
        <Text dimColor>Get your API key from: https://aistudio.google.com/apikey</Text>
      </Box>
      
      {hasExistingKey && (
        <Box marginBottom={1}>
          <Text color="green">✓ API key is currently configured</Text>
        </Box>
      )}

      <Box marginBottom={1}>
        <Text>Enter your Gemini API key{hasExistingKey ? ' (or press Enter to clear existing key)' : ''}:</Text>
      </Box>

      <Box marginBottom={1}>
        <TextInput
          value={apiKey}
          onChange={setApiKey}
          onSubmit={handleSubmit}
          placeholder="your-api-key-here"
          mask="*"
        />
      </Box>

      {error && (
        <Box marginBottom={1}>
          <Text color="red">❌ {error}</Text>
        </Box>
      )}

      <Box marginTop={1}>
        <Text dimColor>
          {apiKey.trim() ? 'Press Enter to save' : (hasExistingKey ? 'Press Enter to clear existing key' : 'Enter API key above')}
        </Text>
      </Box>
      
      <Box marginTop={1}>
        <Text dimColor>Press Ctrl+C to cancel</Text>
      </Box>
    </Box>
  );
};