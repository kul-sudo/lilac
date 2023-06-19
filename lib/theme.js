import { extendTheme } from '@chakra-ui/react'
import { mode } from '@chakra-ui/theme-tools'
import { Inter } from 'next/font/google'

const font = Inter({ preload: false })

const styles = {
  global: props => ({
    body: {
      bg: mode('#dbdbdb', '#030711')(props)
    }
  })
}

const fonts = {
  body: font.style.fontFamily,
  heading: font.style.fontFamily
}

const config = {
  initialColorMode: 'dark',
  useSystemColorMode: true
}

export default extendTheme({ fonts, config, styles })
