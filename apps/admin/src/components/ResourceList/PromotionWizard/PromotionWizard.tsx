import {
  Box,
  Button,
  ButtonGroup,
  Container,
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
  useColorMode,
  useDisclosure,
  useMediaQuery,
  useSteps,
  useToast,
  VStack,
} from '@chakra-ui/react'
import { useMutateOcResource, useOcForm } from '@rwatt451/ordercloud-react'
import { OrderCloudError, Promotion } from 'ordercloud-javascript-sdk'
import { FC, useEffect, useMemo, useState } from 'react'
import { FormProvider, get, SubmitHandler } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../../OperationForm'
import Step1 from './steps/Step1'
import Step2 from './steps/Step2'
import Step3 from './steps/Step3'
import Step4 from './steps/Step4'
import Step5 from './steps/Step5'
import Step6 from './steps/Step6'

interface PromotionWizardProps {}

const PromotionWizard: FC<PromotionWizardProps> = () => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [stepDescriptions, setStepDescriptions] = useState<string[]>([])
  const toast = useToast()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [showUsageOptions, setShowUsageOptions] = useState(false)
  const {colorMode} = useColorMode()

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

  const stepFields = useMemo(() => {
    return [
      ['body.Name', 'body.Description'],
      ['body.StartDate', 'body.EndDate'],
      ['body.LineItemLevel'],
      ['body.AutoApply', 'body.Code'],
      ['body.RedemptionLimit', 'body.RedemptionLimitPerUser', 'body.CanCombine'],
      ['body.EligibleExpression', 'body.ValueExpression'],
    ]
  }, [])

  const invalidSteps = useMemo(() => {
    const errors = methods.formState.errors
    return stepFields
      .map((fieldNames, index) => {
        const hasError = fieldNames.some((fieldName) => get(errors, fieldName))
        return hasError ? index + 1 : null
      })
      .filter((step) => step !== null)
  }, [methods.formState, stepFields])

  const { activeStep, goToNext, goToPrevious, setActiveStep } = useSteps({
    index: 0,
    count: steps.length,
  })

  const handleNextClick = async () => {
    const fieldNames = stepFields[activeStep]
    const isCurrentStepValid = await methods.trigger(fieldNames)
    if (isCurrentStepValid) {
      goToNext()
    }
  }

  const handleStepChange = async (index: number) => {
    const isLastStep = activeStep === stepFields.length - 1
    if (isLastStep) {
      return setActiveStep(index)
    }
    const fieldNames = stepFields[activeStep]
    const isCurrentStepValid = await methods.trigger(fieldNames)
    if (isCurrentStepValid) {
      setActiveStep(index)
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
        return (
          <Step5
            onUpdateDescription={(desc) => updateStepDescription(step, desc)}
            showUsageOptions={showUsageOptions}
            setShowUsageOptions={setShowUsageOptions}
          />
        )
      case 5:
        return <Step6 onUpdateDescription={(desc) => updateStepDescription(step, desc)} />
      default:
        return 'Unknown step'
    }
  }

  const isStepInvalid = (stepIndex: number) => invalidSteps?.includes(stepIndex + 1)

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
                h={{ lg: '80vh' }}
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
                    onClick={() => handleStepChange(index)}
                    w="full"
                  >
                    <StepIndicator
                      sx={
                        isStepInvalid(index)
                          ? {
                              '[data-status=complete] &, [data-status=active] &, [data-status=incomplete] &':
                                {
                                  background: 'red.500 ',
                                  borderColor: 'red.500',
                                  color: colorMode === 'dark' ? 'gray.800' : 'white',
                                },
                            }
                          : {}
                      }
                    >
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
                      minH="100px"
                      rounded="md"
                      mt={-3}
                      mb="6"
                      ml="3"
                      p="3"
                      bgColor={activeStep === index ? 'blackAlpha.200' : ''}
                      border="1px solid"
                      borderColor="transparent"
                      sx={isStepInvalid(index) ? { borderColor: 'red.500' } : {}}
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
                      <FormControl isInvalid={invalidSteps?.length > 0}>
                        <FormErrorMessage>
                          Please resolve the errors on step{invalidSteps?.length > 1 && 's'}{' '}
                          {invalidSteps?.join(', ')}
                        </FormErrorMessage>
                      </FormControl>
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
