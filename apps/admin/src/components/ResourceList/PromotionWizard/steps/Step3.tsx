import { FormControl, Text, FormHelperText, HStack, Tooltip } from '@chakra-ui/react'
import { InfoOutlineIcon } from '@chakra-ui/icons'
import { SwitchControl } from '../../../OperationForm/Controls'
import { FC, useEffect } from 'react'
import { useWatch } from 'react-hook-form'

interface Step3Props {
  onUpdateDescription: (description: JSX.Element) => void
}

const Step3: FC<Step3Props> = ({ onUpdateDescription }) => {
  const lineItemLevel = useWatch({ name: 'body.LineItemLevel' })

  // Update the description whenever the switch value changes
  useEffect(() => {
    onUpdateDescription(
      <Text>
        Line Item Level:
        <Text
          ml="1"
          as="span"
          fontWeight="bold"
        >
          {lineItemLevel ? 'true' : 'false'}
        </Text>
      </Text>
    )
  }, [lineItemLevel, onUpdateDescription])

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
              boxSize=".8em"
              mb="1px"
              color="chakra-subtle-text"
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
