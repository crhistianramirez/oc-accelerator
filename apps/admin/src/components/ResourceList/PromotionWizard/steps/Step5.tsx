import { FormControl, FormHelperText, FormLabel, Switch, Text, VStack } from '@chakra-ui/react'
import { InputControl, SwitchControl } from '../../../OperationForm/Controls'
import { FC, useEffect, useState } from 'react'
import { useWatch } from 'react-hook-form'

interface Step5Props {
  onUpdateDescription: (description: JSX.Element) => void
}

const Step5: FC<Step5Props> = ({ onUpdateDescription }) => {
  const [showUsageOptions, setShowUsageOptions] = useState(false)
  const [redemptionLimit, redemptionLimitPerUser, canCombine] = useWatch({
    name: ['body.RedemptionLimit', 'body.RedemptionLimitPerUser', 'body.CanCombine'],
  })

  useEffect(() => {
    const usageDescription = showUsageOptions ? (
      <VStack align="start">
        {redemptionLimit && (
          <Text>
            Redemption Limit:{' '}
            <Text
              as="span"
              fontWeight="bold"
            >
              {redemptionLimit}
            </Text>
          </Text>
        )}

        {redemptionLimitPerUser && (
          <Text>
            Redemption Limit Per User:{' '}
            <Text
              as="span"
              fontWeight="bold"
            >
              {redemptionLimitPerUser}
            </Text>
          </Text>
        )}

        <Text>
          Can Combine:{' '}
          <Text
            as="span"
            fontWeight="bold"
          >
            {canCombine ? 'true' : 'false'}
          </Text>
        </Text>
      </VStack>
    ) : <></>

    onUpdateDescription(usageDescription)
  }, [showUsageOptions, redemptionLimit, redemptionLimitPerUser, canCombine, onUpdateDescription])

  return (
    <>
      <FormControl mb={5}>
        <FormHelperText>Do you want to define any usage limits for users?</FormHelperText>
      </FormControl>
      <FormControl
        display="flex"
        alignItems="center"
      >
        <FormLabel>Apply Usage Limits</FormLabel>
        <Switch
          colorScheme="primary"
          isChecked={showUsageOptions}
          onChange={() => setShowUsageOptions(!showUsageOptions)}
        />
      </FormControl>
      {showUsageOptions && (
        <>
          <InputControl
            label="Redemption Limit"
            name="body.RedemptionLimit"
            inputMode="numeric"
            helperText="How many times should this promotion be allowed to be used across all orders?"
          />
          <InputControl
            label="Redemption Limit Per User"
            name="body.RedemptionLimitPerUser"
            inputMode="numeric"
            helperText="How many times should this promotion be allowed to be used by a single user?"
          />
          <SwitchControl
            label="Should this promotion be allowed to be combined with other promotions?"
            name="body.CanCombine"
            switchProps={{ colorScheme: 'primary' }}
          />
        </>
      )}
    </>
  )
}

export default Step5
