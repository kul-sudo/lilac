import { AppProps } from 'next/app'
import { Button, Center, ChakraBaseProvider, Input, VStack, useToast } from '@chakra-ui/react'
import { useState, useEffect, FC } from 'react'
import Navbar from '../components/Navbar'
import theme from '../lib/theme'
import '../styles/globals.css'

const BLANK = 0
const AUTH = 1
const MAIN_PAGE = 2

const App: FC<AppProps> = ({ Component, pageProps }) => {
  const [requiresAuth, setRequiresAuth] = useState(BLANK)  
  const [usernameToShow, setUsernameToShow] = useState('')
  const toast = useToast()

  useEffect(() => {
    fetch('/api/get-token')
      .then(response => response.json())
      .then(data => {
        const token = data.token
        fetch('/api/if-cookie-exists')
          .then(response => response.json())
          .then(data => {
            if (data.tokenExists) {
              verifyToken(token)
            } else {
              setRequiresAuth(AUTH)
            }
          })
          .catch(error => {
            console.error('Error checking token:', error)
          })
      })
  }, [])

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch('/api/verify-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      })

      if (response.ok) {
        setRequiresAuth(MAIN_PAGE)
        
        const { payload } = await response.json()
        const username = payload.username
        setUsernameToShow(username)
      } else if (response.status === 401) {
        setRequiresAuth(AUTH)
        await fetch('/api/remove-token', {
          method: 'DELETE'
        })
      }
    } catch (error) {
      console.error('Failed to verify token:', error)
    }
  }

  return (
    <ChakraBaseProvider theme={theme}>
      {(requiresAuth === AUTH) && (
        <>
          <Navbar onlyTheme />

          <Center mt="2rem">

            <VStack>
              <Input id="auth-username-input" placeholder="Type your username" />
              <Button onClick={async () => {
                const username = (document.getElementById('auth-username-input') as HTMLInputElement).value

                if (username === '') {
                  toast({
                    title: 'Error',
                    description: 'The nickname is empty.',
                    status: 'error',
                    duration: 9000,
                    isClosable: true
                  })

                  return
                }

                if (username.length >= 9) {
                  toast({
                    title: 'Error',
                    description: 'Your nickname cannot consist of more than 9 letters.',
                    status: 'error',
                    duration: 9000,
                    isClosable: true
                  })

                  return
                }

                try {
                  const response = await fetch('/api/authenticate', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username })
                  })

                  if (response.ok) {
                    setRequiresAuth(MAIN_PAGE)
                  } else {
                    throw new Error('Authentication failed')
                  }
                } catch (error) {
                  console.error('Authentication error:', error)
                }

                setUsernameToShow(username)
              }}>Authenticate</Button>
            </VStack>
          </Center>
        </>
      )}

      {(requiresAuth === MAIN_PAGE) && (
        <>
          <Navbar username={usernameToShow} />
          <Component {...pageProps} />
        </>
      )}
    </ChakraBaseProvider>
  )
}

export default App
