import Link from 'next/link'
 
export default function NotFound() {
  return (
    <div className='not-found-container'>
      <div>
        <h1 class="next-error-h1">404</h1>
        <div className='next-error-description'>
          <h2>Цю сторінку не вдалося знайти.</h2>
          </div>
      </div>
      <Link className='next-error-link-to-homepage' href="/uk">На головну</Link>
    </div>
  )
}
