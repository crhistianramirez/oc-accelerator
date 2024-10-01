import { FormControl, FormErrorMessage } from '@chakra-ui/react'
import { FC, useEffect, useMemo } from 'react'
import { useController, useWatch } from 'react-hook-form'
import { VStack, Text } from '@chakra-ui/react'
import { ExpressionRecipesSelect } from '../../../OperationForm/ExpressionBuilder/ExpressionRecipes/ExpressionRecipesSelect'
import { formatQuery } from '../../../OperationForm/ExpressionBuilder/PromotionExpressionBuilder/formatQuery'
import { isEmpty } from 'lodash'

interface Step6Props {
  onUpdateDescription: (description: JSX.Element) => void
}

const Step6: FC<Step6Props> = ({ onUpdateDescription }) => {
  const [isLineItemLevel] = useWatch({ name: ['body.LineItemLevel'] })

  const {
    field: { value: eligibleExpression, onChange: setEligibleExpression },
    fieldState: { error: eligibleExpressionError },
  } = useController({ name: 'body.EligibleExpression' })

  const {
    field: { value: valueExpression, onChange: setValueExpression },
    fieldState: { error: valueExpressionError },
  } = useController({ name: 'body.ValueExpression' })

  const hasRecipeErrors = useMemo(() => {
    return !isEmpty(eligibleExpressionError) || !isEmpty(valueExpressionError)
  }, [eligibleExpressionError, valueExpressionError])

  useEffect(() => {
    onUpdateDescription(
      <VStack
        align="start"
        gap="0"
      >
        {eligibleExpression && (
          <Text>
            Eligible Expression:{' '}
            <Text
              ml="1"
              as="span"
              fontWeight="bold"
            >
              {eligibleExpression}
            </Text>
          </Text>
        )}
        {valueExpression && (
          <Text>
            Value Expression:{' '}
            <Text
              ml="1"
              as="span"
              fontWeight="bold"
            >
              {valueExpression}
            </Text>
          </Text>
        )}
      </VStack>
    )
  }, [eligibleExpression, valueExpression, onUpdateDescription])

  const handleExpressionChange = (eligibleExpressionQuery: any, valueExpressionQuery: any) => {
    const _eligibleExpression = formatQuery(eligibleExpressionQuery, isLineItemLevel)
    const _valueExpression = formatQuery(valueExpressionQuery, isLineItemLevel)

    setEligibleExpression(_eligibleExpression)
    setValueExpression(_valueExpression)
  }

  return (
    <>
      <FormControl isInvalid={hasRecipeErrors}>
        <FormErrorMessage>Please select a recipe</FormErrorMessage>
      </FormControl>
      <ExpressionRecipesSelect
        type="Promotion"
        onChange={handleExpressionChange}
        filter={(recipe) => recipe.isLineItemLevel === isLineItemLevel}
      />
    </>
  )
}

export default Step6
