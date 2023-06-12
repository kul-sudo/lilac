import Head from 'next/head'
import { memo, useEffect, useRef, useState } from 'react'
import { Image as ChakraImage, Popover, PopoverTrigger, PopoverContent, PopoverArrow, PopoverCloseButton, PopoverBody, PopoverHeader, Box, Button, Center, HStack, IconButton, Input, Spinner, Text, VStack, AlertDialog, AlertDialogOverlay, AlertDialogContent, AlertDialogBody, AlertDialogCloseButton, useColorModeValue, useToast, useDisclosure } from '@chakra-ui/react'
import { useRouter } from 'next/router'
import { CopyIcon, Image as ImageIcon, LockIcon, SendIcon } from 'lucide-react'
import { addRoom, retrieveRooms } from '@/lib/firebaseOperations'
import { For, block } from 'million/react'
import io from 'socket.io-client'

let socket;

const isRoomExistent = async roomUid => {
  const rooms = await retrieveRooms()

  if (rooms === null) {
    return false 
  }

  return Object.values(rooms).some(room => room.uid === roomUid)
}

const isImage = async url => {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    if (!response.ok) {
      return false
    }

    const imgElement = new Image()
    await new Promise((resolve, reject) => {
      imgElement.onload = function() {
        resolve()
      }
      imgElement.onerror = function() {
        reject()
      }
      imgElement.src = url
    })

    return imgElement.height > 0
  } catch (error) {
    return false
  }
}

const ColumnBlock = block(
  ({ element, index, setAlertDialogImage, onOpen }) => {
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
        {element[4] !== '' && (
          <ChakraImage
            rounded="0.2rem"
            width="40%"
            onClick={() => {
              setAlertDialogImage(element[4])
              onOpen()
            }}
            src={element[4]}
          />
        )}
      </Box>
    )
  }
)

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
  const loadingRef = useRef(loading)

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

            setMessages(prevMessages => [...prevMessages, [data.message, data.username + ':', time, data.color, data.image]])

            scrollMessagesDown()
          })

          socket.on('userConnected', message => {
            setMessages(prevMessages => [...prevMessages, [message, undefined, undefined, undefined, undefined]])
            loadingRef.current = false
          })

          socket.on('userLeft', message => {
            setMessages(prevMessages => [...prevMessages, [message, undefined, undefined, undefined, undefined]])
          })

          const messageInput = document.getElementById('message-input')
          const username = data.payload.username

          const color = data.payload.color
          setColor(color)
          setUsername(username)

          const keyDownHandler = async ({ key }) => {
            if (key === 'Enter') {
              if (loadingRef.current) {
                return
              }

              if (document.getElementById('message-input').value === '' && imageUrlInputRef.current.value === '') {
                toast({
                  title: 'Error',
                  description: 'The message typed in the input is empty.',
                  status: 'error',
                  duration: 9000,
                  isClosable: true
                })

                return
              }

              if (imageUrlInputRef.current.value !== '' && !(await isImage(imageUrlInputRef.current.value)) && imageUrlInputRef.current.value !== '') {
                toast({
                  title: 'Error',
                  description: 'The image URL is incorrect.',
                  status: 'error',
                  duration: 9000,
                  isClosable: true
                })

                return
              }

              const date = new Date()
              const time = `${date.getHours().toLocaleString('en-gb', { minimumIntegerDigits: 2, useGrouping: false })}:${date.getMinutes().toLocaleString('en-gb', { minimumIntegerDigits: 2, useGrouping: false })}`

              setMessages(prevMessages => [...prevMessages, [messageInputValueRef.current.value, username + ':', time, color, imageUrlInputRef.current.value]])
              scrollMessagesDown()

              socket.emit('sendMessage', { uid, message: messageInputValueRef.current.value, username, color, image: imageUrlInputRef.current.value })
              
              setMessageInputValue('')

              imageUrlInputRef.current.value = ''
            }
          }

          messageInput.addEventListener('keyup', keyDownHandler)
        })
      })
    }

    toDo()
  }, [])

  const [usernameForLeave, setUsernameForLeave] = useState('')
  const imageUrlInputRef = useRef(null)

  const { isOpen, onOpen, onClose } = useDisclosure()
  const cancelRef = useRef()
  const [alertDialogImage, setAlertDialogImage] = useState('')

  return (
    <>
      <Head>
        <title>lilac</title>
        <meta name="description" content="Chat privately." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <AlertDialog
        leastDestructiveRef={cancelRef}
        onClose={onClose}
        isOpen={isOpen}
        isCentered
      >
        <AlertDialogOverlay />

        <AlertDialogContent>
          <AlertDialogCloseButton />
            <ChakraImage
              src={alertDialogImage}
            />
        </AlertDialogContent>
      </AlertDialog>

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

      {loadingRef.current && (
        <Center mt="3rem">
          <Spinner />
        </Center>
      )}

      <Center>
        <VStack mt="2rem" alignItems="start" width="100%" pb="8rem" maxWidth="300px" ref={messagesContainerRef}>
          <For each={messages}>
            {( element, index ) => {
              return (
                <ColumnBlock element={element} index={index} setAlertDialogImage={setAlertDialogImage} onOpen={onOpen} />
              )
            }}
          </For>
        </VStack>
      </Center>
      
      <Center>
        <HStack position="fixed" bottom="5" backdropFilter="auto" backdropBlur="12px">
          <Popover>
            <PopoverTrigger>
              <IconButton icon={<ImageIcon />} onClick={() => {}} />
            </PopoverTrigger>
            <PopoverContent>
              <PopoverArrow />
              <PopoverCloseButton />
              <PopoverHeader>What's the image URL?</PopoverHeader>
              <PopoverBody>
                <Input ref={imageUrlInputRef} placeholder="URL" onChange={event => {
                  imageUrlInputRef.current.value = event.target.value
                }} />
              </PopoverBody>
            </PopoverContent>
          </Popover>

          <Input id="message-input" placeholder="Type the message" variant="filled" ref={messageInputValueRef} value={messageInputValue} onChange={event => {
            setMessageInputValue(event.target.value)
          }} />  
          <IconButton icon={<SendIcon />} onClick={async () => {
            if (loadingRef.current) {
              return
            }

            if (messageInputValue === '' && imageUrlInputRef.current.value === '') {
              toast({
                title: 'Error',
                description: 'The message typed in the input is empty.',
                status: 'error',
                duration: 9000,
                isClosable: true
              })

              return
            }

            if (imageUrlInputRef.current.value !== '' && !(await isImage(imageUrlInputRef.current.value)) && imageUrlInputRef.current.value !== '') {
              toast({
                title: 'Error',
                description: 'The image URL is incorrect.',
                status: 'error',
                duration: 9000,
                isClosable: true
              })

              return
            }

            const date = new Date()
            const time = `${date.getHours().toLocaleString('en-gb', { minimumIntegerDigits: 2, useGrouping: false })}:${date.getMinutes().toLocaleString('en-gb', { minimumIntegerDigits: 2, useGrouping: false })}`
            setMessages(prevMessages => [...prevMessages, [messageInputValue, username + ':', time, color, imageUrlInputRef.current.value]])
            scrollMessagesDown()

            socket.emit('sendMessage', { uid, message: messageInputValue, username, color, image: imageUrlInputRef.current.value })

            setMessageInputValue('')
            
            imageUrlInputRef.current.value = ''
          }} />
        </HStack>
      </Center>
    </>
  )
})
