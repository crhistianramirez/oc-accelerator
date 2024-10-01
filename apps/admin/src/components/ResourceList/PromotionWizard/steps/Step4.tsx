import { FormControl, FormHelperText, Text } from '@chakra-ui/react'
import { FC, useEffect } from 'react'
import { useController, useWatch } from 'react-hook-form'
import { InputControl, SwitchControl } from '../../../OperationForm/Controls'

interface Step4Props {
  onUpdateDescription: (description: JSX.Element) => void
}

const Step4: FC<Step4Props> = ({ onUpdateDescription }) => {
  const isAutoApply = useWatch({ name: 'body.AutoApply' })
  const {
    field: { onChange: setCode, value: promoCode },
  } = useController({ name: 'body.Code' })

  useEffect(() => {
    onUpdateDescription(
      <>
        <Text>
          Auto Apply:
          <Text
            ml="1"
            as="span"
            fontWeight="bold"
          >
            {isAutoApply ? 'true' : 'false'}
          </Text>
        </Text>
        <Text>
          Promo Code:
          <Text
            ml="1"
            as="span"
            fontWeight="bold"
          >
            {promoCode || ''}
          </Text>
        </Text>
      </>
    )
  }, [isAutoApply, promoCode, onUpdateDescription])

  useEffect(() => {
    const generatePromoCode = () => {
      const promoCode = generateRandomString(10)
      setCode(promoCode)
    }

    const generateRandomString = (length: number) =>
      Array.from({ length }, () =>
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.charAt(
          Math.floor(Math.random() * 62)
        )
      ).join('')

    if (isAutoApply) {
      generatePromoCode()
    } else {
      setCode('')
    }
  }, [isAutoApply, setCode])

  return (
    <>
      <FormControl mb={5}>
        <FormHelperText>
          Should this promotion be automatically applied to eligible orders?
        </FormHelperText>
      </FormControl>
      <SwitchControl
        label="Auto Apply"
        name="body.AutoApply"
        switchProps={{ colorScheme: 'primary' }}
      />
      {!isAutoApply && (
        <InputControl
          label="Promo Code"
          name="body.Code"
          helperText="What code should the customer enter to apply this promotion?"
          isRequired={!isAutoApply}
        />
      )}
    </>
  )
}

export default Step4
