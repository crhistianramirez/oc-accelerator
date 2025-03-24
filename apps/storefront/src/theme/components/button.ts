import { defineStyle, defineStyleConfig } from "@chakra-ui/styled-system"

const baseStyle = defineStyle({
  rounded: "lg",
})

const buttonTheme = defineStyleConfig({
  baseStyle,
})

const Button = {
  ...buttonTheme
}

export default Button
