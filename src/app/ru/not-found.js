import Link from 'next/link';
import { generate404MetaData } from '../../helpers/index';

export function generateMetadata() {
  return generate404MetaData();
}

export default function NotFound() {
  return (
    <div className='not-found-container'>
      <div>
        <h1 className="next-error-h1">404</h1>
        <div className='next-error-description'>
          <h2>Эта страница не может быть найдена.</h2>
          </div>
      </div>
      <Link className='next-error-link-to-homepage' href="/ru">На главную</Link>
    </div>
  )
}
