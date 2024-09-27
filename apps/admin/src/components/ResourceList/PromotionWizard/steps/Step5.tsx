import { FormControl, FormHelperText, FormLabel, Switch } from '@chakra-ui/react'
import { InputControl, SwitchControl } from '../../../OperationForm/Controls'
import { FC } from 'react'

interface Step5Props {
    showUsageOptions: boolean
    setShowUsageOptions: (showUsageOptions: boolean) => void
}
const Step5: FC<Step5Props> = ({ showUsageOptions, setShowUsageOptions }) => {
  
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
            helperText="How many times should this promotion be allowed to be used across all orders?  "
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
