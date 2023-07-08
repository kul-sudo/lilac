import { Dispatch, SetStateAction } from 'react'

export type BlockProps = {
  element: string[];
  index: number;
  setAlertDialogImage: Dispatch<SetStateAction<string>>;
  onOpen: () => void
}
