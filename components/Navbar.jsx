import { IconButton, Text, HStack, useColorMode, useColorModeValue } from '@chakra-ui/react'
import { LogOutIcon, MoonIcon, SunMediumIcon, UserIcon } from 'lucide-react'

export default ({ username }) => {
  const { toggleColorMode } = useColorMode()

  return (
    <HStack position="fixed" top="2" right="2" spacing="1rem" backdropFilter="auto" backdropBlur="5px" px="1rem" rounded="xl">
      <HStack spacing="-0.05rem">
        <UserIcon />
        <Text>{username}</Text>
      </HStack>
      <IconButton rounded="full" _hover={{ backgroundColor: useColorModeValue('#f2f2f2', '#1d2430') }} variant="ghost" icon={<LogOutIcon />} onClick={() => {
        fetch('/api/remove-token', {
          method: 'DELETE'
        })

        window.location.reload()
      }} />
      <IconButton rounded="full" _hover={{ backgroundColor: useColorModeValue('#f2f2f2', '#1d2430') }} variant="ghost" onClick={toggleColorMode} icon={useColorModeValue(<MoonIcon />, <SunMediumIcon />)} />
    </HStack>
  )
}
