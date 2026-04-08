import { type ReactElement } from 'react'
import { Navigate } from 'react-router-dom'
import { ROUTE_PATHS } from '@/routes/paths'
import { isAdminAuthenticated } from '@/services/adminAuth'

type AdminRouteProps = {
  element: ReactElement
}

const AdminRoute = ({ element }: AdminRouteProps) => {
  const isAllowed = isAdminAuthenticated()

  if (!isAllowed) {
    return (
      <Navigate
        to={ROUTE_PATHS.admin.login}
        replace
        state={{ from: ROUTE_PATHS.admin.home }}
      />
    )
  }

  return element
}

export default AdminRoute
