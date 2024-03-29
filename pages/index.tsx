import type { FC } from 'react'
import Head from 'next/head'
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Button,
  Center,
  HStack,
  Input,
  Text,
  VStack,
  useColorModeValue
} from '@chakra-ui/react'
import { BadgeCheckIcon } from 'lucide-react'
import { addRoom } from '../lib/firebaseOperations'
import { isRoomExistent } from '../lib/isRoomExistent'
import { useRouter } from 'next/router'
import { useNetwork } from '@mantine/hooks'

const Home: FC = () => {
  const router = useRouter()

  const networkStatus = useNetwork()

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
        {!networkStatus.online && (
          <Alert width="17rem" status="loading" rounded="xl">
            <AlertIcon />
            <AlertDescription>We seem to be not quite online</AlertDescription>
          </Alert>
        )}
      </VStack>


      <Button isDisabled={!networkStatus.online} ml="2rem" mt="1rem" colorScheme="telegram" onClick={() => {
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
        <Button isDisabled={!networkStatus.online} variant="outline" colorScheme={useColorModeValue('messenger', 'gray')} onClick={async () => {
          const roomUidInputValue = (document.getElementById('room-id-request') as HTMLInputElement).value
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

export default Home
