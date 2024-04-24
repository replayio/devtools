import './api/server'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'

import { worker } from './api/server'
import App from './App'
import { fetchTodos } from './features/todos/todosSlice'
import { store } from './store'
import './index.css'

async function bootstrap() {
  const baseUrl =
    process.env.NODE_ENV === 'production'
      ? '/recording/test/examples/redux-fundamentals/dist'
      : ''
  await worker.start({
    waitUntilReady: true,
    serviceWorker: {
      url: baseUrl + '/mockServiceWorker.js',
    },
  })

  store.dispatch(fetchTodos())

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </React.StrictMode>
  )
}

bootstrap()
