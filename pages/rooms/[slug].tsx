import type { ClientToServerEvents, DataProps, ServerToClientEvents } from '../../types/socket'
import type { BaseSyntheticEvent, Dispatch, FC, SetStateAction } from 'react'
import type { Socket } from 'socket.io'
import Head from 'next/head'
import { Image as ChakraImage, Popover, PopoverTrigger, PopoverContent, PopoverArrow, PopoverCloseButton, PopoverBody, PopoverHeader, Box, Button, Center, HStack, IconButton, Input, Spinner, Text, VStack, AlertDialog, AlertDialogOverlay, AlertDialogContent, AlertDialogCloseButton, FormControl, Kbd, Badge, useColorModeValue, useToast, useDisclosure } from '@chakra-ui/react'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { CopyIcon, Image as ImageIcon, LockIcon, SendIcon, UploadIcon, XIcon } from 'lucide-react'
import { addRoom } from '../../lib/firebaseOperations'
import { isRoomExistent } from '../../lib/isRoomExistent'
import { For, block } from 'million/react'
import io from 'socket.io-client'

type BlockProps = {
  element: string[];
  index: number;
  setAlertDialogImage: Dispatch<SetStateAction<string>>;
  onOpen: () => void
}

let socket: Socket<ServerToClientEvents, ClientToServerEvents>;

const ColumnBlockComponent: FC<BlockProps> = ({ element, index, setAlertDialogImage, onOpen }) => {
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
          width="80%"
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

const ColumnBlock = block(ColumnBlockComponent)

const getBase64ImageSize = (base64Image: string) => {
  const padding = (base64Image.endsWith('==')) ? 2 : (base64Image.endsWith('=')) ? 1 : 0
  const base64Length = base64Image.length
  const fileSizeInBytes = (base64Length / 4) * 3 - padding
  const fileSizeInMegabytes = fileSizeInBytes / (1024 * 1024)

  return fileSizeInMegabytes
}

const ChatSlug: FC = () => {
  const router = useRouter()
  const uid = router.query.slug as string

  const [UIDToShow, setUIDToShow] = useState('Unavailable')

  const messagesContainerRef = useRef(null)

  useEffect(() => {
    const checkRoomExistence = async (roomUid: string) => {
      if (await isRoomExistent(roomUid)) {
        setUIDToShow(roomUid)
      } else {
        const newRoomUid = Math.random().toString(16).slice(2)
        addRoom(newRoomUid)
        setUIDToShow(newRoomUid)
        router.push(`/rooms/${newRoomUid}`)
      }
    }

    checkRoomExistence(uid)
  }, [router, uid])

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

  const [base64Image, setBase64Image] = useState('')

  const [isFileSelected, setFileSelected] = useState(false)

  const fileInputRef = useRef(null)

  const handleFileChange = (event: BaseSyntheticEvent) => {
    const file = event.target.files[0]

    setFileSelected(true)

    const reader = new FileReader()

    reader.onloadend = () => {
      setBase64Image(reader.result as string)
    }

    if (file) {
      reader.readAsDataURL(file)
    }
  }

  const { isOpen, onOpen, onClose } = useDisclosure()
  const { isOpen: PopoverIsOpen, onOpen: PopoverOnOpen, onClose: PopoverOnClose } = useDisclosure()

  const firstFieldRef = useRef(null)
  const sendButtonRef = useRef(null)


  useEffect(() => {
    let usernameForServer: string;

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
          }) as unknown as Socket<ServerToClientEvents, ClientToServerEvents> 

          socket.on('connect', () => {
            socket.emit('createRoom', { username: usernameForServer, uid })
          })

          socket.on('messageReceived', (data: DataProps) => {
            const date = new Date()
            const time = `${date.getHours().toLocaleString('en-gb', { minimumIntegerDigits: 2, useGrouping: false })}:${date.getMinutes().toLocaleString('en-gb', { minimumIntegerDigits: 2, useGrouping: false })}`

            setMessages(prevMessages => [...prevMessages, [data.message, data.username + ':', time, data.color, data.image]])

            scrollMessagesDown()
          })

          socket.on('userConnected', (message: string) => {
            setMessages(prevMessages => [...prevMessages, [message, undefined, undefined, undefined, undefined]])
            setLoading(false)
          })

          socket.on('userLeft', (message: string) => {
            setMessages(prevMessages => [...prevMessages, [message, undefined, undefined, undefined, undefined]])
          })

          const messageInput = document.getElementById('message-input')
          const username = data.payload.username

          const color = data.payload.color
          setColor(color)
          setUsername(username)

          const keyDownHandler = async ({ key }) => {
            if (key === 'Enter') {
              sendButtonRef.current.click()
            }
          }

          messageInput.addEventListener('keyup', keyDownHandler)
        })
      })
    }

    toDo()

    return () => {
      socket.disconnect()
    }
  }, [uid])

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
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

              setBase64Image(reader.result as string)
            }
            reader.readAsDataURL(blob)
          }
        }
      }
    }

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

        <AlertDialogContent maxWidth="60rem">
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
            <IconButton aria-label="copy" variant="unstyled" icon={<CopyIcon />} onClick={() => {
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
              <IconButton aria-label="set-image" icon={<ImageIcon />} />
            </PopoverTrigger>
            <PopoverContent>
              <PopoverArrow />
              <PopoverCloseButton />
              <PopoverHeader>{"What's"} the image?</PopoverHeader>
              <PopoverBody>
                <FormControl>
                  <Input display="none" type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" id="file-input" />
                  <Badge>
                    You can use <Kbd>ctrl</Kbd> + <Kbd>v</Kbd> to paste an image
                  </Badge>
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
                      aria-label="upload-image"
                      mt="0.5rem"
                      as="span"
                      icon={<UploadIcon />}
                    />
                  </label>
                  <IconButton
                    aria-label="clear-image"
                    mt="0.5rem"
                    ml="0.5rem"
                    as="span"
                    icon={<XIcon />}
                    onClick={() => {
                      setFileSelected(false)
                      setBase64Image('')
                      fileInputRef.current.value = ''
                    }}
                  />
                </FormControl>
              </PopoverBody>
            </PopoverContent>
          </Popover>

          <Input id="message-input" placeholder="Type the message" variant="filled" ref={messageInputValueRef} value={messageInputValue} onChange={event => {
            setMessageInputValue(event.target.value)
          }} />  
          <IconButton aria-label="send" ref={sendButtonRef} icon={<SendIcon />} onClick={async () => {
            if (loading) {
              return
            }

            if (isFileSelected && getBase64ImageSize(base64Image) > 1) {
              toast({
                title: 'Error',
                description: 'The image you have sent is over 1 MB. Try downloading it and uploading it as a file.',
                status: 'error',
                duration: 9000,
                isClosable: true
              })

              setFileSelected(false)
              setBase64Image('')
              fileInputRef.current.value = ''

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
            setMessages(prevMessages => [...prevMessages, [messageInputValue, username + ':', time, color, base64Image]])
            
            scrollMessagesDown()

            socket.emit('sendMessage', { uid, message: messageInputValue, username, color, image: base64Image })

            setMessageInputValue('')
            
            setFileSelected(false)
            setBase64Image('')
            fileInputRef.current.value = ''
          }} />
        </HStack>
      </Center>
    </>
  )
}

export default ChatSlug
