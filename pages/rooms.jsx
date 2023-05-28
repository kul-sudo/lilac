import Link from 'next/link'
import { Box, Button, Text } from '@chakra-ui/react'

export default () => {
  return (
    <Box ml="2rem" mt="1rem">
      <Text fontSize="3.5rem" fontWeight="extrabold">Page not found.</Text>
      <Link href="/">
        <Button size="md">Go to the main page</Button>
      </Link>
    </Box>
  )
}

