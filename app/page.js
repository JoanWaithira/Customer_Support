'use client'
import { Box, Stack, TextField, Button } from "@mui/material";
import { useState, useEffect } from "react";

export default function Home() {
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: `Hi I'm the Headstarter Support Agent, how can I assist you today?`
  }]);

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!message.trim()) return; // Prevent sending empty messages

    // Add the user's message to the chat
    setMessages((messages) => [
      ...messages,
      { role: "user", content: message },
      { role: "assistant", content: '' }
    ]);

    setMessage('');
    setLoading(true);

    try {
      const response = await fetch('app/api/chat', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([...messages, { role: 'user', content: message }])
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let result = '';

      reader.read().then(function processText({ done, value }) {
        if (done) {
          return result;
        }
        
        const text = decoder.decode(value || new Uint8Array(), { stream: true });
        
        setMessages((messages) => {
          const lastMessage = messages[messages.length - 1];
          const otherMessages = messages.slice(0, messages.length - 1);

          return [
            ...otherMessages,
            {
              ...lastMessage,
              content: lastMessage.content + text,
            },
          ];
        });

        return reader.read().then(processText);
      }).finally(() => {
        setLoading(false);
      });
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((messages) => [
        ...messages,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }
      ]);
      setLoading(false);
    }
  };

  return (
    <Box 
      width="100vw" 
      height="100vh" 
      display="flex" 
      flexDirection="column" 
      justifyContent="center" 
      alignItems="center"
    >
      <Stack
        direction="column"
        width="600px"
        height="700px"
        border="1px solid black"
        p={2}
        spacing={2}
      >
        <Stack 
          direction="column"
          spacing={2}
          flexGrow={1}
          overflow="auto"
          maxHeight="100%"
        >
          {messages.map((message, index) => (
            <Box 
              key={index}
              display="flex"
              justifyContent={
                message.role === 'assistant' ? 'flex-start' : 'flex-end'
              }
            >
              <Box
                bgcolor={
                  message.role === 'assistant' ? 'primary.main' : 'secondary.main'
                }
                color="white"
                borderRadius={16}
                p={2}
              >
                {message.content}
              </Box>
            </Box>
          ))}
          {loading && (
            <Box display="flex" justifyContent="center">
              {/* <CircularProgress size={24} /> */}
            </Box>
          )}
        </Stack>
        <Stack direction="row" spacing={2}>
          <TextField
            label="Message"
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') sendMessage();
            }}
          />
          <Button variant="contained" onClick={sendMessage}>Send</Button>
        </Stack>
      </Stack>
    </Box>
  );
}
