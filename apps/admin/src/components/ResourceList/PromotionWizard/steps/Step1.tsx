import { FormControl, FormHelperText } from '@chakra-ui/react'
import { InputControl } from '../../../OperationForm/Controls'
import { FC, useEffect } from 'react'
import { useWatch } from 'react-hook-form'
import { VStack, Text } from '@chakra-ui/react'

interface Step1Props {
  onUpdateDescription: (description: JSX.Element) => void
}

const Step1: FC<Step1Props> = ({ onUpdateDescription }) => {
  const [name, description] = useWatch({ name: ['body.Name', 'body.Description'] })

  useEffect(() => {
    onUpdateDescription(
      <VStack
        align="start"
        gap="0"
      >
        {name && (
          <Text>
            Promotion Name:{' '}
            <Text
              ml="1"
              as="span"
              fontWeight="bold"
            >
              {name}
            </Text>
          </Text>
        )}
        {description && (
          <Text>
            Description:
            <Text
              ml="1"
              as="span"
              fontWeight="bold"
            >
              {description}
            </Text>
          </Text>
        )}
      </VStack>
    )
  }, [name, description, onUpdateDescription])

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
