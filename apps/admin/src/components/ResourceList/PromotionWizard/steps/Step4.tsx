import { FormControl, FormHelperText } from '@chakra-ui/react'
import { InputControl, SwitchControl } from '../../../OperationForm/Controls'
import { FC, useEffect } from 'react'
import { useController, useWatch } from 'react-hook-form'

interface Step4Props {}
const Step4: FC<Step4Props> = () => {
  const isAutoApply = useWatch({ name: 'body.AutoApply' })
  const {
    field: { onChange: setCode },
  } = useController({ name: 'body.Code' })

  useEffect(() => {
    const generatePromoCode = () => {
      const promoCode = generateRandomString(100)
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
