import { Dispatch, SetStateAction } from 'react'

export type BlockProps = {
  element: string[];
  index: number;
  onOpen: () => void
}
