import { FormControl, FormHelperText, HStack, Tooltip } from '@chakra-ui/react'
import { InfoOutlineIcon } from '@chakra-ui/icons'
import { SwitchControl } from '../../../OperationForm/Controls'
import { FC } from 'react'

interface Step3Props {}
const Step3: FC<Step3Props> = () => {
  return (
    <>
      <FormControl mb={5}>
        <HStack alignItems="flex-end">
          <FormHelperText>Should this promotion be applied at the item level?</FormHelperText>
          <Tooltip
            label="A line item level promotion can associate promotions to specific line items in the cart as opposed to the entire order."
            placement="right"
            aria-label={`Tooltip for form field body.LineItemLevel`}
          >
            <InfoOutlineIcon
              fontSize="1em"
              color="blackAlpha.600"
            />
          </Tooltip>
        </HStack>
      </FormControl>
      <SwitchControl
        label="Line Item Level"
        name="body.LineItemLevel"
        switchProps={{ colorScheme: 'primary' }}
      />
    </>
  )
}

export default Step3
