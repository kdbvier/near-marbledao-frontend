import React from 'react'
import {
  Table,
  Thead,
  Tbody,
  Tfoot,
  Tr,
  Th,
  Td,
  TableCaption,
  TableContainer,
} from '@chakra-ui/react'
import { convertMicroDenomToDenom } from 'util/conversion'

const SimpleTable = ({ data, unit }) => {
  return (
    <TableContainer>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Number</Th>
            <Th>Bidder</Th>
            <Th>Price</Th>
          </Tr>
        </Thead>
        <Tbody>
          {data.map((element, index) => (
            <Tr key={index}>
              <Td>{index + 1}</Td>
              <Td>{element.bidder_id}</Td>
              <Td>
                {convertMicroDenomToDenom(element.price, unit).toFixed(2)}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  )
}

export default SimpleTable
