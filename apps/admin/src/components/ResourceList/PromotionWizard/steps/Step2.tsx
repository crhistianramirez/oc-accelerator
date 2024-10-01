import { FormControl, FormHelperText, Text, VStack } from '@chakra-ui/react'
import { InputControl } from '../../../OperationForm/Controls'
import { FC, useEffect } from 'react'
import { useWatch } from 'react-hook-form'

interface Step2Props {
  onUpdateDescription: (description: JSX.Element) => void
}

const Step2: FC<Step2Props> = ({ onUpdateDescription }) => {
  const [startDate, endDate] = useWatch({ name: ['body.StartDate', 'body.ExpirationDate'] })

  useEffect(() => {
    const formattedStart = startDate ? new Date(startDate).toLocaleString() : ''
    const formattedEnd = endDate ? new Date(endDate).toLocaleString() : ''

    onUpdateDescription(
      <VStack
        align="start"
        gap="0"
      >
        {formattedStart && (
          <Text>
            Start Date:{' '}
            <Text
              ml="1"
              as="span"
              fontWeight="bold"
            >
              {formattedStart}
            </Text>
          </Text>
        )}
        {formattedEnd && (
          <Text>
            End Date:
            <Text
              ml="1"
              as="span"
              fontWeight="bold"
            >
              {formattedEnd}
            </Text>
          </Text>
        )}
      </VStack>
    )
  }, [startDate, endDate, onUpdateDescription])

  return (
    <>
      <FormControl mb={5}>
        <FormHelperText>
          Provide an optional start and expiration date for your promotion.
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
