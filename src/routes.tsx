import type { RouteObject } from 'react-router'
import AppLayout from './pages/AppLayout/AppLayout'
import BuilderPage from './pages/BuilderPage/BuilderPage'
import FillPage from './pages/FillPage/FillPage'
import NotFoundPage from './pages/NotFoundPage/NotFoundPage'
import ResponsesPage from './pages/ResponsesPage/ResponsesPage'
import ResponseViewPage from './pages/ResponseViewPage/ResponseViewPage'
import TemplatesListPage from './pages/TemplatesListPage/TemplatesListPage'

// One route table, used by the browser router (App) and by memory routers in tests.
export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <TemplatesListPage /> },
      { path: '/templates/new', element: <BuilderPage /> },
      { path: '/templates/:templateId/edit', element: <BuilderPage /> },
      { path: '/templates/:templateId/fill', element: <FillPage /> },
      { path: '/templates/:templateId/responses', element: <ResponsesPage /> },
      {
        path: '/templates/:templateId/responses/:responseId',
        element: <ResponseViewPage />,
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
