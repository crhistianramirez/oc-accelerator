import {
  Box,
  Button,
  ButtonGroup,
  Container,
  Flex,
  FormControl,
  FormErrorMessage,
  Hide,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  Show,
  Step,
  StepDescription,
  StepIndicator,
  StepNumber,
  Stepper,
  StepSeparator,
  StepStatus,
  StepTitle,
  Text,
  theme,
  useDisclosure,
  useMediaQuery,
  useSteps,
  useToast,
  VStack,
} from '@chakra-ui/react'
import { useMutateOcResource, useOcForm } from '@rwatt451/ordercloud-react'
import { get } from 'lodash'
import { OrderCloudError, Promotion } from 'ordercloud-javascript-sdk'
import { FC, useEffect, useMemo, useState } from 'react'
import { FormProvider, SubmitHandler } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../../OperationForm'
import { ExpressionRecipesSelect } from '../../OperationForm/ExpressionBuilder/ExpressionRecipes/ExpressionRecipesSelect'
import { formatQuery } from '../../OperationForm/ExpressionBuilder/PromotionExpressionBuilder/formatQuery'
import Step1 from './steps/Step1'
import Step2 from './steps/Step2'
import Step3 from './steps/Step3'
import Step4 from './steps/Step4'
import Step5 from './steps/Step5'

interface PromotionWizardProps {}

const PromotionWizard: FC<PromotionWizardProps> = () => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [stepDescriptions, setStepDescriptions] = useState<string[]>([])
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
    return !!get(errors, 'EligibleExpression') || !!get(errors, 'ValueExpression')
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

  const handleNextClick = async () => {
    const fieldNames = stepFields[activeStep]
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

  const [belowLg] = useMediaQuery(`(max-width: ${theme.breakpoints['lg']})`, {
    ssr: true,
    fallback: false, // return false on the server, and re-evaluate on the client side
  })

  const updateStepDescription = (stepIndex: number, description: any) => {
    setStepDescriptions((prev) => {
      const updated = [...prev]
      updated[stepIndex] = description
      return updated
    })
  }

  const handleExpressionChange = (eligibleExpressionQuery: any, valueExpressionQuery: any) => {
    const lineItemLevel = methods.watch('body.LineItemLevel')

    const eligibleExpression = formatQuery(eligibleExpressionQuery, lineItemLevel)
    const valueExpression = formatQuery(valueExpressionQuery, lineItemLevel)

    methods.setValue('body.EligibleExpression', eligibleExpression)
    methods.setValue('body.ValueExpression', valueExpression)
  }

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return <Step1 onUpdateDescription={(desc) => updateStepDescription(step, desc)} />
      case 1:
        return <Step2 onUpdateDescription={(desc) => updateStepDescription(step, desc)} />
      case 2:
        return <Step3 onUpdateDescription={(desc) => updateStepDescription(step, desc)} />
      case 3:
        return <Step4 onUpdateDescription={(desc) => updateStepDescription(step, desc)} />
      case 4:
        return <Step5 onUpdateDescription={(desc) => updateStepDescription(step, desc)} />
      case 5:
        return (
          <>
            <FormControl isInvalid={isMissingRecipe}>
              <FormErrorMessage>Please select a recipe and submit again.</FormErrorMessage>
            </FormControl>
            <ExpressionRecipesSelect
              type="Promotion"
              onChange={handleExpressionChange}
            />
          </>
        )
      default:
        return 'Unknown step'
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
          <ModalCloseButton />
          <ModalBody>
            <Container
              maxW="container.xl"
              display="grid"
              gridTemplateColumns={{ lg: '1fr 3fr' }}
              mt="10vh"
            >
              <Stepper
                maxW="100%"
                overflowX="auto"
                h={{ lg: '75vh' }}
                alignItems={belowLg ? 'flex-start' : 'center'}
                orientation={belowLg ? 'horizontal' : 'vertical'}
                colorScheme="primary"
                index={activeStep}
                gap={0}
                p={8}
              >
                {steps.map((step, index) => (
                  <Box
                    id="step"
                    as={Step}
                    key={index}
                    onClick={() => setActiveStep(index)}
                    w="full"
                  >
                    <StepIndicator>
                      <StepStatus
                        complete={<StepNumber />}
                        incomplete={<StepNumber />}
                        active={<StepNumber />}
                      />
                    </StepIndicator>
                    <VStack
                      alignItems="flex-start"
                      cursor="pointer"
                      w="full"
                      minH="50px"
                      rounded="md"
                      mt={-3}
                      mb="6"
                      ml="3"
                      p="3"
                      bgColor={activeStep === index ? 'blackAlpha.200' : ''}
                      _hover={{ bgColor: 'blackAlpha.200' }}
                    >
                      <StepTitle>{step}</StepTitle>
                      <Hide below="xl">
                        <StepDescription>{stepDescriptions[index] || ''}</StepDescription>
                      </Hide>
                    </VStack>
                    <StepSeparator />
                  </Box>
                ))}
              </Stepper>
              <VStack
                alignItems="flex-start"
                borderLeft={!belowLg ? '1px solid' : ''}
                borderColor="chakra-border-color"
                pl={16}
                py={8}
                w="full"
              >
                <Show below="xl">
                  <Text>
                    Step {activeStep + 1}: {steps[activeStep]}
                  </Text>
                </Show>
                <FormProvider {...methods}>
                  <Box
                  h="full"
                    as="form"
                    w="full"
                    name="PROMOTION_FORM"
                    onSubmit={methods.handleSubmit(onSubmit)}
                  >
                    <VStack
                      boxSize="full"
                      alignItems="stretch"
                      maxW={500}
                    >
                      {renderStepContent(activeStep)}
                      <ButtonGroup
                        mt="auto"
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
                          display={activeStep < steps.length - 1 ? 'none' : 'block'}
                        >
                          Submit
                        </Button>
                      </ButtonGroup>
                    </VStack>
                  </Box>
                </FormProvider>
              </VStack>
            </Container>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  )
}

export default PromotionWizard
