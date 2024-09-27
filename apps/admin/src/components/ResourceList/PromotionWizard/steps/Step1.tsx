import { FormControl, FormHelperText } from '@chakra-ui/react'
import { InputControl } from '../../../OperationForm/Controls'
import { FC } from 'react'

interface Step1Props {}
const Step1: FC<Step1Props> = () => {
  return (
    <>
      <FormControl mb={5}>
        <FormHelperText>
          Provide an optional name and description for your promotion.
        </FormHelperText>
      </FormControl>
      <InputControl
        label="Promotion Name"
        name="body.Name"
      />
      <InputControl
        label="Description"
        name="body.Description"
      />
    </>
  )
}

export default Step1
