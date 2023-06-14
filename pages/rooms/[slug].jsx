import Head from 'next/head'
import { memo, useEffect, useRef, useState } from 'react'
import { Image as ChakraImage, Popover, PopoverTrigger, PopoverContent, PopoverArrow, PopoverCloseButton, PopoverBody, PopoverHeader, Box, Button, Center, HStack, IconButton, Input, Spinner, Text, VStack, AlertDialog, AlertDialogOverlay, AlertDialogContent, AlertDialogCloseButton, FormControl, useColorModeValue, useToast, useDisclosure } from '@chakra-ui/react'
import { useRouter } from 'next/router'
import { CopyIcon, Image as ImageIcon, LockIcon, SendIcon, UploadIcon, XIcon } from 'lucide-react'
import { addRoom } from '@/lib/firebaseOperations'
import { isRoomExistent } from '@/lib/isRoomExistent'
import { For, block } from 'million/react'
import io from 'socket.io-client'

let socket;

const ColumnBlock = block(
  ({ element, index, setAlertDialogImage, onOpen }) => {
    console.log(element)
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
  const messageInputValueStateRef = useRef(messageInputValue)
  const messageInputValueRef = useRef(null)

  const toast = useToast()

  const [color, setColor] = useState('')

  const [loading, setLoading] = useState(true)
  const loadingRef = useRef(loading)

  const [base64Image, setBase64Image] = useState('')
  const base64ImageRef = useRef(base64Image)

  const [isFileSelected, setFileSelected] = useState(false)
  const isFileSelectedRef = useRef(isFileSelected)

  const handleFileChange = event => {
    const file = event.target.files[0]

    setFileSelected(true)

    const reader = new FileReader()

    reader.onloadend = () => {
      base64ImageRef.current = reader.result
      setBase64Image(reader.result)
    }

    if (file) {
      reader.readAsDataURL(file)
    }
  }

  const { isOpen, onOpen, onClose } = useDisclosure()
  const { isOpen: PopoverIsOpen, onOpen: PopoverOnOpen, onClose: PopoverOnClose } = useDisclosure()

  const firstFieldRef = useRef(null)

  const sendButtonRef = useRef(null)

  const handlePaste = event => {
    if (!PopoverIsOpen) {
      return
    }
    const clipboardData = event.clipboardData
    if (clipboardData.items && clipboardData.items.length > 0) {
      for (let i = 0; i < clipboardData.items.length; i++) {
        const item = clipboardData.items[i]
        if (item.type.indexOf('image') !== -1) {
          const blob = item.getAsFile()
          const reader = new FileReader()
          reader.onloadend = () => {
            setFileSelected(true)

            const base64Image = reader.result

            base64ImageRef.current = base64Image
            setBase64Image(reader.result)
          }
          reader.readAsDataURL(blob)
        }
      }
    }
  }

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
              
              sendButtonRef.current.click()
            }
          }

          messageInput.addEventListener('keyup', keyDownHandler)
        })
      })
    }

    toDo()
  }, [])


  useEffect(() => {
    document.addEventListener('paste', handlePaste)

    return () => {
      document.removeEventListener('paste', handlePaste)
    }
  }, [PopoverIsOpen])

  const [usernameForLeave, setUsernameForLeave] = useState('')

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
          <Popover
            isOpen={PopoverIsOpen}
            onOpen={PopoverOnOpen}
            onClose={PopoverOnClose}
            initialFocusRef={firstFieldRef}
          >
            <PopoverTrigger>
              <IconButton icon={<ImageIcon />} onClick={() => {}} />
            </PopoverTrigger>
            <PopoverContent>
              <PopoverArrow />
              <PopoverCloseButton />
              <PopoverHeader>What's the image URL?</PopoverHeader>
              <PopoverBody>
                <FormControl>
                  <Input display="none" type="file" onChange={handleFileChange} accept="image/*" id="file-input" />

                  <HStack>
                    <Text color="grey">Currently selected file: </Text>
                    {isFileSelected ? (
                      <ChakraImage
                        src={base64Image}
                        width="25%"
                      />
                    ) : (
                      <Text>unselected</Text>
                    )}
                  </HStack>
                  <label htmlFor="file-input">
                    <IconButton
                      mt="0.5rem"
                      as="span"
                      icon={<UploadIcon />}
                    />
                  </label>
                  <IconButton
                    mt="0.5rem"
                    ml="0.5rem"
                    as="span"
                    icon={<XIcon />}
                    onClick={() => {
                      setFileSelected(false)

                      base64ImageRef.current = ''
                      setBase64Image('')
                    }}
                  />
                </FormControl>
              </PopoverBody>
            </PopoverContent>
          </Popover>

          <Input id="message-input" placeholder="Type the message" variant="filled" ref={messageInputValueRef} value={messageInputValue} onChange={event => {
            setMessageInputValue(event.target.value)
          }} />  
          <IconButton ref={sendButtonRef} icon={<SendIcon />} onClick={async () => {
            if (loadingRef.current) {
              return
            }

            if (messageInputValue === '' && !isFileSelected) {
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
            setMessages(prevMessages => [...prevMessages, [messageInputValue, username + ':', time, color, base64ImageRef.current]])
            scrollMessagesDown()

            socket.emit('sendMessage', { uid, message: messageInputValue, username, color, image: base64ImageRef.current })

            setMessageInputValue('')
            
            base64ImageRef.current = ''
            setBase64Image('')

            setFileSelected(false)
          }} />
        </HStack>
      </Center>
    </>
  )
})
