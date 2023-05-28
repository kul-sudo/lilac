import Head from 'next/head'
import { Box, Button, Center, HStack, IconButton, Input, Text, VStack, useColorModeValue } from '@chakra-ui/react'
import { useRouter } from 'next/router'
import { CopyIcon, LockIcon, SendIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import io from 'socket.io-client'

let socket;

export default () => {
  const router = useRouter()
  const uid = router.query.slug
  const [messages, setMessages] = useState([])

  const [username, setUsername] = useState('')

  useEffect(() => {
    fetch('/api/get-token')
      .then(response => response.json())
      .then(data => {
        const token = data.token
        fetch('/api/verify-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ token })
        })
          .then(response => response.json())
          .then(data => {
            const username = data.payload.username
            setUsername(username)
            const keyDownHandler = ({ key }) => {
              if (key === 'Enter') {
                socket.emit('sendMessage', { uid, message: document.getElementById('message-input').value, username })
              }
            }

            const messageInput = document.getElementById('message-input')
            messageInput.addEventListener('keyup', keyDownHandler)
          })
      })

    return () => {
      messageInput.removeEventListener('keyup', keyDownHandler)
    }
  }, [])

  useEffect(() => {
    const socketInitializer = async () => {
      await fetch('/api/socket')

      socket = io(undefined, {
        path: '/api/socket'
      })

      socket.emit('createRoom', uid)

      socket.on('messageReceived', data => {
        setMessages(prevMessages => [...prevMessages, [data.message, data.username]])
      })
    }

    socketInitializer()

    return () => {
      if (socket) {
        socket.emit('leaveRoom', uid)
        socket.disconnect()
      }
    }
  }, [])

  return (
    <>
      <Head>
        <title>lilac</title>
        <meta name="description" content="Chat privately." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Button position="fixed" top="5" left="5" onClick={() => {
        socket.emit('leaveRoom', uid)
        router.push('/')
      }}>Leave</Button>

      <Center mt="1rem">
        <VStack>
          <Text background={useColorModeValue('black', 'white')} color={useColorModeValue('white', 'black')} px="0.5rem" fontSize="xl" rounded="md">The room ID is unique</Text>
          <HStack>
            <LockIcon />
            <Text color={useColorModeValue('gray.800', 'whiteAlpha.900')} fontSize="xl">{uid}</Text>
            <IconButton variant="unstyled" icon={<CopyIcon />} onClick={() => {
              navigator.clipboard.writeText(uid)
            }} />
          </HStack>
        </VStack>
      </Center>

      <Center>
        <VStack mt="2rem" alignItems="left">
          {messages.map((element, index) => {
            return (
              <Box
                key={index}
                maxWidth="300px"
                wordBreak="break-word"
              >
                <HStack alignItems="top">
                  <Text color="red">{element[1]}:</Text>
                  <Box flex="1" wordBreak="break-word">
                    <Text>{element[0]}</Text>
                  </Box>
                </HStack>
              </Box>
            )
          })}
        </VStack>
      </Center>

      <Center>
        <HStack position="fixed" bottom="5" backdropFilter="auto" backdropBlur="12px">
          <Input id="message-input" placeholder="Type the message" variant="filled" />  
          <IconButton icon={<SendIcon />} onClick={() => {
            socket.emit('sendMessage', { uid, message: document.getElementById('message-input').value, username })
          }} />
        </HStack>
      </Center>
    </>
  )
}
