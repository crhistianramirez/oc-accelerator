import { FormControl, FormHelperText, Text, VStack } from '@chakra-ui/react'
import { InputControl } from '../../../OperationForm/Controls'
import { FC, useEffect } from 'react'
import { useFormContext } from 'react-hook-form'

interface Step2Props {
  onUpdateDescription: (description: JSX.Element) => void
}

const Step2: FC<Step2Props> = ({ onUpdateDescription }) => {
  const { getValues, watch } = useFormContext()

  const startDate = watch('body.StartDate')
  const endDate = watch('body.ExpirationDate')

  useEffect(() => {
    const currentStartDate = getValues('body.StartDate')
    const currentEndDate = getValues('body.ExpirationDate')

    const formattedStart = currentStartDate ? new Date(currentStartDate).toLocaleString() : ''
    const formattedEnd = currentEndDate ? new Date(currentEndDate).toLocaleString() : ''

    onUpdateDescription(
      <VStack
        align="start"
        gap="0"
      >
        {formattedStart && (
          <Text>
            Promotion Name:{' '}
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
            Description:
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
  }, [startDate, endDate, onUpdateDescription, getValues])

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
