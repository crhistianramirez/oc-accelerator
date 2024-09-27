import { FormControl, FormHelperText } from '@chakra-ui/react'
import { InputControl } from '../../../OperationForm/Controls'
import { FC } from 'react'

interface Step2Props {}
const Step2: FC<Step2Props> = () => {
  return (
    <>
      <FormControl mb={5}>
        <FormHelperText>
          Provide an optional start and expiration date for your promotion
        </FormHelperText>
      </FormControl>
      <InputControl
        label="Start Date"
        name="body.StartDate"
        inputProps={{ type: 'datetime-local' }}
      />
      <InputControl
        label="End Date"
        name="body.ExpirationDate"
        inputProps={{ type: 'datetime-local' }}
      />
    </>
  )
}

export default Step2
