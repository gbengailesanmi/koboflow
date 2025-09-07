export default function ProfilePageClient({user}: any) {
  return (
    <>
    <div>{user.customerId}</div>
    <div>{user.name}</div>
    <div>{user.email}</div>
    </>
  )
}
