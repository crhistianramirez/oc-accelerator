import {
  Button,
  ButtonGroup,
  Flex,
  FormControl,
  FormErrorMessage,
  Hide,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Show,
  Step,
  StepIndicator,
  StepNumber,
  Stepper,
  StepSeparator,
  StepStatus,
  StepTitle,
  Text,
  useDisclosure,
  useSteps,
  useToast,
  VStack,
} from '@chakra-ui/react'
import { FC, useEffect, useMemo, useState } from 'react'
import { FormProvider, SubmitHandler } from 'react-hook-form'
import { ExpressionRecipesSelect } from '../../OperationForm/ExpressionBuilder/ExpressionRecipes/ExpressionRecipesSelect'
import Step1 from './steps/Step1'
import Step2 from './steps/Step2'
import Step4 from './steps/Step4'
import Step3 from './steps/Step3'
import Step5 from './steps/Step5'
import { formatQuery } from '../../OperationForm/ExpressionBuilder/PromotionExpressionBuilder/formatQuery'
import { useMutateOcResource, useOcForm } from '@rwatt451/ordercloud-react'
import { OrderCloudError, Promotion } from 'ordercloud-javascript-sdk'
import { ApiError } from '../../OperationForm'
import { get } from 'lodash'
import { useNavigate } from 'react-router-dom'
interface PromotionWizardProps {}

const PromotionWizard: FC<PromotionWizardProps> = () => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [showUsageOptions, setShowUsageOptions] = useState(false)
  const toast = useToast()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const initialValues = useMemo(() => {
    return {
      body: {
        Name: '',
        Description: '',
        LineItemLevel: false,
        AutoApply: false,
        Code: '',
        RedemptionLimit: null,
        RedemptionLimitPerUser: null,
        CanCombine: false,
        EligibleExpression: '',
        ValueExpression: '',
      },
      parameters: {
        // This is required by the form even though we're not using it
        promotionID: 'someval',
      },
    }
  }, [])

  const { methods } = useOcForm('Promotions', initialValues)
  const { mutateAsync: saveAsync, error: saveError } = useMutateOcResource<Promotion>(
    'Promotions',
    {},
    undefined,
    true
  )

  const isMissingRecipe = useMemo(() => {
    const errors = methods.formState.errors.body
    if (get(errors, 'EligibleExpression') || get(errors, 'ValueExpression')) {
      return true
    }
    return false
  }, [methods.formState])

  useEffect(() => {
    const error = saveError as OrderCloudError
    if (error) {
      const ocError = error?.response?.data?.Errors?.[0] as ApiError
      if (ocError && !toast.isActive(ocError.ErrorCode)) {
        toast({
          id: ocError.ErrorCode,
          title: ocError.Message,
          status: 'error',
        })
      }
    }
  }, [saveError, toast])

  const steps = [
    'Name & Description',
    'Start/End dates',
    'Line item level?',
    'Auto apply?',
    'Usage limits',
    'Promo recipe',
  ]

  const stepFields = [
    ['body.Name', 'body.Description'],
    ['body.StartDate', 'body.EndDate'],
    ['body.LineItemLevel'],
    ['body.AutoApply', 'body.Code'],
    ['body.RedemptionLimit', 'body.RedemptionLimitPerUser', 'body.CanCombine'],
    ['body.EligibleExpression', 'body.ValueExpression'],
  ]

  const { activeStep, goToNext, goToPrevious, setActiveStep } = useSteps({
    index: 0,
    count: steps.length,
  })

  const isLineItemLevel = methods.watch('body.LineItemLevel') || false

  const handleRecipeSelect = (eligibleExpressionQuery: any, valueExpressionQuery: any) => {
    const eligibleExpression = formatQuery(eligibleExpressionQuery, isLineItemLevel)
    const valueExpression = formatQuery(valueExpressionQuery, isLineItemLevel)
    methods.setValue('body.EligibleExpression', eligibleExpression)
    methods.setValue('body.ValueExpression', valueExpression)
  }

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return <Step1 key={step} />
      case 1:
        return <Step2 key={step} />
      case 2:
        return <Step3 key={step} />
      case 3:
        return <Step4 key={step} />
      case 4:
        return (
          <Step5
            key={step}
            showUsageOptions={showUsageOptions}
            setShowUsageOptions={setShowUsageOptions}
          />
        )
      case 5:
        return (
          <>
            <FormControl isInvalid={isMissingRecipe}>
              <FormErrorMessage>Please select a recipe and submit again.</FormErrorMessage>
            </FormControl>
            <ExpressionRecipesSelect
              type="Promotion"
              onChange={handleRecipeSelect}
              filter={(recipe) => recipe.isLineItemLevel === isLineItemLevel}
            />
          </>
        )
      default:
        return 'Unknown step'
    }
  }

  const handleNextClick = async () => {
    const fieldNames = stepFields[activeStep] as any
    const isValid = await methods.trigger(fieldNames)
    if (isValid) {
      goToNext()
    }
  }

  const onSubmit: SubmitHandler<any> = async (data) => {
    try {
      setIsLoading(true)
      const response = await saveAsync(data.body)
      onClose()
      navigate(`/promotions/${response.ID}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button
        ml="auto"
        variant="solid"
        colorScheme="primary"
        onClick={onOpen}
      >
        Create Promotion
      </Button>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="full"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader mb={8}>
            <Flex flexDir="column">
              <Stepper
                colorScheme="primary"
                index={activeStep}
                mb={3}
              >
                {steps.map((step, index) => (
                  <Step
                    key={index}
                    onClick={() => setActiveStep(index)}
                  >
                    <VStack>
                      <StepIndicator>
                        <StepStatus
                          complete={<StepNumber />}
                          incomplete={<StepNumber />}
                          active={<StepNumber />}
                        />
                      </StepIndicator>
                      <Hide below="xl">
                        <StepTitle>{step}</StepTitle>
                      </Hide>
                    </VStack>
                    <StepSeparator />
                  </Step>
                ))}
              </Stepper>
              <Show below="xl">
                <Text>
                  Step {activeStep + 1}: {steps[activeStep]}
                </Text>
              </Show>
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormProvider {...methods}>
              <form
                name="PROMOTION_FORM"
                onSubmit={methods.handleSubmit(onSubmit)}
              >
                <Flex
                  width="full"
                  justifyContent="center"
                >
                  <VStack
                    width="100%"
                    maxW={500}
                  >
                    {renderStepContent(activeStep)}
                    <ButtonGroup
                      mt={5}
                      justifyContent={activeStep === 0 ? 'flex-end' : 'space-between'}
                      width="full"
                    >
                      {activeStep !== 0 && <Button onClick={goToPrevious}>Previous</Button>}
                      {activeStep < steps.length - 1 && (
                        <Button
                          colorScheme="primary"
                          onClick={handleNextClick}
                        >
                          Next
                        </Button>
                      )}
                      <Button
                        colorScheme="primary"
                        type="submit"
                        isLoading={isLoading}
                        loadingText="Submitting..."
                        display={activeStep < steps.length - 1 ? 'none' : ''}
                      >
                        Submit
                      </Button>
                    </ButtonGroup>
                  </VStack>
                </Flex>
              </form>
            </FormProvider>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  )
}

export default PromotionWizard
