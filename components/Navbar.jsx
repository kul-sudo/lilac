import { IconButton, Text, HStack, useColorMode, useColorModeValue } from '@chakra-ui/react'
import { MoonIcon, SunMediumIcon, UserIcon } from 'lucide-react'

export default ({ username }) => {
  const { toggleColorMode } = useColorMode()

  return (
    <HStack position="fixed" top="2" right="2" spacing="1rem">
      <HStack spacing="-0.05rem">
        <UserIcon />
        <Text>{username}</Text>
      </HStack>
      <IconButton rounded="full" _hover={{ backgroundColor: useColorModeValue('#f2f2f2', '#1d2430') }} variant="ghost" colorScheme={useColorModeValue('black', 'white')} onClick={toggleColorMode} icon={useColorModeValue(<MoonIcon />, <SunMediumIcon />)} />
    </HStack>
  )
}
