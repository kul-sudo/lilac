import Head from 'next/head'
import { Button, HStack, Input, Text, VStack, useColorModeValue } from '@chakra-ui/react'
import { useEffect } from 'react'
import { useRouter } from 'next/router';
import { BadgeCheckIcon } from 'lucide-react';
import io from 'socket.io-client'

let socket;

const isRoomExistent = roomUid => {
  const gotItem = localStorage.getItem('rooms')
  if (gotItem === null) {
    return true
  }
  if (JSON.parse(gotItem).includes(roomUid)) {
    return true
  }
  return false
}

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

      <VStack mt="2rem" ml="2rem" alignItems="left">
        <Text fontSize="2.5rem" fontWeight="extrabold">The lightest messenger in the world.</Text>
        <Text color="#7f8ea3" fontSize="xl">Just create a room, share it with your friend and share your thoughts.</Text>
      </VStack>

      <Button ml="2rem" mt="1rem" colorScheme="telegram" onClick={() => {
        const uid = Math.random().toString(16).slice(2)
        router.push(`/rooms/${uid}`)
        if (localStorage.getItem('rooms') === null) {
          localStorage.setItem('rooms', JSON.stringify([uid]))
        } else {
          const fetched = JSON.parse(localStorage.getItem('rooms'))
          fetched.push(uid)
          localStorage.setItem('rooms', JSON.stringify(fetched))
        }
      }}>Create a room</Button>

      <VStack alignItems="flex-start" ml="2rem" mt="2.5rem">
        <HStack>
          <BadgeCheckIcon />
          <Text>If the room does not exist, it will be created with a brand new ID.</Text>
        </HStack>
        <Input id="room-id-request" variant="filled" placeholder="What's the room ID?" width="15rem" />
        <Button variant="outline" colorScheme={useColorModeValue('messenger', 'gray')} onClick={() => {
          const roomUidInputValue = document.getElementById('room-id-request').value
          if (isRoomExistent(roomUidInputValue)) {
            socket.emit('createRoom', roomUidInputValue)
            router.push(`/rooms/${roomUidInputValue}`)
          } else {
            const uid = Math.random().toString(16).slice(2)
            socket.emit('createRoom', uid)
            router.push(`/rooms/${uid}`)
          }
        }}>Join a room</Button>
      </VStack>
    </>
  )
}
