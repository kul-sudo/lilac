import type { FC } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { Box, Button, Text } from '@chakra-ui/react'

const Page404: FC = () => {
  return (
    <>
      <Head>
        <title>lilac</title>
        <meta name="description" content="Chat privately." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Box ml="2rem" mt="1rem">
        <Text fontSize="3.5rem" fontWeight="extrabold">Page not found.</Text>
        <Link href="/">
          <Button size="md">Go to the main page</Button>
        </Link>
      </Box>
    </>
  )
}

export default Page404
