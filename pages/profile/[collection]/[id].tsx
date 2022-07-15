import * as React from 'react'
import { useCallback, useState, useReducer, useEffect } from 'react'
import { useRouter } from 'next/router'
import axios from 'axios'
import Link from 'next/link'
import { styled } from 'components/theme'
import { AppLayout } from 'components/Layout/AppLayout'
import { Button } from 'components/Button'
import { PageHeader } from 'components/Layout/PageHeader'
import {
  FILTER_ACCESSORIES,
  FILTER_BACKGROUND,
  FILTER_CLOTHES,
  FILTER_EXPRESSIONS,
  FILTER_EYES,
  FILTER_HELMET,
  FILTER_EARRING,
  FILTER_HEAD,
} from 'store/types'

import {
  ChakraProvider,
  Input,
  InputGroup,
  Image,
  Textarea,
  AspectRatio,
  Stack,
  Table,
  Tbody,
  Tr,
  Td,
  Flex,
  Button as ChakraButton,
  TableContainer,
} from '@chakra-ui/react'
import { toast } from 'react-toastify'
import NFTUpload from 'components/NFTUpload'
import { useRecoilValue, useSetRecoilState } from 'recoil'
import { walletState, WalletStatusType } from 'state/atoms/walletAtoms'
import { Market, CW721, useSdk } from 'services/nft'
import { getCurrentWallet } from 'util/sender-wallet'
import { nftViewFunction, nftFunctionCall, ONE_YOCTO_NEAR } from 'util/near'

const PUBLIC_MARKETPLACE = process.env.NEXT_PUBLIC_MARKETPLACE || ''
const PUBLIC_CW721_BASE_CODE_ID =
  process.env.NEXT_PUBLIC_CW721_BASE_CODE_ID || 388

const PUBLIC_PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY || ''
const PUBLIC_PINATA_SECRET_API_KEY =
  process.env.NEXT_PUBLIC_PINATA_SECRET_API_KEY || ''
const PUBLIC_PINATA_URL = process.env.NEXT_PUBLIC_PINATA_URL || ''

interface NftCollectionInfo {
  readonly id: number
  readonly name: string
}
let filter_status: any = []
export default function CreateNFT() {
  const router = useRouter()
  //const toast = useToast()
  const id = router.asPath.split('/')[3].split('?')[0]
  const collectionId = router.asPath.split('/')[2]
  console.log('id-collectionID: ', id, collectionId)
  const [nftcollections, setNftCollections] = useState<NftCollectionInfo[]>([])
  const [isJsonUploading, setJsonUploading] = useState(false)
  const [imageEdit, setImageEdit] = useState(false)
  const [imgUri, setImgUri] = useState('')
  const [name, setName] = useState('')
  const [externalLink, setExternalLink] = useState('')
  const [description, setDescription] = useState('')
  const [accessories, setAccessories] = useState('none')
  const [background, setBackground] = useState('none')
  const [clothes, setClothes] = useState('none')
  const [earring, setEarring] = useState('none')
  const [expressions, setExpressions] = useState('none')
  const [eyes, setEyes] = useState('none')
  const [head, setHead] = useState('none')
  const [helmet, setHelmet] = useState('none')
  const [price, setPrice] = useState(1)
  const [supply, setSupply] = useState(1)
  const [nftIpfsHash, setNftIpfsHash] = useState('')
  const { client } = useSdk()
  const { address, client: signingClient } = useRecoilValue(walletState)
  const wallet = getCurrentWallet()
  const handleNameChange = (event) => {
    setName(event.target.value)
  }
  const handleExternalLinkChange = (event) => {
    setExternalLink(event.target.value)
  }
  const handleDescriptionChange = (event) => {
    setDescription(event.target.value)
  }
  // reducer function to handle state changes
  const reducer = (state, action) => {
    switch (action.type) {
      case 'SET_IN_DROP_ZONE':
        return { ...state, inDropZone: action.inDropZone }
      case 'ADD_FILE_TO_LIST':
        return { ...state, fileList: state.fileList.concat(action.files) }
      case 'SET_NFT':
        return { ...state, nft: action.nft }
      default:
        return state
    }
  }

  // destructuring state and dispatch, initializing fileList to empty array

  const fetchNFTInfo = async () => {
    const data = await nftViewFunction({
      methodName: 'nft_token',
      args: {
        token_id: `${collectionId}:${id}`,
      },
    })
    console.log('data--1: ', `${collectionId}:${id}`)
    return data
  }

  useEffect(() => {
    ;(async () => {
      if (!wallet.accountName) {
        return
      }
      if (collectionId === '[collectionId]' || id === '[id]') return
      const nftInfo = await fetchNFTInfo()
      let ipfs_nft = await fetch(
        process.env.NEXT_PUBLIC_PINATA_URL + nftInfo.metadata.reference
      )
      const res_nft = await ipfs_nft.json()
      console.log('res_nft: ', res_nft)
      setImgUri(res_nft.uri)
      setName(res_nft.name)
      setExternalLink(res_nft.externalLink)
      setDescription(res_nft.description)
      setAccessories(res_nft.attributes[0].value)
      setBackground(res_nft.attributes[1].value)
      setClothes(res_nft.attributes[2].value)
      setEarring(res_nft.attributes[3].value)
      setExpressions(res_nft.attributes[4].value)
      setEyes(res_nft.attributes[5].value)
      setHead(res_nft.attributes[6].value)
      setHelmet(res_nft.attributes[7].value)
    })()
  }, [wallet.accountName, collectionId, id])

  const [data, dispatch] = useReducer(reducer, {
    inDropZone: false,
    fileList: [],
    nft: '',
  })
  console.log('data: ', data)
  useEffect(() => {
    setImgUri(data.nft)
  }, [data])
  const createNFT = async () => {
    if (!wallet.accountName) {
      toast.warning(`Please connect your wallet.`, {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      })
      return
    }

    if (name == '') {
      toast.warning(`Please input the NFT name.`, {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      })
      return
    }
    const jsonData: any = {}
    jsonData['name'] = name
    jsonData['externalLink'] = externalLink
    jsonData['description'] = description
    jsonData['collectionId'] = collectionId
    jsonData['uri'] = data.nft || imgUri
    jsonData['supply'] = supply
    jsonData['attributes'] = []
    jsonData['attributes'].push({
      trait_type: 'Accessories',
      value: accessories,
    })
    jsonData['attributes'].push({ trait_type: 'Background', value: background })
    jsonData['attributes'].push({ trait_type: 'Clothes', value: clothes })
    jsonData['attributes'].push({ trait_type: 'Earring', value: earring })
    jsonData['attributes'].push({
      trait_type: 'Expressions',
      value: expressions,
    })
    jsonData['attributes'].push({ trait_type: 'Eyes', value: eyes })
    jsonData['attributes'].push({ trait_type: 'Head', value: head })
    jsonData['attributes'].push({ trait_type: 'Helmet', value: helmet })
    jsonData['owner'] = address
    const pinataJson = {
      pinataMetadata: {
        name: name,
      },
      pinataContent: jsonData,
    }
    setJsonUploading(true)
    let url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`
    let response = await axios.post(url, pinataJson, {
      maxBodyLength: Infinity, //this is needed to prevent axios from erroring out with large files
      headers: {
        'Content-Type': `application/json`,
        pinata_api_key: PUBLIC_PINATA_API_KEY,
        pinata_secret_api_key: PUBLIC_PINATA_SECRET_API_KEY,
      },
    })
    let ipfsHash = ''
    if (response.status == 200) {
      console.log('IIPFS Hash: ', response.data.IpfsHash, collectionId)

      ipfsHash = response.data.IpfsHash
      try {
        await nftFunctionCall({
          methodName: 'nft_change_metadata',
          args: {
            token_id: `${collectionId}:${id}`,
            metadata: {
              media: data.nft || imgUri,
              reference: ipfsHash,
            },
          },
          amount: ONE_YOCTO_NEAR,
        })
        toast.success(`You have created your NFT successfully.`, {
          position: 'top-right',
          autoClose: 5000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        })
      } catch (error) {
        console.log('Create series error: ', error)
      }
    }
  }
  return (
    <AppLayout fullWidth={true}>
      <PageHeader title="Edit your NFT Metadata" subtitle="" align="center" />
      <ChakraProvider>
        <Container className="middle mauto">
          <Flex>
            <Stack>
              <h3>
                Image, Video, Audio, Or 3D model
                <span className="required">*</span>
              </h3>
              <Image
                src={process.env.NEXT_PUBLIC_PINATA_URL + imgUri}
                alt="Image"
              />
            </Stack>
            <ChakraButton
              colorScheme="blackAlpha"
              onClick={() => {
                setImageEdit(true)
              }}
            >
              Edit
            </ChakraButton>
          </Flex>
          {imageEdit && (
            <ItemContainer className="collection-item">
              <h3>
                Image, Video, Audio, Or 3D model
                <span className="required">*</span>
              </h3>
              <p>
                File Types Supported: JPG, PNG, GIF, SVG, MP4, WEBM, MP3, WAV,
                OGG, GLB, GIFT. Max size: 100MB
              </p>
              <AspectRatio maxW="1400px" ratio={3.5}>
                <NFTUpload data={data} dispatch={dispatch} item="nft-create" />
              </AspectRatio>
            </ItemContainer>
          )}

          <CollectionItem className="collection-item">
            <h3>
              Name <span className="required">*</span>
            </h3>
            <Input
              pr="48px"
              type="text"
              placeholder="Example: Treasures of the Sea"
              value={name}
              onChange={handleNameChange}
            />
          </CollectionItem>
          <CollectionItem className="collection-item">
            <h3>External Link</h3>
            <p>Please input the url for NFT.</p>
            <InputGroup size="sm">
              <Input
                placeholder="External Link"
                value={externalLink}
                onChange={handleExternalLinkChange}
              />
            </InputGroup>
          </CollectionItem>
          <CollectionItem className="collection-item">
            <h3>Description</h3>
            <p>Markdown syntax is supported. 0 of 1000 characters used.</p>
            <Textarea value={description} onChange={handleDescriptionChange} />
          </CollectionItem>

          <CollectionItem className="collection-item">
            <h3>Properties</h3>
            <Stack spacing={0} className="property-group">
              <TableContainer className="nft-property-tbl-container">
                <Table variant="simple">
                  <Tbody>
                    <Tr>
                      <Td>Accessories</Td>
                      <Td>
                        {FILTER_ACCESSORIES.map((item, index) => (
                          <Button
                            key={`accessories${index}`}
                            variant="secondary"
                            className={`${
                              accessories == item.id ? 'active' : 'default'
                            }`}
                            onClick={() => {
                              if (accessories == item.id) {
                                setAccessories('none')
                              } else {
                                setAccessories(item.id)
                              }

                              return false
                            }}
                          >
                            {item.name}
                          </Button>
                        ))}
                      </Td>
                    </Tr>
                    <Tr>
                      <Td>Background</Td>
                      <Td>
                        {FILTER_BACKGROUND.map((item, index) => (
                          <Button
                            key={`background${index}`}
                            variant="secondary"
                            className={`${
                              background == item.id ? 'active' : 'default'
                            }`}
                            onClick={() => {
                              if (background == item.id) {
                                setBackground('none')
                              } else {
                                setBackground(item.id)
                              }
                              return false
                            }}
                          >
                            {item.name}
                          </Button>
                        ))}
                      </Td>
                    </Tr>
                    <Tr>
                      <Td>Clothes</Td>
                      <Td>
                        {FILTER_CLOTHES.map((item, index) => (
                          <Button
                            key={`clothes${index}`}
                            variant="secondary"
                            className={`${
                              clothes == item.id ? 'active' : 'default'
                            }`}
                            onClick={() => {
                              if (clothes == item.id) {
                                setClothes('none')
                              } else {
                                setClothes(item.id)
                              }
                              return false
                            }}
                          >
                            {item.name}
                          </Button>
                        ))}
                      </Td>
                    </Tr>
                    <Tr>
                      <Td>Earring</Td>
                      <Td>
                        {FILTER_EARRING.map((item, index) => (
                          <Button
                            key={`earring${index}`}
                            variant="secondary"
                            className={`${
                              earring == item.id ? 'active' : 'default'
                            }`}
                            onClick={() => {
                              if (earring == item.id) {
                                setEarring('none')
                              } else {
                                setEarring(item.id)
                              }
                              return false
                            }}
                          >
                            {item.name}
                          </Button>
                        ))}
                      </Td>
                    </Tr>
                    <Tr>
                      <Td>Expressions</Td>
                      <Td>
                        {FILTER_EXPRESSIONS.map((item, index) => (
                          <Button
                            key={`expressions${index}`}
                            variant="secondary"
                            className={`${
                              expressions == item.id ? 'active' : 'default'
                            }`}
                            onClick={() => {
                              if (expressions == item.id) {
                                setExpressions('none')
                              } else {
                                setExpressions(item.id)
                              }
                              return false
                            }}
                          >
                            {item.name}
                          </Button>
                        ))}
                      </Td>
                    </Tr>
                    <Tr>
                      <Td>Eyes</Td>
                      <Td>
                        {FILTER_EYES.map((item, index) => (
                          <Button
                            key={`eyes${index}`}
                            variant="secondary"
                            className={`${
                              eyes == item.id ? 'active' : 'default'
                            }`}
                            onClick={() => {
                              if (eyes == item.id) {
                                setEyes('none')
                              } else {
                                setEyes(item.id)
                              }
                              return false
                            }}
                          >
                            {item.name}
                          </Button>
                        ))}
                      </Td>
                    </Tr>
                    <Tr>
                      <Td>Head</Td>
                      <Td>
                        {FILTER_HEAD.map((item, index) => (
                          <Button
                            key={`head${index}`}
                            variant="secondary"
                            className={`${
                              head == item.id ? 'active' : 'default'
                            }`}
                            onClick={() => {
                              if (head == item.id) {
                                setHead('none')
                              } else {
                                setHead(item.id)
                              }
                              return false
                            }}
                          >
                            {item.name}
                          </Button>
                        ))}
                      </Td>
                    </Tr>
                    <Tr>
                      <Td>Helmet</Td>
                      <Td>
                        {FILTER_HELMET.map((item, index) => (
                          <Button
                            key={`helmet${index}`}
                            variant="secondary"
                            className={`${
                              helmet == item.id ? 'active' : 'default'
                            }`}
                            onClick={() => {
                              if (helmet == item.id) {
                                setHelmet('none')
                              } else {
                                setHelmet(item.id)
                              }
                              return false
                            }}
                          >
                            {item.name}
                          </Button>
                        ))}
                      </Td>
                    </Tr>
                  </Tbody>
                </Table>
              </TableContainer>
            </Stack>
          </CollectionItem>
          <CollectionItem className="collection-item">
            <Button
              className="btn-default"
              css={{
                background: '$black',
                color: '$white',
                stroke: '$white',
              }}
              variant="primary"
              size="large"
              onClick={(e) => {
                createNFT()
              }}
              disabled={isJsonUploading}
            >
              Edit
            </Button>
          </CollectionItem>
        </Container>
      </ChakraProvider>
    </AppLayout>
  )
}

const Container = styled('div', {
  maxWidth: '1400px',
  '.collection-item': {
    marginBottom: '$16',
  },
  h3: {
    fontWeight: 'bold',
  },
  p: {
    color: '$textColors$secondary',
  },
})
const LogoFeaturedContinaer = styled('div', {})
const LogoContainer = styled('div', {})
const FeaturedContainer = styled('div', {})
const ItemContainer = styled('div', {})
const CollectionItem = styled('div', {
  '.link-group': {
    border: '1px solid $chakraborder',
    borderRadius: '$2',
    '.link-item': {
      borderLeft: '0px',
      borderRight: '0px',
      borderTop: '0px',
      borderBottom: '1px solid $chakraborder',
      '>div': {
        border: '0px',
        borderRadius: '0px',
        background: 'transparent',
        paddingRight: '1px',
        svg: {
          marginRight: '$8',
          width: '26px',
          height: '25px',
          path: {
            fill: '$chakraicon',
          },
        },
      },
      '>input': {
        border: '0px',
        borderRadius: '0px',
        paddingLeft: '0px',
        boxShadow: 'none',
      },
      '&.last-item': {
        border: '0px',
      },
    },
  },
  '.chain-group': {
    border: '1px solid $chakraborder',
    borderRadius: '$2',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    img: {
      width: '$8',
      margin: '$4',
    },
  },
  '.property-group': {
    button: {
      '&.active': {
        background: '$backgroundColors$tertiary',
        fontWeight: 'bold',
      },
    },
  },
})
const CheckboxItem = styled('div', {
  display: 'none',
  position: 'absolute',
  top: '$space$27',
  right: '$space$27',
  svg: {
    background: '$black',
    borderRadius: '50%',
    width: '$9',
    height: '$9',
    padding: '$space$3',
    border: '$borderWidths$3 solid $white',
    boxShadow: '0px 4px 44px $backgroundColors$secondary',
  },
})
const Template = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '$8',
  position: 'relative',
})
const Design = styled('div', {
  display: 'flex',
  justifyContent: 'center',
  gap: '$4',
})
const ExplicitItem = styled('div', {
  display: 'flex',
  '.chakra-switch': {
    marginLeft: 'auto',
    '>span[data-checked]': {
      background: '$black',
    },
  },
})
const TokenItem = styled('div', {
  flexDirection: 'row',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
})
