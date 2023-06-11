import Head from 'next/head'
import { memo, useEffect, useRef, useState } from 'react'
import { Box, Button, Center, HStack, IconButton, Input, Spinner, Text, VStack, useColorModeValue, useToast } from '@chakra-ui/react'
import { useRouter } from 'next/router'
import { CopyIcon, LockIcon, SendIcon } from 'lucide-react'
import io from 'socket.io-client'
import { addRoom, retrieveRooms } from '@/lib/firebaseOperations'

let socket;

const isRoomExistent = async roomUid => {
  const rooms = await retrieveRooms()

  if (rooms === null) {
    return false 
  }

  return Object.values(rooms).some(room => room.uid === roomUid)
}

export default memo(() => {
  const router = useRouter()
  const uid = router.query.slug
  const [UIDToShow, setUIDToShow] = useState('Unavailable')

  const messagesContainerRef = useRef(null)

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

  const scrollMessagesDown = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }

  const [username, setUsername] = useState('')
  const [messageInputValue, setMessageInputValue] = useState('')
  const messageInputValueRef = useRef(null)

  const toast = useToast()

  const [color, setColor] = useState('')

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let usernameForServer;

    const toDo = async () => {
      await fetch('/api/get-token')
      .then(response => response.json())
      .then(async data => {
        const token = data.token
        await fetch('/api/verify-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ token })
        })
        .then(response => response.json())
        .then(async data => {
          usernameForServer = data.payload.username
          setUsernameForLeave(usernameForServer)

          await fetch('/api/socket')

          socket = io(undefined, {
            path: '/api/socket'
          })

          socket.on('connect', () => {
            socket.emit('createRoom', { username: usernameForServer, uid })
          })

          socket.on('messageReceived', data => {
            const date = new Date()
            const time = `${date.getHours().toLocaleString('en-gb', { minimumIntegerDigits: 2, useGrouping: false })}:${date.getMinutes().toLocaleString('en-gb', { minimumIntegerDigits: 2, useGrouping: false })}`

            setMessages(prevMessages => [...prevMessages, [data.message, data.username + ':', time, data.color]])

            scrollMessagesDown()
          })

          socket.on('userConnected', message => {
            setMessages(prevMessages => [...prevMessages, [message, undefined, undefined, undefined]])
            setLoading(false)
          })

          socket.on('userLeft', message => {
            setMessages(prevMessages => [...prevMessages, [message, undefined, undefined, undefined]])
          })

          const messageInput = document.getElementById('message-input')
          const username = data.payload.username

          const color = data.payload.color
          setColor(color)
          setUsername(username)

          const keyDownHandler = ({ key }) => {
            if (key === 'Enter') {
              if (document.getElementById('message-input').value === '') {
                toast({
                  title: 'Error',
                  description: 'The message typed in the input is empty.',
                  status: 'error',
                  duration: 9000,
                  isClosable: true
                })

                return
              }

              const date = new Date()
              const time = `${date.getHours().toLocaleString('en-gb', { minimumIntegerDigits: 2, useGrouping: false })}:${date.getMinutes().toLocaleString('en-gb', { minimumIntegerDigits: 2, useGrouping: false })}`

              setMessages(prevMessages => [...prevMessages, [messageInputValueRef.current.value, username + ':', time, color]])
              scrollMessagesDown()

              socket.emit('sendMessage', { uid, message: messageInputValueRef.current.value, username, color })
              setMessageInputValue('')
            }
          }

          messageInput.addEventListener('keyup', keyDownHandler)
        })
      })
    }

    toDo()
  }, [])

  const [usernameForLeave, setUsernameForLeave] = useState('')

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
          socket.emit('leaveRoom', { username: usernameForLeave, uid })
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

      {loading && (
        <Center mt="3rem">
          <Spinner />
        </Center>
      )}

      <Center>
        <VStack mt="2rem" alignItems="start" width="100%" pb="8rem" maxWidth="300px" ref={messagesContainerRef}>
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
                  <Text color={element[3]}>{element[1]}</Text>
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
          <Input id="message-input" placeholder="Type the message" variant="filled" ref={messageInputValueRef} value={messageInputValue} onChange={event => {
            setMessageInputValue(event.target.value)
          }} />  
          <IconButton icon={<SendIcon />} onClick={() => {
            if (messageInputValue === '') {
              toast({
                title: 'Error',
                description: 'The message typed in the input is empty.',
                status: 'error',
                duration: 9000,
                isClosable: true
              })

              return
            }

            const date = new Date()
            const time = `${date.getHours().toLocaleString('en-gb', { minimumIntegerDigits: 2, useGrouping: false })}:${date.getMinutes().toLocaleString('en-gb', { minimumIntegerDigits: 2, useGrouping: false })}`
            setMessages(prevMessages => [...prevMessages, [messageInputValue, username + ':', time, color]])
            scrollMessagesDown()

            socket.emit('sendMessage', { uid, message: messageInputValue, username, color })

            setMessageInputValue('')
          }} />
        </HStack>
      </Center>
    </>
  )
})
