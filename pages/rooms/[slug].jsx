import Head from 'next/head'
import { Box, Button, Center, HStack, IconButton, Input, Text, VStack, useColorModeValue, useToast } from '@chakra-ui/react'
import { useRouter } from 'next/router'
import { CopyIcon, LockIcon, SendIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import io from 'socket.io-client'
import { addRoom, retrieveRooms } from '@/lib/firebaseOperations'

let socket;

const isRoomExistent = async roomUid => {
  if (await retrieveRooms() === null) {
    return false 
  }
  
  const retrievedAgain = await retrieveRooms()
  let exists = false

  Object.keys(retrievedAgain).map(key => {
    if (retrievedAgain[key].uid === roomUid) {
      exists = true
      return
    }
  })

  if (exists) {
    return true
  }

  return false
}

export default () => {
  const router = useRouter()
  const uid = router.query.slug
  const [UIDToShow, setUIDToShow] = useState('Unavailable')
  const date = new Date()

  useEffect(() => {
    const checkRoomExistence = async roomUid => {
      if (await isRoomExistent(roomUid)) {
        setUIDToShow(roomUid)
      } else {
        const newRoomUid = Math.random().toString(16).slice(2)
        await addRoom(newRoomUid)
        setUIDToShow(newRoomUid)
        router.push(`/rooms/${newRoomUid}`)
      }
    }

    checkRoomExistence(uid)
  }, [])

  const [messages, setMessages] = useState([])

  const [username, setUsername] = useState('')

  const toast = useToast()

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
            const messageInput = document.getElementById('message-input')
            const username = data.payload.username

            setUsername(username)
            const keyDownHandler = ({ key }) => {
              if (key === 'Enter') {
                if (messageInput.value === '') {
                  toast({
                    title: 'Error',
                    description: 'The message typed in the input is empty.',
                    status: 'error',
                    duration: 9000,
                    isClosable: true
                  })
                  return
                }

                socket.emit('sendMessage', { uid, message: document.getElementById('message-input').value, username })
                messageInput.value = ''
              }
            }

            messageInput.addEventListener('keyup', keyDownHandler)
          })
      })
  }, [])

  useEffect(() => {
    const socketInitializer = async () => {
      await fetch('/api/socket')

      socket = io(undefined, {
        path: '/api/socket'
      })

      socket.emit('createRoom', uid)

      socket.on('messageReceived', data => {
        setMessages(prevMessages => [...prevMessages, [data.message, data.username, `${date.getHours()}:${date.getMinutes()}`]])
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

      <Center>
        <Button position="fixed" top="3.5rem" backdropFilter="auto" backdropBlur="12px" onClick={() => {
          socket.emit('leaveRoom', uid)
          router.push('/')
        }}>Leave</Button>
      </Center>

      <Center mt="7rem">
        <VStack>
          <Text background={useColorModeValue('black', 'white')} color={useColorModeValue('white', 'black')} px="0.5rem" fontSize="xl" rounded="md">The room ID is unique</Text>
          <HStack>
            <LockIcon />
            <Text color={useColorModeValue('gray.800', 'whiteAlpha.900')} fontSize="xl">{UIDToShow}</Text>
            <IconButton variant="unstyled" icon={<CopyIcon />} onClick={() => {
              navigator.clipboard.writeText(uid)
              toast({
                title: 'Copied',
                description: 'The unique ID has been copied to the clipboard.',
                status: 'success',
                duration: 9000,
                isClosable: true
              })
            }} />
          </HStack>
        </VStack>
      </Center>

      <Center>
        <VStack mt="2rem" alignItems="start" width="100%" pb="3rem" maxWidth="300px">
          {messages.map((element, index) => {
            return (
              <Box
                key={index}
                wordBreak="break-word"
                textAlign="left"
                alignSelf="flex-start"
              >
                <HStack alignItems="top">
                  <Text color="gray">{element[2]}</Text>
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
            const messageInput = document.getElementById('message-input')
            if (messageInput.value === '') {
              toast({
                title: 'Error',
                description: 'The message typed in the input is empty.',
                status: 'error',
                duration: 9000,
                isClosable: true
              })
              return
            }
            socket.emit('sendMessage', { uid, message: messageInput.value, username })

            messageInput.value = ''
          }} />
        </HStack>
      </Center>
    </>
  )
}
