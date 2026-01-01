'use client'

import { DetailPage } from '@/app/components/detail-page'
import { PersonIcon, EnvelopeClosedIcon, MobileIcon, HomeIcon, CalendarIcon, IdCardIcon } from '@radix-ui/react-icons'

type PersonalDetailsClientProps = {
  customerId: string
  firstName: string
  lastName: string
  email: string
  bvn: string
  dob: string
  phone: string
  gender: string
  addressLine1: string
  addressLine2: string
  maritalStatus: string
}

export default function PersonalDetailsClient({
  customerId,
  firstName,
  lastName,
  email,
  bvn,
  dob,
  phone,
  gender,
  addressLine1,
  addressLine2,
  maritalStatus,
}: PersonalDetailsClientProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return '—'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return dateString
    }
  }

  const formatAddress = () => {
    const parts = [addressLine1, addressLine2].filter(Boolean)
    return parts.length > 0 ? parts.join(', ') : '—'
  }

  const detailItems = [
    {
      label: 'First Name',
      value: firstName,
      icon: <PersonIcon />,
    },
    {
      label: 'Last Name',
      value: lastName,
      icon: <PersonIcon />,
    },
    {
      label: 'Email Address',
      value: email,
      icon: <EnvelopeClosedIcon />,
    },
    {
      label: 'Phone Number',
      value: phone,
      icon: <MobileIcon />,
    },
    {
      label: 'BVN',
      value: bvn ? `${bvn.slice(0, 3)}****${bvn.slice(-3)}` : '—',
      icon: <IdCardIcon />,
    },
    {
      label: 'Date of Birth',
      value: formatDate(dob),
      icon: <CalendarIcon />,
    },
    {
      label: 'Gender',
      value: gender ? gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase() : '—',
      icon: <PersonIcon />,
    },
    {
      label: 'Marital Status',
      value: maritalStatus ? maritalStatus.charAt(0).toUpperCase() + maritalStatus.slice(1).toLowerCase() : '—',
      icon: <PersonIcon />,
    },
    {
      label: 'Address',
      value: formatAddress(),
      icon: <HomeIcon />,
    },
  ]

  return (
    <DetailPage
      title="Personal Details"
      subtitle="Your personal information from your bank verification"
      items={detailItems}
      customerId={customerId}
    />
  )
}
