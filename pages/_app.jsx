import { Button, Center, ChakraProvider, Input, VStack } from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import theme from '@/lib/theme'
import '@/styles/globals.css'

const BLANK = 0
const AUTH = 1
const MAIN_PAGE = 2

export default ({ Component, pageProps }) => {
  const [requiresAuth, setRequiresAuth] = useState(BLANK)  
  const [usernameToShow, setUsernameToShow] = useState('')

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

  const verifyToken = async token => {
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
        fetch('/api/remove-token', {
          method: 'DELETE'
        })
      }
    } catch (error) {
      console.error('Failed to verify token:', error)
    }
  }

  return (
    <ChakraProvider theme={theme}>
      {requiresAuth === AUTH && (
        <Center mt="2rem">
          <VStack>
            <Input id="auth-username-input" placeholder="Type your username" />
            <Button onClick={async () => {
              const username = document.getElementById('auth-username-input').value
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
      )}

      {requiresAuth === MAIN_PAGE && (
        <>
          <Navbar username={usernameToShow} />
          <Component {...pageProps} />
        </>
      )}
    </ChakraProvider>
  )
}
