import '../styles/globals.css'
import '../styles/fonts.css'
import Layout from "../components/layout";
import { Provider } from 'react-redux';
import { store } from '../redux/store';
import api from '../utils/api';

function MyApp({ Component, pageProps }) {
  return (
      <Provider store={store}>
          <Layout api={api}>
                <Component {...pageProps} api={api}/>
          </Layout>
      </Provider>
  )
}

export default MyApp
