import Head from 'next/head'
import { Button, HStack, Input, Text, VStack, useColorModeValue } from '@chakra-ui/react'
import { BadgeCheckIcon } from 'lucide-react'
import { addRoom } from '@/lib/firebaseOperations'
import { isRoomExistent } from '@/lib/isRoomExistent'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import io from 'socket.io-client'

let socket;

export default () => {
  const router = useRouter()

  const socketInitializer = async () => {
    await fetch('/api/socket')

    socket = io(undefined, {
      path: '/api/socket'
    })
  }

  useEffect(() => {
    socketInitializer()
  }, [])

  return (
    <>
      <Head>
        <title>lilac</title>
        <meta name="description" content="Chat privately." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <VStack mt="3rem" ml="2rem" alignItems="left">
        <Text fontSize="2.5rem" fontWeight="extrabold">The lightest messenger in the world.</Text>
        <Text color="#7f8ea3" fontSize="xl" pr="1rem">Just create a room, share it with your friend and share your thoughts.</Text>
      </VStack>

      <Button ml="2rem" mt="1rem" colorScheme="telegram" onClick={async () => {
        const uid = Math.random().toString(16).slice(2)
        router.push(`/rooms/${uid}`)
        addRoom(uid) 
      }}>Create a room</Button>

      <VStack alignItems="flex-start" ml="2rem" mt="2.5rem">
        <HStack display="inline-flex" alignItems="top">
          <BadgeCheckIcon />
          <Text width="80%">If the room does not exist, it will be created with a brand new ID.</Text>
        </HStack>
        <Input id="room-id-request" variant="filled" placeholder="What's the room ID?" width="15rem" />
        <Button variant="outline" colorScheme={useColorModeValue('messenger', 'gray')} onClick={async () => {
          const roomUidInputValue = document.getElementById('room-id-request').value
          if (await isRoomExistent(roomUidInputValue)) {
            router.push(`/rooms/${roomUidInputValue}`)
          } else {
            const uid = Math.random().toString(16).slice(2)
            addRoom(uid)
            router.push(`/rooms/${uid}`)
          }
        }}>Join a room</Button>
      </VStack>
    </>
  )
}
