'use client'
import { Box, Stack, TextField, Button, CircularProgress } from "@mui/material";
import { useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: `Hi I'm the Headstarter Support Agent, how can I assist you today?`
  }]);

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!message.trim()) return; 
    
    setMessages((messages) => [
      ...messages,
      { role: "user", content: message },
      { role: "assistant", content: '' }
    ]);

    setMessage('');
    setLoading(true);

    try {
      const response = await fetch(`https://openrouter.ai/api/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer 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`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3.1-8b-instruct:free",
          messages: [
            { role: "user", content: message }
          ]
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      

      

      const jsonResponse = await response.json();

      if (jsonResponse.error) {
        throw new Error(jsonResponse.error.message);
      }

      const assistantMessage = jsonResponse.choices[0].message.content;

      // Update the assistant's last message with the API response
      setMessages((messages) => {
        const lastMessage = messages[messages.length - 1];
        const otherMessages = messages.slice(0, messages.length - 1);

        return [
          ...otherMessages,
          {
            ...lastMessage,
            content: assistantMessage,
          },
        ];
      });

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((messages) => [
        ...messages,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }
      ]);
    } finally {
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
      p={2} 
      bgcolor="white"
    >
      <Stack
        direction="column"
        width={{ xs: '100%', sm: '600px' }} // Responsive width
        height={{ xs: '80vh', sm: '700px' }} // Responsive height
        border="1px solid black"
        p={2}
        spacing={2}
        bgcolor="background.paper"
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
                maxWidth="80%" // Prevent messages from taking up too much space
              >
                {message.content}
              </Box>
            </Box>
          ))}
          {loading && (
            <Box display="flex" justifyContent="center" mt={2}>
              <CircularProgress size={24} />
            </Box>
          )}
        </Stack>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            label="Message"
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') sendMessage();
            }}
            variant="outlined"
            size="large"
          />
          <Button variant="contained" onClick={sendMessage}>Send</Button>
        </Stack>
      </Stack>
    </Box>
  );
}
