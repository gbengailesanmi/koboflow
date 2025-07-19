'use client'

import { Flex, Text, Button } from "@radix-ui/themes"
import * as Styled from "./styles/pageStyle"

export default function MyApp() {
	return (
		<Flex direction="column" gap="2">
      <div className="text-2xl font-bold text-green-600">Welcome to the Portfolio Page</div>
			<Text>Hello from Radix Themes </Text>
      <Styled.ButtonContainer>
        <Button size="3" variant="solid" color="green">
          Click Me
        </Button>
      </Styled.ButtonContainer>
		</Flex>
	)
}
