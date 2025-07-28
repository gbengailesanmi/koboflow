import * as Styled from './styles'
import type { TransactionsType } from '@/types/transactions'
import { Box, Card, Flex, Text } from '@radix-ui/themes'
import { DownloadIcon, UploadIcon } from '@radix-ui/react-icons'

export default function TransactionsColumn({ transactions }: TransactionsType) {
	return (
		<Styled.TransactionsWrapper>
			{transactions.map(transaction => {
				const isDebit = Number(transaction.amount.value.unscaledValue) < 0
				const amountColor = isDebit ? 'red' : 'green'
				const Icon = isDebit ? UploadIcon : DownloadIcon

				function getAmount(amount: { value: { unscaledValue: string; scale: string }; currencyCode: string }): import("react").ReactNode {
					const { unscaledValue, scale } = amount.value
					const scaled = Number(unscaledValue) / Math.pow(10, Number(scale))
					return `${scaled.toLocaleString(undefined, { minimumFractionDigits: Number(scale), maximumFractionDigits: Number(scale) })} ${amount.currencyCode}`
				}
				return (
					<Styled.BoxWrapper key={transaction.id}>
						<Box width='100%'>
							<Card>
								<Flex gap="3" align="center">
									<Icon />
									<Box>
										<Text as="div" size="2">
											{isDebit ? 'Sent money' : 'Receive money'}
										</Text>
										<Text as="div" size="2" weight="bold">
											{transaction.descriptions.display}
										</Text>
										<Text as="div" size="1">
											{transaction.dates.booked}
										</Text>
									</Box>
									<Flex align="center" justify="end" style={{ flex: 1 }}>
										<Text as="div" size="3" weight="bold" color={amountColor}>
											{getAmount(transaction.amount)}
										</Text>
									</Flex>
								</Flex>
							</Card>
						</Box>
					</Styled.BoxWrapper>
				)
			})}
		</Styled.TransactionsWrapper>
	)
}
